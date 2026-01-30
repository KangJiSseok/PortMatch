package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.ResumeEducationEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeEducationEntryRepository extends JpaRepository<ResumeEducationEntry, Long> {
    Optional<ResumeEducationEntry> findByIdAndResume_Id(Long id, Long resumeId);

    List<ResumeEducationEntry> findAllByResume_IdOrderByOrderIndexAsc(Long resumeId);

    List<ResumeEducationEntry> findAllByResume_IdAndIdIn(Long resumeId, List<Long> ids);
}
