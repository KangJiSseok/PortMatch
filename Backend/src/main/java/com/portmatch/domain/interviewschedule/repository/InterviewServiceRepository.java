package com.portmatch.domain.interviewschedule.repository;

import com.portmatch.domain.interviewschedule.entity.InterviewScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewServiceRepository extends JpaRepository<InterviewScheduleEntity, Long> {

    List<InterviewScheduleEntity> findByUserId(Long userId);

    List<InterviewScheduleEntity> findByJobPostingId(Long jobPostingId);

    boolean existsByUserIdAndJobPostingId(Long userId, Long jobPostingId);
}
