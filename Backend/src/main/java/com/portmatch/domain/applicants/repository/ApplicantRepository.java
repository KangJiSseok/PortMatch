package com.portmatch.domain.applicants.repository;

import com.portmatch.domain.applicants.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApplicantRepository extends JpaRepository<Applicant, Long> {

    Optional<Applicant> findByUserId(Long userId);

    boolean existsByUserId(Long userId);
}
