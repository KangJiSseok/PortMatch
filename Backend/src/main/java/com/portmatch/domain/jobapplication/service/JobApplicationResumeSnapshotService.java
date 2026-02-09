package com.portmatch.domain.jobapplication.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.jobapplication.entity.JobApplication;
import com.portmatch.domain.jobapplication.entity.JobApplicationResumeSnapshot;
import com.portmatch.domain.jobapplication.repository.JobApplicationResumeSnapshotRepository;
import com.portmatch.domain.jobapplication.snapshot.ResumeSnapshotPayload;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.resume.dto.CareerResponse;
import com.portmatch.domain.resume.dto.EducationResponse;
import com.portmatch.domain.resume.dto.ProfileResponse;
import com.portmatch.domain.resume.dto.ResumePortfolioResponse;
import com.portmatch.domain.resume.dto.ResumeResponse;
import com.portmatch.domain.resume.dto.SelfIntroductionResponse;
import com.portmatch.domain.resume.entity.ProfileImage;
import com.portmatch.domain.resume.entity.Resume;
import com.portmatch.domain.resume.entity.ResumeCareerEntry;
import com.portmatch.domain.resume.entity.ResumeEducationEntry;
import com.portmatch.domain.resume.entity.ResumeProfile;
import com.portmatch.domain.resume.entity.SelfIntroduction;
import com.portmatch.domain.resume.repository.ResumeCareerEntryRepository;
import com.portmatch.domain.resume.repository.ResumeEducationEntryRepository;
import com.portmatch.domain.resume.repository.ResumeProfileRepository;
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

