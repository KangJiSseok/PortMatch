package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.SelfIntroduction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SelfIntroductionRepository extends JpaRepository<SelfIntroduction, Long> {
    List<SelfIntroduction> findAllByResume_IdOrderByOrderIndexAsc(Long resumeId);
}
