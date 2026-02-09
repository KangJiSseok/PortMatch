package com.portmatch.domain.interviewtemplate.repository;

import com.portmatch.domain.interviewtemplate.entity.InterviewTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InterviewTemplateRepository extends JpaRepository<InterviewTemplateEntity, Long> {
    Optional<InterviewTemplateEntity> findByIdAndUserId(Long id, Long userId);

    List<InterviewTemplateEntity> findAllByUserIdOrderByUpdatedAtDesc(Long userId);
}
