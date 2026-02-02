package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.entity.JobPostingEntity; // Entity가 필요해!
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPostingEntity, Long> {
    List<JobPostingEntity> findByCompanyCid(String cid);
    // 2. 제목 키워드 검색 (기존과 동일)
    List<JobPostingEntity> findByTitleContaining(String keyword);
    List<JobPostingEntity> findAllByIdIn(List<Long> ids);
    List<JobPostingEntity> findAllByOrderByIdDesc(Pageable pageable);

    List<JobPostingEntity> findByCompanyCidAndActive(String cid, Integer active);

    @Modifying
    @Transactional
    @Query("UPDATE JobPostingEntity j SET j.active = 0 " +
            "WHERE j.active = 1 " +
            "AND j.endDate IS NOT NULL " + // null인 데이터는 건드리지 않음
            "AND j.endDate < :today")
    void updateExpiredJobs(String today);
}