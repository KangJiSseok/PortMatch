package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.ResumeProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeProfileRepository extends JpaRepository<ResumeProfile, Long> {
    Optional<ResumeProfile> findByResume_Id(Long resumeId);
}
