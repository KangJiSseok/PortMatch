package com.portmatch.domain.jobapplication.repository;

import com.portmatch.domain.jobapplication.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByApplicant_IdAndJobPosting_Id(Long applicantId, Long jobPostingId);

    boolean existsByApplicant_IdAndJobPosting_Id(Long applicantId, Long jobPostingId);
}
