package com.portmatch.domain.jobapplication.repository;

import com.portmatch.domain.jobapplication.entity.JobApplicationResumeSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobApplicationResumeSnapshotRepository extends JpaRepository<JobApplicationResumeSnapshot, Long> {
}
