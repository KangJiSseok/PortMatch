package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.jobposting.dto.JobPostingDto;

import java.util.List;

public interface JobPostingService {
    // 1. [Create / Update] 공고 저장 및 수정 (Upsert)
    void saveJobPosting(JobPostingDto dto);

    // 2. [Read] 전체 공고 목록 조회 (기존 getJobPostings 대체)
    List<JobPostingDto> getAllJobPostings();

    // 3. [Read] 특정 공고 상세 조회 (기존 getJobDetail 활용)
    JobPostingDto getJobDetail(String id) throws Exception;

    // 4. [Delete] 특정 공고 삭제
    void deleteJobPosting(String id);

    // 5. [Update] 조회수 증가 (필요하다면!)
    void updateViewCount(String id);
}
