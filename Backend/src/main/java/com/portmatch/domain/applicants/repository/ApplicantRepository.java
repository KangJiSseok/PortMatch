package com.portmatch.domain.applicants.repository;

import com.portmatch.domain.applicants.entity.Applicant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ApplicantRepository extends JpaRepository<Applicant, Long> {

    Optional<Applicant> findByUser_Id(Long userId);

    boolean existsByUser_Id(Long userId);
}
