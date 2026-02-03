package com.portmatch.domain.jobapplication.service;

import com.portmatch.domain.applicants.entity.Applicant;
import com.portmatch.domain.applicants.repository.ApplicantRepository;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.jobapplication.dto.JobApplicationCreateRequest;
import com.portmatch.domain.jobapplication.dto.JobApplicationDetailResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationSummaryResponse;
import com.portmatch.domain.jobapplication.entity.JobApplication;
import com.portmatch.domain.jobapplication.repository.JobApplicationRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.resume.entity.Resume;
import com.portmatch.domain.resume.repository.ResumeRepository;
import com.portmatch.domain.resume.service.ResumeService;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicantRepository applicantRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ResumeRepository resumeRepository;
    private final CompanyRepository companyRepository;
    private final ResumeService resumeService;

    @Override
    @Transactional
    public JobApplicationResponse apply(Long userId, Long jobPostingId, JobApplicationCreateRequest request) {
        Applicant applicant = applicantRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        Resume resume = resumeRepository.findByIdAndUser_Id(request.getResumeId(), userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        JobPostingEntity jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        if (jobApplicationRepository.existsByApplicant_IdAndJobPosting_Id(applicant.getId(), jobPosting.getId())) {
            throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        }

        JobApplication application = JobApplication.create(applicant, jobPosting, resume);
        JobApplication saved = jobApplicationRepository.save(application);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void cancel(Long userId, Long jobPostingId) {
        Applicant applicant = applicantRepository.findByUser_Id(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

        JobApplication application = jobApplicationRepository
                .findByApplicant_IdAndJobPosting_Id(applicant.getId(), jobPostingId)
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
    public JobApplicationDetailResponse getApplicationDetailForCompany(Long userId, Long jobPostingId, Long applicationId) {
        JobPostingEntity jobPosting = getOwnedJobPosting(userId, jobPostingId);
        JobApplication application = jobApplicationRepository
                .findByIdAndJobPosting_Id(applicationId, jobPosting.getId())
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        return toDetailResponse(userId, application);
    }

    private JobApplicationResponse toResponse(JobApplication application) {
        return JobApplicationResponse.builder()
                .id(application.getId())
                .applicantId(application.getApplicant().getId())
                .jobPostingId(application.getJobPosting().getId())
                .resumeId(application.getResume().getId())
                .status(application.getStatus())
                .createdAt(application.getCreatedAt())
                .build();
    }

    private JobApplicationSummaryResponse toSummaryResponse(JobApplication application) {
        Resume resume = application.getResume();
        return JobApplicationSummaryResponse.builder()
                .applicationId(application.getId())
                .applicantId(application.getApplicant().getId())
                .applicantName(application.getApplicant().getUser().getName())
                .resumeId(resume.getId())
                .resumeTitle(resume.getTitle())
                .status(application.getStatus())
                .appliedAt(application.getCreatedAt())
                .build();
    }

    private JobApplicationDetailResponse toDetailResponse(Long userId, JobApplication application) {
        Resume resume = application.getResume();
        return JobApplicationDetailResponse.builder()
                .applicationId(application.getId())
                .jobPostingId(application.getJobPosting().getId())
                .applicantId(application.getApplicant().getId())
                .applicantName(application.getApplicant().getUser().getName())
                .applicantEmail(application.getApplicant().getUser().getEmail())
                .applicantPhone(application.getApplicant().getUser().getPhone())
                .resumeId(resume.getId())
                .status(application.getStatus())
                .appliedAt(application.getCreatedAt())
                .resume(resumeService.getResumeForCompany(userId, application.getJobPosting().getId(), application.getId()))
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
