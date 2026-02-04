package com.portmatch.domain.jobapplication.service;

import com.portmatch.domain.jobapplication.dto.JobApplicationCreateRequest;
import com.portmatch.domain.jobapplication.dto.JobApplicationDetailResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationMyResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationSummaryResponse;
import com.portmatch.domain.jobapplication.dto.JobApplicationStatusUpdateRequest;

import java.util.List;

public interface JobApplicationService {
    JobApplicationResponse apply(Long userId, Long jobPostingId, JobApplicationCreateRequest request);

    void cancel(Long userId, Long jobPostingId);

    List<JobApplicationSummaryResponse> getApplicationsForCompany(Long userId, Long jobPostingId);

    List<JobApplicationMyResponse> getMyApplications(Long userId);

    JobApplicationDetailResponse getApplicationDetailForCompany(Long userId, Long jobPostingId, Long applicationId);

    JobApplicationDetailResponse updateApplicationStatusForCompany(
            Long userId,
            Long jobPostingId,
            Long applicationId,
            JobApplicationStatusUpdateRequest request
    );
}
