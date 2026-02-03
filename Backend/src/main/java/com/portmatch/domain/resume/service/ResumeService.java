package com.portmatch.domain.resume.service;

import com.portmatch.domain.resume.dto.ResumeCreateRequest;
import com.portmatch.domain.resume.dto.ResumeResponse;
import com.portmatch.domain.resume.dto.ResumeSummaryResponse;

import java.util.List;

public interface ResumeService {

    ResumeResponse createResume(Long userId, ResumeCreateRequest request);

    List<ResumeSummaryResponse> getResumes(Long userId);

    ResumeResponse getResume(Long userId, Long resumeId);

    ResumeResponse getResumeForCompany(Long userId, Long jobPostingId, Long applicationId);

    ResumeResponse replaceResume(Long userId, Long resumeId, ResumeCreateRequest request);

    ResumeResponse setMainResume(Long userId, Long resumeId);

    void deleteResume(Long userId, Long resumeId);
}
