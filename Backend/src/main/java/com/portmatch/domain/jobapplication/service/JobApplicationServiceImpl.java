package com.portmatch.domain.jobapplication.service;

import com.portmatch.domain.applicants.entity.Applicant;
import com.portmatch.domain.applicants.repository.ApplicantRepository;
import com.portmatch.domain.jobapplication.dto.JobApplicationCreateRequest;
import com.portmatch.domain.jobapplication.dto.JobApplicationResponse;
import com.portmatch.domain.jobapplication.entity.JobApplication;
import com.portmatch.domain.jobapplication.repository.JobApplicationRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.resume.entity.Resume;
import com.portmatch.domain.resume.repository.ResumeRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class JobApplicationServiceImpl implements JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final ApplicantRepository applicantRepository;
    private final JobPostingRepository jobPostingRepository;
    private final ResumeRepository resumeRepository;

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
}
