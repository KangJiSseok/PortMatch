package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.PostingStackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PostingStackRepository extends JpaRepository<PostingStackEntity, Long> {

    // 1. 공고 ID로 조회 (JobPostingEntity 내부의 id 필드 참조)
    List<PostingStackEntity> findByJobPostingId(Long jobPostingId);

    // 2. 스택 ID로 조회 (TechStackEntity 내부의 id 필드 참조)
    // 필드명이 techStack이고 그 안의 필드가 id이므로 아래 이름이 정확해!
    List<PostingStackEntity> findByTechStackId(Long techStackId);

    // 여러 스택 ID 중 하나라도 포함된 데이터를 조회 (IN 연산자 사용)
    List<PostingStackEntity> findByTechStackIdIn(List<Long> techStackIds);
}