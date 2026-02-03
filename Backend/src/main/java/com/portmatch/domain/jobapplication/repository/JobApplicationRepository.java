package com.portmatch.domain.jobapplication.repository;

import com.portmatch.domain.jobapplication.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByUser_IdAndJobPosting_Id(Long userId, Long jobPostingId);

    boolean existsByUser_IdAndJobPosting_Id(Long userId, Long jobPostingId);

    List<JobApplication> findAllByJobPosting_IdOrderByCreatedAtDesc(Long jobPostingId);

    Optional<JobApplication> findByIdAndJobPosting_Id(Long id, Long jobPostingId);
}
