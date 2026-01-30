package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.ResumeCareerEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResumeCareerEntryRepository extends JpaRepository<ResumeCareerEntry, Long> {
    Optional<ResumeCareerEntry> findByIdAndResume_Id(Long id, Long resumeId);

    List<ResumeCareerEntry> findAllByResume_IdOrderByOrderIndexAsc(Long resumeId);

    List<ResumeCareerEntry> findAllByResume_IdAndIdIn(Long resumeId, List<Long> ids);
}
