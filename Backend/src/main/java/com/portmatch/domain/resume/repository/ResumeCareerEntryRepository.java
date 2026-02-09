package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.ResumeCareerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeCareerEntryRepository extends JpaRepository<ResumeCareerEntry, Long> {
    List<ResumeCareerEntry> findAllByResume_IdOrderByOrderIndexAsc(Long resumeId);
}
