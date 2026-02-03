package com.portmatch.domain.jobapplication.service;

import com.portmatch.domain.jobapplication.dto.JobApplicationCreateRequest;
import com.portmatch.domain.jobapplication.dto.JobApplicationResponse;

public interface JobApplicationService {
    JobApplicationResponse apply(Long userId, Long jobPostingId, JobApplicationCreateRequest request);

    void cancel(Long userId, Long jobPostingId);
}