import jakarta.persistence.EntityManager;
import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobApplicationResumeSnapshotService {

    private final JobApplicationResumeSnapshotRepository snapshotRepository;
    private final ResumeProfileRepository resumeProfileRepository;
    private final ResumeCareerEntryRepository resumeCareerEntryRepository;
    private final ResumeEducationEntryRepository resumeEducationEntryRepository;
    private final SelfIntroductionRepository selfIntroductionRepository;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;
    private final S3Presigner s3Presigner;
    private final AwsS3Properties awsS3Properties;

    @Transactional
    public ResumeSnapshotPayload getOrCreateSnapshotPayload(JobApplication application) {
        JobApplicationResumeSnapshot snapshot = snapshotRepository.findById(application.getId()).orElse(null);
        if (snapshot != null) {
            return readPayload(snapshot.getPayloadJson());
        }
        Resume resume = application.getResume();
        if (resume == null) {
            return null;
        }
        ResumeSnapshotPayload payload = buildPayload(resume);
        saveSnapshot(application, payload);
        return payload;
    }

    @Transactional(readOnly = true)
    public ResumeSnapshotPayload getSnapshotPayload(JobApplication application) {
        JobApplicationResumeSnapshot snapshot = snapshotRepository.findById(application.getId()).orElse(null);
        if (snapshot == null) {
            return null;
        }
        return readPayload(snapshot.getPayloadJson());
    }

    @Transactional
    public void createSnapshotIfAbsent(JobApplication application) {
        if (snapshotRepository.existsById(application.getId())) {
            return;
        }
        Resume resume = application.getResume();
        if (resume == null) {
            return;
        }
        ResumeSnapshotPayload payload = buildPayload(resume);
        saveSnapshot(application, payload);
    }

    @Transactional
    public void createSnapshotsIfAbsent(Resume resume, List<Long> applicationIds) {
        if (resume == null || applicationIds == null || applicationIds.isEmpty()) {
            return;
        }
        ResumeSnapshotPayload payload = buildPayload(resume);
        String payloadJson = writePayload(payload);
        for (Long applicationId : applicationIds) {
            if (snapshotRepository.existsById(applicationId)) {
                continue;
            }
            JobApplication jobApplication = entityManager.getReference(JobApplication.class, applicationId);
            JobApplicationResumeSnapshot snapshot = JobApplicationResumeSnapshot.create(
                    jobApplication,
                    resume.getId(),
                    payloadJson
            );
            snapshotRepository.save(snapshot);
        }
    }

    @Transactional(readOnly = true)
    public ResumeResponse toResumeResponse(ResumeSnapshotPayload payload) {
        if (payload == null) {
            return null;
        }
        return ResumeResponse.builder()
                .id(payload.getId())
                .userId(payload.getUserId())
                .title(payload.getTitle())
                .isMain(payload.getIsMain())
                .createdAt(payload.getCreatedAt())
                .updatedAt(payload.getUpdatedAt())
                .profile(toProfileResponse(payload.getProfile()))
                .portfolio(toPortfolioResponse(payload.getPortfolio()))
                .careers(payload.getCareers() == null ? List.of() :
                        payload.getCareers().stream().map(this::toCareerResponse).toList())
                .educations(payload.getEducations() == null ? List.of() :
                        payload.getEducations().stream().map(this::toEducationResponse).toList())
                .selfIntroductions(payload.getSelfIntroductions() == null ? List.of() :
                        payload.getSelfIntroductions().stream().map(this::toSelfIntroductionResponse).toList())
                .build();
    }

    private void saveSnapshot(JobApplication application, ResumeSnapshotPayload payload) {
        String payloadJson = writePayload(payload);
        JobApplicationResumeSnapshot snapshot = JobApplicationResumeSnapshot.create(
                application,
                payload.getId(),
                payloadJson
        );
        snapshotRepository.save(snapshot);
    }

    private ResumeSnapshotPayload readPayload(String payloadJson) {
        try {
            return objectMapper.readValue(payloadJson, ResumeSnapshotPayload.class);
        } catch (JsonProcessingException ex) {
            throw new BusinessException(ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    private String writePayload(ResumeSnapshotPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new BusinessException(ResponseCode.INTERNAL_SERVER_ERROR);
        }
    }

    private ResumeSnapshotPayload buildPayload(Resume resume) {
        ResumeProfile profile = resumeProfileRepository.findByResume_Id(resume.getId()).orElse(null);
        Portfolio portfolio = resume.getPortfolio();
        List<ResumeCareerEntry> careers = resumeCareerEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId());
        List<ResumeEducationEntry> educations = resumeEducationEntryRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId());
        List<SelfIntroduction> introductions = selfIntroductionRepository.findAllByResume_IdOrderByOrderIndexAsc(resume.getId());

        ResumeSnapshotPayload payload = new ResumeSnapshotPayload();
        payload.setId(resume.getId());
        payload.setUserId(resume.getUser().getId());
        payload.setTitle(resume.getTitle());
        payload.setIsMain(resume.getIsMain());
        payload.setCreatedAt(resume.getCreatedAt());
        payload.setUpdatedAt(resume.getUpdatedAt());
        payload.setProfile(toProfileSnapshot(profile));
        payload.setPortfolio(toPortfolioSnapshot(portfolio, resume.getId()));
        payload.setCareers(careers.stream().map(this::toCareerSnapshot).toList());
        payload.setEducations(educations.stream().map(this::toEducationSnapshot).toList());
        payload.setSelfIntroductions(introductions.stream().map(this::toSelfIntroductionSnapshot).toList());
        return payload;
    }

    private ResumeSnapshotPayload.ProfileSnapshot toProfileSnapshot(ResumeProfile profile) {
        if (profile == null) {
            return null;
        }
        ProfileImage profileImage = profile.getProfileImage();
        ResumeSnapshotPayload.ProfileSnapshot snapshot = new ResumeSnapshotPayload.ProfileSnapshot();
        snapshot.setId(profile.getId());
        snapshot.setResumeId(profile.getResume().getId());
        snapshot.setName(profile.getName());
        snapshot.setContact(profile.getContact());
        snapshot.setEmail(profile.getEmail());
        snapshot.setAddress(profile.getAddress());
        snapshot.setProfileImageId(profileImage != null ? profileImage.getId() : null);
        snapshot.setProfileImageKey(profileImage != null ? profileImage.getImageKey() : null);
        snapshot.setProfileImageName(profileImage != null ? profileImage.getImageName() : null);
        snapshot.setCreatedAt(profile.getCreatedAt());
        snapshot.setUpdatedAt(profile.getUpdatedAt());
        return snapshot;
    }

    private ResumeSnapshotPayload.PortfolioSnapshot toPortfolioSnapshot(Portfolio portfolio, Long resumeId) {
        if (portfolio == null) {
            return null;
        }
        ResumeSnapshotPayload.PortfolioSnapshot snapshot = new ResumeSnapshotPayload.PortfolioSnapshot();
        snapshot.setPortfolioId(portfolio.getId());
        snapshot.setResumeId(resumeId);
        snapshot.setFileUrl(portfolio.getFileUrl());
        snapshot.setOriginalFilename(portfolio.getOriginalFilename());
        snapshot.setContentType(portfolio.getContentType());
        snapshot.setFileSize(portfolio.getFileSize());
        snapshot.setCreatedAt(portfolio.getCreatedAt());
        return snapshot;
    }

    private ResumeSnapshotPayload.CareerSnapshot toCareerSnapshot(ResumeCareerEntry entry) {
        ResumeSnapshotPayload.CareerSnapshot snapshot = new ResumeSnapshotPayload.CareerSnapshot();
        snapshot.setId(entry.getId());
        snapshot.setResumeId(entry.getResume().getId());
        snapshot.setCompany(entry.getCompany());
        snapshot.setRole(entry.getRole());
        snapshot.setPeriodStart(entry.getPeriodStart());
        snapshot.setPeriodEnd(entry.getPeriodEnd());
        snapshot.setEmploymentStatus(entry.getEmploymentStatus());
        snapshot.setDescription(entry.getDescription());
        snapshot.setOrderIndex(entry.getOrderIndex());
        snapshot.setCreatedAt(entry.getCreatedAt());
        snapshot.setUpdatedAt(entry.getUpdatedAt());
        return snapshot;
    }

    private ResumeSnapshotPayload.EducationSnapshot toEducationSnapshot(ResumeEducationEntry entry) {
        ResumeSnapshotPayload.EducationSnapshot snapshot = new ResumeSnapshotPayload.EducationSnapshot();
        snapshot.setId(entry.getId());
        snapshot.setResumeId(entry.getResume().getId());
        snapshot.setSchool(entry.getSchool());
        snapshot.setMajor(entry.getMajor());
        snapshot.setDegree(entry.getDegree());
        snapshot.setPeriodStart(entry.getPeriodStart());
        snapshot.setPeriodEnd(entry.getPeriodEnd());
        snapshot.setStatus(entry.getStatus());
        snapshot.setOrderIndex(entry.getOrderIndex());
        snapshot.setCreatedAt(entry.getCreatedAt());
        snapshot.setUpdatedAt(entry.getUpdatedAt());
        return snapshot;
    }

    private ResumeSnapshotPayload.SelfIntroductionSnapshot toSelfIntroductionSnapshot(SelfIntroduction intro) {
        ResumeSnapshotPayload.SelfIntroductionSnapshot snapshot = new ResumeSnapshotPayload.SelfIntroductionSnapshot();
        snapshot.setId(intro.getId());
        snapshot.setResumeId(intro.getResume().getId());
        snapshot.setTitle(intro.getTitle());
        snapshot.setAnswerText(intro.getAnswerText());
        snapshot.setOrderIndex(intro.getOrderIndex());
        snapshot.setCreatedAt(intro.getCreatedAt());
        snapshot.setUpdatedAt(intro.getUpdatedAt());
        return snapshot;
    }

    private ProfileResponse toProfileResponse(ResumeSnapshotPayload.ProfileSnapshot profile) {
        if (profile == null) {
            return null;
        }
        String presignedUrl = null;
        if (profile.getProfileImageKey() != null && !profile.getProfileImageKey().isBlank()) {
            presignedUrl = buildProfileImagePresignedUrl(profile.getProfileImageKey(), 10);
        }
        return ProfileResponse.builder()
                .id(profile.getId())
                .resumeId(profile.getResumeId())
                .name(profile.getName())
                .contact(profile.getContact())
                .email(profile.getEmail())
                .address(profile.getAddress())
                .profileImageId(profile.getProfileImageId())
                .profileImageUrl(presignedUrl)
                .profileImageName(profile.getProfileImageName())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private ResumePortfolioResponse toPortfolioResponse(ResumeSnapshotPayload.PortfolioSnapshot portfolio) {
        if (portfolio == null) {
            return null;
        }
        return ResumePortfolioResponse.builder()
                .portfolioId(portfolio.getPortfolioId())
                .resumeId(portfolio.getResumeId())
                .fileUrl(portfolio.getFileUrl())
                .originalFilename(portfolio.getOriginalFilename())
                .contentType(portfolio.getContentType())
                .fileSize(portfolio.getFileSize())
                .createdAt(portfolio.getCreatedAt())
                .build();
    }

    private CareerResponse toCareerResponse(ResumeSnapshotPayload.CareerSnapshot entry) {
        return CareerResponse.builder()
                .id(entry.getId())
                .resumeId(entry.getResumeId())
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

    private EducationResponse toEducationResponse(ResumeSnapshotPayload.EducationSnapshot entry) {
        return EducationResponse.builder()
                .id(entry.getId())
                .resumeId(entry.getResumeId())
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

    private SelfIntroductionResponse toSelfIntroductionResponse(ResumeSnapshotPayload.SelfIntroductionSnapshot intro) {
        return SelfIntroductionResponse.builder()
                .id(intro.getId())
                .resumeId(intro.getResumeId())
                .title(intro.getTitle())
                .answerText(intro.getAnswerText())
                .orderIndex(intro.getOrderIndex())
                .createdAt(intro.getCreatedAt())
                .updatedAt(intro.getUpdatedAt())
                .build();
    }

    private String buildProfileImagePresignedUrl(String imageKey, int minutes) {
        int expiresInMinutes = Math.max(1, minutes);
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(imageKey)
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiresInMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}
