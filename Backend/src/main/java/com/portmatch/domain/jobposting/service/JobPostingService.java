package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;

import java.util.List;

public interface JobPostingService {
    // 1. [Create / Update] 공고 저장 및 수정 (Upsert)
    JobPostingEntity saveJobPosting(JobPostingDto dto);

    // [추가] 1-1. 공고 정보와 기술 스택 리스트를 함께 저장
    void saveJobPostingWithStacks(JobPostingDto dto);

    // 2. [Read] 전체 공고 목록 조회 (기존 getJobPostings 대체)
    List<JobPostingDto> getAllJobPostings();

    // 3. [Read] 특정 공고 상세 조회 (기존 getJobDetail 활용)
    JobPostingDto getJobDetail(Long id);

    // 4. [Delete] 특정 공고 삭제
    void deleteJobPosting(Long id);

    // 5. [Update] 조회수 증가 (필요하다면!)
    void updateViewCount(Long id);

    // 6. [Read] 스택 별 공고 조회
    List<JobPostingDto> getJobsByStacks(List<Long> stackIds);

    // 7. [Read] 기업 별 공고 조회 (기업 ID를 기준으로 해당 기업의 모든 공고 조회)
    List<JobPostingDto> getJobsByCompany(String companyId);

    // 8. [Read] 제목 별 공고 조회 (공고 제목에 특정 키워드가 포함된 모든 공고 조회)
    List<JobPostingDto> getJobsByTitleKeyword(String keyword);
}
