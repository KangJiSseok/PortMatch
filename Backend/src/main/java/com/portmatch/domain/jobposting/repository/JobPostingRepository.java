package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.JobPostingEntity; // Entity가 필요해!
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPostingEntity, Long> {
    // Pageable만 추가하면 정렬과 페이징이 자동으로 적용돼!
    Page<JobPostingEntity> findByCompanyCid(String cid, Pageable pageable);

    Page<JobPostingEntity> findByTitleContaining(String keyword, Pageable pageable);

    // 전체 조회를 위한 기본 findAll도 Pageable을 받을 수 있어
    Page<JobPostingEntity> findAll(Pageable pageable);
}