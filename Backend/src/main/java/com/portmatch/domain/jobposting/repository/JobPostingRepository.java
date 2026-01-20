package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.JobPostingEntity; // Entity가 필요해!
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPostingEntity, String> {
}