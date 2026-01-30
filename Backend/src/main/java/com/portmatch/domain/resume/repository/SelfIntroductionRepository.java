package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.SelfIntroduction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SelfIntroductionRepository extends JpaRepository<SelfIntroduction, Long> {
    Optional<SelfIntroduction> findByIdAndResume_Id(Long id, Long resumeId);

    List<SelfIntroduction> findAllByResume_IdOrderByOrderIndexAsc(Long resumeId);

    List<SelfIntroduction> findAllByResume_IdAndIdIn(Long resumeId, List<Long> ids);
}
