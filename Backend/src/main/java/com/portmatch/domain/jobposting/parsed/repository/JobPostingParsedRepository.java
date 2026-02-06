package com.portmatch.domain.jobposting.parsed.repository;

import com.portmatch.domain.jobposting.parsed.entity.JobPostingParsed;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobPostingParsedRepository extends JpaRepository<JobPostingParsed, Long> {
    Optional<JobPostingParsed> findByJobPostingId(Long jobPostingId);
}
