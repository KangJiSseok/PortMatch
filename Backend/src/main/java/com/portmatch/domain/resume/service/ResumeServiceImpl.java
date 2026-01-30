package com.portmatch.domain.resume.service;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.domain.resume.dto.*;
import com.portmatch.domain.resume.entity.*;
import com.portmatch.domain.resume.repository.ProfileImageRepository;
import com.portmatch.domain.resume.repository.ResumeCareerEntryRepository;
import com.portmatch.domain.resume.repository.ResumeEducationEntryRepository;
import com.portmatch.domain.resume.repository.ResumeProfileRepository;
import com.portmatch.domain.resume.repository.ResumeRepository;
import com.portmatch.domain.resume.repository.SelfIntroductionRepository;
import com.portmatch.global.config.AwsS3Properties;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResumeServiceImpl implements ResumeService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeProfileRepository resumeProfileRepository;
    private final ResumeCareerEntryRepository resumeCareerEntryRepository;
    private final ResumeEducationEntryRepository resumeEducationEntryRepository;
    private final PortfolioRepository portfolioRepository;
    private final ProfileImageRepository profileImageRepository;
    private final SelfIntroductionRepository selfIntroductionRepository;
    private final S3Presigner s3Presigner;
    private final AwsS3Properties awsS3Properties;

    @Override
    public ResumeResponse createResume(Long userId, ResumeCreateRequest request) {
        User user = getUser(userId);
        boolean hasMain = resumeRepository.existsByUser_IdAndIsMainTrue(userId);
        boolean isMain = request.getIsMain() != null && request.getIsMain();
        if (!hasMain) {
            isMain = true;
        }
        if (isMain) {
            unsetMainIfExists(userId);
        }
        Resume resume = Resume.create(user, request.getTitle(), isMain);
        Resume saved = resumeRepository.save(resume);
        Long resumeId = saved.getId();

        if (request.getProfile() != null) {
            upsertProfile(userId, resumeId, request.getProfile());
        }
        if (request.getPortfolio() != null) {
            uploadPortfolio(userId, resumeId, request.getPortfolio());
        }
        if (request.getCareers() != null && !request.getCareers().isEmpty()) {
            request.getCareers().forEach(item -> addCareer(userId, resumeId, item));
        }
        if (request.getEducations() != null && !request.getEducations().isEmpty()) {
            request.getEducations().forEach(item -> addEducation(userId, resumeId, item));
        }
        if (request.getSelfIntroductions() != null && !request.getSelfIntroductions().isEmpty()) {
            createSelfIntroductionsWithAnswers(saved, request.getSelfIntroductions());
        }
        return toResumeResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeSummaryResponse> getResumes(Long userId) {
        return resumeRepository.findAllByUser_IdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResumeSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeResponse getResume(Long userId, Long resumeId) {
        Resume resume = getResumeOwned(userId, resumeId);
        return toResumeResponse(resume);
    }

    @Override
    public ResumeResponse updateResume(Long userId, Long resumeId, ResumeUpdateRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        resume.updateTitle(request.getTitle());
        return toResumeResponse(resume);
    }

    @Override
    public void deleteResume(Long userId, Long resumeId) {
        Resume resume = getResumeOwned(userId, resumeId);
        List<Resume> resumes = resumeRepository.findAllByUser_IdOrderByUpdatedAtDesc(userId);
        if (resumes.size() <= 1) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        }
        boolean wasMain = Boolean.TRUE.equals(resume.getIsMain());
        resumeRepository.delete(resume);
        if (wasMain) {
            resumes.stream()
                    .filter(item -> !item.getId().equals(resumeId))
                    .findFirst()
                    .ifPresent(item -> item.markMain(true));
        }
    }

    @Override
    public void setMainResume(Long userId, Long resumeId) {
        Resume resume = getResumeOwned(userId, resumeId);
        if (Boolean.TRUE.equals(resume.getIsMain())) {
            return;
        }
        unsetMainIfExists(userId);
        resume.markMain(true);
    }

    @Override
    public ProfileResponse upsertProfile(Long userId, Long resumeId, ProfileUpsertRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        ResumeProfile profile = resumeProfileRepository.findByResume_Id(resumeId)
                .orElse(null);
        if (profile == null) {
            profile = ResumeProfile.create(
                    resume,
                    request.getName(),
                    request.getContact(),
                    request.getEmail(),
                    request.getAddress()
            );
            resume.setProfile(profile);
        } else {
            profile.update(
                    request.getName(),
                    request.getContact(),
                    request.getEmail(),
                    request.getAddress()
            );
        }
        if (request.getProfileImageId() != null) {
            ProfileImage profileImage = getProfileImageOwned(userId, request.getProfileImageId());
            profile.updateProfileImage(profileImage);
        }
        ResumeProfile saved = resumeProfileRepository.save(profile);
        return toProfileResponse(saved);
    }

    @Override
    public ProfileResponse updateProfileImage(Long userId, Long resumeId, Long profileImageId) {
        ResumeProfile profile = getProfileOwned(userId, resumeId);
        ProfileImage profileImage = getProfileImageOwned(userId, profileImageId);
        profile.updateProfileImage(profileImage);
        return toProfileResponse(profile);
    }

    @Override
    public void deleteProfileImage(Long userId, Long resumeId) {
        ResumeProfile profile = getProfileOwned(userId, resumeId);
        profile.clearProfileImage();
    }

    @Override
    public CareerResponse addCareer(Long userId, Long resumeId, CareerCreateRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            orderIndex = nextOrderIndex(
                    resumeCareerEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resumeId).stream()
                            .map(ResumeCareerEntry::getOrderIndex)
                            .toList()
            );
        }
        ResumeCareerEntry entry = ResumeCareerEntry.create(
                resume,
                request.getCompany(),
                request.getRole(),
                request.getPeriodStart(),
                request.getPeriodEnd(),
                request.getEmploymentStatus(),
                request.getDescription(),
                orderIndex
        );
        ResumeCareerEntry saved = resumeCareerEntryRepository.save(entry);
        return toCareerResponse(saved);
    }

    @Override
    public CareerResponse updateCareer(Long userId, Long resumeId, Long careerId, CareerUpdateRequest request) {
        getResumeOwned(userId, resumeId);
        ResumeCareerEntry entry = resumeCareerEntryRepository.findByIdAndResume_Id(careerId, resumeId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        entry.update(
                request.getCompany(),
                request.getRole(),
                request.getPeriodStart(),
                request.getPeriodEnd(),
                request.getEmploymentStatus(),
                request.getDescription(),
                request.getOrderIndex()
        );
        return toCareerResponse(entry);
    }

    @Override
    public void deleteCareer(Long userId, Long resumeId, Long careerId) {
        getResumeOwned(userId, resumeId);
        ResumeCareerEntry entry = resumeCareerEntryRepository.findByIdAndResume_Id(careerId, resumeId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        resumeCareerEntryRepository.delete(entry);
    }

    @Override
    public void reorderCareers(Long userId, Long resumeId, CareerReorderRequest request) {
        getResumeOwned(userId, resumeId);
        List<Long> ids = request.getItems().stream()
                .map(OrderIndexItem::getId)
                .toList();
        List<ResumeCareerEntry> entries = resumeCareerEntryRepository.findAllByResume_IdAndIdIn(resumeId, ids);
        if (entries.size() != ids.size()) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        Map<Long, ResumeCareerEntry> entryMap = entries.stream()
                .collect(Collectors.toMap(ResumeCareerEntry::getId, item -> item));
        request.getItems().forEach(item -> {
            ResumeCareerEntry entry = entryMap.get(item.getId());
            entry.update(
                    entry.getCompany(),
                    entry.getRole(),
                    entry.getPeriodStart(),
                    entry.getPeriodEnd(),
                    entry.getEmploymentStatus(),
                    entry.getDescription(),
                    item.getOrderIndex()
            );
        });
    }

    @Override
    public EducationResponse addEducation(Long userId, Long resumeId, EducationCreateRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            orderIndex = nextOrderIndex(
                    resumeEducationEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resumeId).stream()
                            .map(ResumeEducationEntry::getOrderIndex)
                            .toList()
            );
        }
        ResumeEducationEntry entry = ResumeEducationEntry.create(
                resume,
                request.getSchool(),
                request.getMajor(),
                request.getDegree(),
                request.getPeriodStart(),
                request.getPeriodEnd(),
                request.getStatus(),
                orderIndex
        );
        ResumeEducationEntry saved = resumeEducationEntryRepository.save(entry);
        return toEducationResponse(saved);
    }

    @Override
    public EducationResponse updateEducation(Long userId, Long resumeId, Long educationId, EducationUpdateRequest request) {
        getResumeOwned(userId, resumeId);
        ResumeEducationEntry entry = resumeEducationEntryRepository.findByIdAndResume_Id(educationId, resumeId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        entry.update(
                request.getSchool(),
                request.getMajor(),
                request.getDegree(),
                request.getPeriodStart(),
                request.getPeriodEnd(),
                request.getStatus(),
                request.getOrderIndex()
        );
        return toEducationResponse(entry);
    }

    @Override
    public void deleteEducation(Long userId, Long resumeId, Long educationId) {
        getResumeOwned(userId, resumeId);
        ResumeEducationEntry entry = resumeEducationEntryRepository.findByIdAndResume_Id(educationId, resumeId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        resumeEducationEntryRepository.delete(entry);
    }

    @Override
    public void reorderEducations(Long userId, Long resumeId, EducationReorderRequest request) {
        getResumeOwned(userId, resumeId);
        List<Long> ids = request.getItems().stream()
                .map(OrderIndexItem::getId)
                .toList();
        List<ResumeEducationEntry> entries = resumeEducationEntryRepository.findAllByResume_IdAndIdIn(resumeId, ids);
        if (entries.size() != ids.size()) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        Map<Long, ResumeEducationEntry> entryMap = entries.stream()
                .collect(Collectors.toMap(ResumeEducationEntry::getId, item -> item));
        request.getItems().forEach(item -> {
            ResumeEducationEntry entry = entryMap.get(item.getId());
            entry.update(
                    entry.getSchool(),
                    entry.getMajor(),
                    entry.getDegree(),
                    entry.getPeriodStart(),
                    entry.getPeriodEnd(),
                    entry.getStatus(),
                    item.getOrderIndex()
            );
        });
    }

    @Override
    public ResumePortfolioResponse uploadPortfolio(Long userId, Long resumeId, ResumePortfolioUpdateRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(request.getPortfolioId(), userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));
        if (resumeRepository.existsByPortfolio_Id(portfolio.getId())
                && (resume.getPortfolio() == null || !portfolio.getId().equals(resume.getPortfolio().getId()))) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        }
        resume.setPortfolio(portfolio);
        return toPortfolioResponse(portfolio, resume.getId());
    }

    @Override
    public void deletePortfolio(Long userId, Long resumeId) {
        Resume resume = getResumeOwned(userId, resumeId);
        resume.setPortfolio(null);
    }

    @Override
    public SelfIntroductionResponse addSelfIntroduction(Long userId, Long resumeId, SelfIntroductionCreateRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            orderIndex = nextOrderIndex(
                    selfIntroductionRepository.findAllByResume_IdOrderByOrderIndexAsc(resumeId).stream()
                            .map(SelfIntroduction::getOrderIndex)
                            .toList()
            );
        }
        SelfIntroduction selfIntroduction = SelfIntroduction.create(
                resume,
                request.getTitle(),
                request.getAnswerText(),
                orderIndex
        );
        SelfIntroduction saved = selfIntroductionRepository.save(selfIntroduction);
        return toSelfIntroductionResponse(saved);
    }

    @Override
    public SelfIntroductionResponse updateSelfIntroduction(Long userId, Long resumeId, Long selfIntroductionId, SelfIntroductionUpdateRequest request) {
        SelfIntroduction selfIntroduction = getSelfIntroductionOwned(userId, resumeId, selfIntroductionId);
        selfIntroduction.update(request.getTitle(), request.getAnswerText(), request.getOrderIndex());
        return toSelfIntroductionResponse(selfIntroduction);
    }

    @Override
    public void deleteSelfIntroduction(Long userId, Long resumeId, Long selfIntroductionId) {
        SelfIntroduction selfIntroduction = getSelfIntroductionOwned(userId, resumeId, selfIntroductionId);
        selfIntroductionRepository.delete(selfIntroduction);
    }

    @Override
    public void reorderSelfIntroductions(Long userId, Long resumeId, SelfIntroductionReorderRequest request) {
        getResumeOwned(userId, resumeId);
        List<Long> ids = request.getItems().stream()
                .map(OrderIndexItem::getId)
                .toList();
        List<SelfIntroduction> introductions = selfIntroductionRepository.findAllByResume_IdAndIdIn(resumeId, ids);
        if (introductions.size() != ids.size()) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        Map<Long, SelfIntroduction> introMap = introductions.stream()
                .collect(Collectors.toMap(SelfIntroduction::getId, item -> item));
        request.getItems().forEach(item -> {
            SelfIntroduction intro = introMap.get(item.getId());
            intro.update(intro.getTitle(), intro.getAnswerText(), item.getOrderIndex());
        });
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));
    }

    private Resume getResumeOwned(Long userId, Long resumeId) {
        return resumeRepository.findByIdAndUser_Id(resumeId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    private ResumeProfile getProfileOwned(Long userId, Long resumeId) {
        getResumeOwned(userId, resumeId);
        return resumeProfileRepository.findByResume_Id(resumeId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    private ProfileImage getProfileImageOwned(Long userId, Long profileImageId) {
        return profileImageRepository.findByIdAndUser_Id(profileImageId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PROFILE_IMAGE_NOT_FOUND));
    }

    private SelfIntroduction getSelfIntroductionOwned(Long userId, Long resumeId, Long selfIntroductionId) {
        getResumeOwned(userId, resumeId);
        return selfIntroductionRepository.findByIdAndResume_Id(selfIntroductionId, resumeId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    private void unsetMainIfExists(Long userId) {
        resumeRepository.findByUser_IdAndIsMainTrue(userId)
                .ifPresent(item -> item.markMain(false));
    }

    private int nextOrderIndex(List<Integer> existingOrderIndexes) {
        return existingOrderIndexes.stream()
                .max(Integer::compareTo)
                .orElse(-1) + 1;
    }

    private void createSelfIntroductionsWithAnswers(
            Resume resume,
            List<SelfIntroductionCreateWithQuestionsRequest> selfIntroductions
    ) {
        List<Integer> introOrderIndexes = new java.util.ArrayList<>(
                selfIntroductionRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId()).stream()
                        .map(SelfIntroduction::getOrderIndex)
                        .toList()
        );

        for (SelfIntroductionCreateWithQuestionsRequest introRequest : selfIntroductions) {
            Integer orderIndex = introRequest.getOrderIndex();
            if (orderIndex == null) {
                orderIndex = nextOrderIndex(introOrderIndexes);
            }
            introOrderIndexes.add(orderIndex);

            SelfIntroduction intro = SelfIntroduction.create(
                    resume,
                    introRequest.getTitle(),
                    introRequest.getAnswerText(),
                    orderIndex
            );
            selfIntroductionRepository.save(intro);
        }
    }

    private ResumeSummaryResponse toResumeSummaryResponse(Resume resume) {
        return ResumeSummaryResponse.builder()
                .id(resume.getId())
                .title(resume.getTitle())
                .isMain(resume.getIsMain())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }

    private ResumeResponse toResumeResponse(Resume resume) {
        ResumeProfile profile = resumeProfileRepository.findByResume_Id(resume.getId()).orElse(null);
        Portfolio portfolio = resume.getPortfolio();
        List<ResumeCareerEntry> careers = resumeCareerEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId());
        List<ResumeEducationEntry> educations = resumeEducationEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId());
        List<SelfIntroduction> introductions = selfIntroductionRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId());

        List<SelfIntroductionResponse> introductionResponses = introductions.stream()
                .map(this::toSelfIntroductionResponse)
                .toList();

        return ResumeResponse.builder()
                .id(resume.getId())
                .userId(resume.getUser().getId())
                .title(resume.getTitle())
                .isMain(resume.getIsMain())
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .profile(toProfileResponse(profile))
                .portfolio(toPortfolioResponse(portfolio, resume.getId()))
                .careers(careers.stream().map(this::toCareerResponse).toList())
                .educations(educations.stream().map(this::toEducationResponse).toList())
                .selfIntroductions(introductionResponses)
                .build();
    }

    private ProfileResponse toProfileResponse(ResumeProfile profile) {
        if (profile == null) {
            return null;
        }
        ProfileImage profileImage = profile.getProfileImage();
        String presignedUrl = null;
        if (profileImage != null) {
            presignedUrl = buildProfileImagePresignedUrl(profileImage, 10);
        }
        return ProfileResponse.builder()
                .id(profile.getId())
                .resumeId(profile.getResume().getId())
                .name(profile.getName())
                .contact(profile.getContact())
                .email(profile.getEmail())
                .address(profile.getAddress())
                .profileImageId(profileImage != null ? profileImage.getId() : null)
                .profileImageUrl(presignedUrl)
                .profileImageName(profileImage != null ? profileImage.getImageName() : null)
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private String buildProfileImagePresignedUrl(ProfileImage profileImage, int minutes) {
        int expiresInMinutes = Math.max(1, minutes);
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(profileImage.getImageKey())
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiresInMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }

    private CareerResponse toCareerResponse(ResumeCareerEntry entry) {
        return CareerResponse.builder()
                .id(entry.getId())
                .resumeId(entry.getResume().getId())
                .company(entry.getCompany())
                .role(entry.getRole())
                .periodStart(entry.getPeriodStart())
                .periodEnd(entry.getPeriodEnd())
                .employmentStatus(entry.getEmploymentStatus())
                .description(entry.getDescription())
                .orderIndex(entry.getOrderIndex())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private EducationResponse toEducationResponse(ResumeEducationEntry entry) {
        return EducationResponse.builder()
                .id(entry.getId())
                .resumeId(entry.getResume().getId())
                .school(entry.getSchool())
                .major(entry.getMajor())
                .degree(entry.getDegree())
                .periodStart(entry.getPeriodStart())
                .periodEnd(entry.getPeriodEnd())
                .status(entry.getStatus())
                .orderIndex(entry.getOrderIndex())
                .createdAt(entry.getCreatedAt())
                .updatedAt(entry.getUpdatedAt())
                .build();
    }

    private ResumePortfolioResponse toPortfolioResponse(Portfolio portfolio, Long resumeId) {
        if (portfolio == null) {
            return null;
        }
        return ResumePortfolioResponse.builder()
                .portfolioId(portfolio.getId())
                .resumeId(resumeId)
                .fileUrl(portfolio.getFileUrl())
                .originalFilename(portfolio.getOriginalFilename())
                .contentType(portfolio.getContentType())
                .fileSize(portfolio.getFileSize())
                .createdAt(portfolio.getCreatedAt())
                .build();
    }

    private SelfIntroductionResponse toSelfIntroductionResponse(SelfIntroduction selfIntroduction) {
        return SelfIntroductionResponse.builder()
                .id(selfIntroduction.getId())
                .resumeId(selfIntroduction.getResume().getId())
                .title(selfIntroduction.getTitle())
                .answerText(selfIntroduction.getAnswerText())
                .orderIndex(selfIntroduction.getOrderIndex())
                .createdAt(selfIntroduction.getCreatedAt())
                .updatedAt(selfIntroduction.getUpdatedAt())
                .build();
    }
}
