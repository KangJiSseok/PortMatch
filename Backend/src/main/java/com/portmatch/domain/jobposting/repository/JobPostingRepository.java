package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.JobPostingEntity; // Entity가 필요해!
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPostingEntity, Long> {
    List<JobPostingEntity> findByCompanyCid(String cid);
    // 2. 제목 키워드 검색 (기존과 동일)
    List<JobPostingEntity> findByTitleContaining(String keyword);
    List<JobPostingEntity> findAllByIdIn(List<Long> ids);
}