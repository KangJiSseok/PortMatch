package com.portmatch.domain.companies.repository;

import com.portmatch.domain.companies.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByBusinessRegistrationNumber(String businessRegistrationNumber);
}
