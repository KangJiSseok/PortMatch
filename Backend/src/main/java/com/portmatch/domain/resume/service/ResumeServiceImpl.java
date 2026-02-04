package com.portmatch.domain.resume.service;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.jobapplication.service.JobApplicationResumeSnapshotService;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.domain.resume.dto.CareerCreateRequest;
import com.portmatch.domain.resume.dto.CareerResponse;
import com.portmatch.domain.resume.dto.EducationCreateRequest;
import com.portmatch.domain.resume.dto.EducationResponse;
import com.portmatch.domain.resume.dto.ProfileResponse;
import com.portmatch.domain.resume.dto.ProfileUpsertRequest;
import com.portmatch.domain.resume.dto.ResumeCreateRequest;
import com.portmatch.domain.resume.dto.ResumePortfolioResponse;
import com.portmatch.domain.resume.dto.ResumePortfolioUpdateRequest;
import com.portmatch.domain.resume.dto.ResumeResponse;
import com.portmatch.domain.resume.dto.ResumeSummaryResponse;
import com.portmatch.domain.resume.dto.SelfIntroductionCreateWithQuestionsRequest;
import com.portmatch.domain.resume.dto.SelfIntroductionResponse;
import com.portmatch.domain.resume.entity.*;
import com.portmatch.domain.resume.repository.ProfileImageRepository;
import com.portmatch.domain.resume.repository.ResumeCareerEntryRepository;
import com.portmatch.domain.resume.repository.ResumeEducationEntryRepository;
import com.portmatch.domain.resume.repository.ResumeProfileRepository;
import com.portmatch.domain.resume.repository.ResumeRepository;
import com.portmatch.domain.resume.repository.SelfIntroductionRepository;
import com.portmatch.domain.jobapplication.entity.JobApplication;
import com.portmatch.domain.jobapplication.repository.JobApplicationRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
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
import java.util.Optional;

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
    private final JobApplicationRepository jobApplicationRepository;
    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository companyRepository;
    private final JobApplicationResumeSnapshotService resumeSnapshotService;
    private final S3Presigner s3Presigner;
    private final AwsS3Properties awsS3Properties;

    @Override
    public ResumeResponse createResume(Long userId, ResumeCreateRequest request) {
        User user = getUser(userId);
        boolean hasMain = resumeRepository.existsByUser_IdAndIsMainTrue(userId);
        boolean requestMain = Boolean.TRUE.equals(request.getIsMain());
        boolean shouldBeMain = requestMain || !hasMain;
        boolean createAsMain = shouldBeMain && !hasMain;
        Resume resume = Resume.create(user, request.getTitle(), createAsMain);
        Resume saved = resumeRepository.save(resume);
        if (shouldBeMain && hasMain) {
            resumeRepository.unsetMainForUser(userId);
            saved.markMain(true);
            saved = resumeRepository.save(saved);
        }
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
    @Transactional(readOnly = true)
    public Optional<ResumeResponse> getMainResume(Long userId) {
        return resumeRepository.findByUser_IdAndIsMainTrue(userId)
                .map(this::toResumeResponse);
    }

    @Override
    public ResumeResponse getResumeForCompany(Long userId, Long jobPostingId, Long applicationId) {
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.UNAUTHORIZED));

        JobPostingEntity jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        String postingCid = jobPosting.getCompany() != null ? jobPosting.getCompany().getCid() : null;
        if (postingCid == null || !postingCid.equals(company.getCid())) {
            throw new BusinessException(ResponseCode.UNAUTHORIZED);
        }

        JobApplication application = jobApplicationRepository
                .findByIdAndJobPosting_Id(applicationId, jobPosting.getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        return toResumeResponse(application.getResume());
    }

    @Override
    public ResumeResponse replaceResume(Long userId, Long resumeId, ResumeCreateRequest request) {
        Resume resume = getResumeOwned(userId, resumeId);
        resume.updateTitle(request.getTitle());
        if (request.getIsMain() != null) {
            boolean requestMain = Boolean.TRUE.equals(request.getIsMain());
            if (requestMain) {
                resumeRepository.unsetMainForUser(userId);
                resume.markMain(true);
                resumeRepository.save(resume);
            } else {
                resume.markMain(false);
                resumeRepository.save(resume);
            }
        }

        ResumeProfile existingProfile = resumeProfileRepository.findByResume_Id(resumeId).orElse(null);
        if (existingProfile != null) {
            resumeProfileRepository.delete(existingProfile);
            resume.setProfile(null);
        }
        resume.setPortfolio(null);
        resumeCareerEntryRepository.deleteAll(
                resumeCareerEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resumeId)
        );
        resumeEducationEntryRepository.deleteAll(
                resumeEducationEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resumeId)
        );
        selfIntroductionRepository.deleteAll(
                selfIntroductionRepository.findAllByResume_IdOrderByOrderIndexAsc(resumeId)
        );

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
            createSelfIntroductionsWithAnswers(resume, request.getSelfIntroductions());
        }
        return toResumeResponse(resume);
    }

    @Override
    public ResumeResponse setMainResume(Long userId, Long resumeId) {
        Resume resume = getResumeOwned(userId, resumeId);
        resumeRepository.unsetMainForUser(userId);
        resume.markMain(true);
        resumeRepository.save(resume);
        return toResumeResponse(resume);
    }

    @Override
    public void deleteResume(Long userId, Long resumeId) {
        Resume resume = getResumeOwned(userId, resumeId);
        List<Long> applicationIds = jobApplicationRepository.findIdsByResume_Id(resumeId);
        resumeSnapshotService.createSnapshotsIfAbsent(resume, applicationIds);
        boolean wasMain = Boolean.TRUE.equals(resume.getIsMain());
        resumeRepository.delete(resume);
        if (wasMain) {
            resumeRepository.unsetMainForUser(userId);
            resumeRepository.findAllByUser_IdOrderByUpdatedAtDesc(userId).stream()
                    .findFirst()
                    .ifPresent(item -> item.markMain(true));
        }
    }

    private ProfileResponse upsertProfile(Long userId, Long resumeId, ProfileUpsertRequest request) {
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

    private CareerResponse addCareer(Long userId, Long resumeId, CareerCreateRequest request) {
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

    private EducationResponse addEducation(Long userId, Long resumeId, EducationCreateRequest request) {
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

    private ResumePortfolioResponse uploadPortfolio(Long userId, Long resumeId, ResumePortfolioUpdateRequest request) {
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

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));
    }

    private Resume getResumeOwned(Long userId, Long resumeId) {
        return resumeRepository.findByIdAndUser_Id(resumeId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    private ProfileImage getProfileImageOwned(Long userId, Long profileImageId) {
        return profileImageRepository.findByIdAndUser_Id(profileImageId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PROFILE_IMAGE_NOT_FOUND));
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
