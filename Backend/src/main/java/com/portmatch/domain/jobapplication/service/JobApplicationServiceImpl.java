package com.portmatch.domain.jobapplication.service;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.jobapplication.dto.JobApplicationCreateRequest;
import com.portmatch.domain.jobapplication.dto.JobApplicationDetailResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationMyResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationSummaryResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationStatusUpdateRequest;
import com.portmatch.domain.jobapplication.entity.JobApplication;
import com.portmatch.domain.jobapplication.repository.JobApplicationRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.resume.entity.Resume;
import com.portmatch.domain.resume.repository.ResumeRepository;
import com.portmatch.domain.resume.dto.ResumeResponse;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ResumeRepository resumeRepository;
    private final CompanyRepository companyRepository;
    private final JobApplicationResumeSnapshotService resumeSnapshotService;

    @Override
    @Transactional
    public JobApplicationResponse apply(Long userId, Long jobPostingId, JobApplicationCreateRequest request) {
        log.info("userid: "+userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        log.info("resumeId: "+request.getResumeId());
        Resume resume = resumeRepository.findByIdAndUser_Id(request.getResumeId(), userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        log.info("posting");
        JobPostingEntity jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

//        if (jobApplicationRepository.existsByUser_IdAndJobPosting_Id(user.getId(), jobPosting.getId())) {
//            log.info("Errorrrrrrrrrrr");
//            throw new BusinessException(ResponseCode.ALREADY_APPLIED);
//        }

        log.info("create 전");
        JobApplication application = JobApplication.create(user, jobPosting, resume);
        log.info("create 후, save 전");
        log.info(application.toString());
        JobApplication saved = jobApplicationRepository.save(application);
        resumeSnapshotService.createSnapshotIfAbsent(saved);
        log.info("반환");
        log.info(saved.toString());
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void cancel(Long userId, Long jobPostingId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        JobApplication application = jobApplicationRepository
                .findByUser_IdAndJobPosting_Id(user.getId(), jobPostingId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        jobApplicationRepository.delete(application);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationSummaryResponse> getApplicationsForCompany(Long userId, Long jobPostingId) {
        JobPostingEntity jobPosting = getOwnedJobPosting(userId, jobPostingId);
        return jobApplicationRepository.findAllByJobPosting_IdOrderByCreatedAtDesc(jobPosting.getId())
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobApplicationMyResponse> getMyApplications(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        return jobApplicationRepository.findAllByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toMyResponse)
                .toList();
    }

    @Override
    @Transactional
    public JobApplicationDetailResponse getApplicationDetailForCompany(Long userId, Long jobPostingId, Long applicationId) {
        JobPostingEntity jobPosting = getOwnedJobPosting(userId, jobPostingId);
        JobApplication application = jobApplicationRepository
                .findByIdAndJobPosting_Id(applicationId, jobPosting.getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        if (!application.isResumeViewed()) {
            application.markResumeViewed();
        }
        ResumeResponse resumeSnapshot = resumeSnapshotService.toResumeResponse(
                resumeSnapshotService.getOrCreateSnapshotPayload(application)
        );
        return toDetailResponse(application, resumeSnapshot);
    }

    @Override
    @Transactional
    public JobApplicationDetailResponse updateApplicationStatusForCompany(
            Long userId,
            Long jobPostingId,
            Long applicationId,
            JobApplicationStatusUpdateRequest request
    ) {
        JobPostingEntity jobPosting = getOwnedJobPosting(userId, jobPostingId);
        JobApplication application = jobApplicationRepository
                .findByIdAndJobPosting_Id(applicationId, jobPosting.getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        if (request.getStatus() == null) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        }

        log.info("[APP] updateApplicationStatusForCompany userId={} jobPostingId={} applicationId={} oldStatus={} newStatus={}",
                userId, jobPostingId, applicationId, application.getStatus(), request.getStatus());
        application.updateStatus(request.getStatus());
        log.info("[APP] updateApplicationStatusForCompany saved applicationId={} status={}",
                application.getId(), application.getStatus());
        ResumeResponse resumeSnapshot = resumeSnapshotService.toResumeResponse(
                resumeSnapshotService.getOrCreateSnapshotPayload(application)
        );
        return toDetailResponse(application, resumeSnapshot);
    }

    private JobApplicationResponse toResponse(JobApplication application) {
        return JobApplicationResponse.builder()
                .id(application.getId())
                .userId(application.getUser().getId())
                .jobPostingId(application.getJobPosting().getId())
                .resumeId(application.getResume().getId())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .build();
    }

    private JobApplicationSummaryResponse toSummaryResponse(JobApplication application) {
        Resume resume = application.getResume();
        var snapshot = resumeSnapshotService.getSnapshotPayload(application);
        Long resumeId = resume != null ? resume.getId() : (snapshot != null ? snapshot.getId() : null);
        String resumeTitle = resume != null ? resume.getTitle() : (snapshot != null ? snapshot.getTitle() : null);
        return JobApplicationSummaryResponse.builder()
                .applicationId(application.getId())
                .userId(application.getUser().getId())
                .userName(application.getUser().getName())
                .resumeId(resumeId)
                .resumeTitle(resumeTitle)
                .status(application.getStatus())
                .appliedAt(application.getCreatedAt())
                .resumeViewed(application.isResumeViewed())
                .build();
    }

    private JobApplicationDetailResponse toDetailResponse(JobApplication application, ResumeResponse resumeSnapshot) {
        Resume resume = application.getResume();
        Long resumeId = resume != null ? resume.getId() : (resumeSnapshot != null ? resumeSnapshot.getId() : null);
        return JobApplicationDetailResponse.builder()
                .applicationId(application.getId())
                .jobPostingId(application.getJobPosting().getId())
                .userId(application.getUser().getId())
                .userName(application.getUser().getName())
                .userEmail(application.getUser().getEmail())
                .userPhone(application.getUser().getPhone())
                .resumeId(resumeId)
                .status(application.getStatus())
                .appliedAt(application.getCreatedAt())
                .resumeViewed(application.isResumeViewed())
                .resume(resumeSnapshot)
                .build();
    }

    private JobApplicationMyResponse toMyResponse(JobApplication application) {
        Resume resume = application.getResume();
        JobPostingEntity jobPosting = application.getJobPosting();
        Company company = jobPosting != null ? jobPosting.getCompany() : null;

        return JobApplicationMyResponse.builder()
                .applicationId(application.getId())
                .jobPostingId(jobPosting != null ? jobPosting.getId() : null)
                .jobPostingTitle(jobPosting != null ? jobPosting.getTitle() : null)
                .companyName(company != null ? company.getCompaniesName() : null)
                .companyCid(company != null ? company.getCid() : null)
                .status(application.getStatus())
                .resumeId(resume != null ? resume.getId() : null)
                .resumeTitle(resume != null ? resume.getTitle() : null)
                .appliedAt(application.getCreatedAt())
                .build();
    }

    private JobPostingEntity getOwnedJobPosting(Long userId, Long jobPostingId) {
        Company company = companyRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.UNAUTHORIZED));
        JobPostingEntity jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        String postingCid = jobPosting.getCompany() != null ? jobPosting.getCompany().getCid() : null;
        if (postingCid == null || !postingCid.equals(company.getCid())) {
            throw new BusinessException(ResponseCode.UNAUTHORIZED);
        }
        return jobPosting;
    }
}
