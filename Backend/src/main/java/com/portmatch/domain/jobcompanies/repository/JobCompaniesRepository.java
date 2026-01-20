package com.portmatch.domain.jobcompanies.repository;

import com.portmatch.domain.jobcompanies.entity.JobCompaniesEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobCompaniesRepository extends JpaRepository<JobCompaniesEntity, String> {
}