package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.ResumeEducationEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ResumeEducationEntryRepository extends JpaRepository<ResumeEducationEntry, Long> {
    List<ResumeEducationEntry> findAllByResume_IdOrderByOrderIndexAsc(Long resumeId);
}
