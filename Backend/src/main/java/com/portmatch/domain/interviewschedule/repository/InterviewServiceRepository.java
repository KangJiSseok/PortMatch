package com.portmatch.domain.interviewschedule.repository;

import com.portmatch.domain.interviewschedule.entity.InterviewScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.time.LocalDateTime;
import com.portmatch.domain.interviewschedule.enums.InterviewStatus;

public interface InterviewServiceRepository extends JpaRepository<InterviewScheduleEntity, Long> {

    List<InterviewScheduleEntity> findByUserId(Long userId);

    List<InterviewScheduleEntity> findByJobPostingId(Long jobPostingId);

    List<InterviewScheduleEntity> findByJobPosting_Company_Cid(String cid);

    boolean existsByUserIdAndJobPostingId(Long userId, Long jobPostingId);

    List<InterviewScheduleEntity> findByStatusAndTimeBetween(InterviewStatus status, LocalDateTime from, LocalDateTime to);
}
