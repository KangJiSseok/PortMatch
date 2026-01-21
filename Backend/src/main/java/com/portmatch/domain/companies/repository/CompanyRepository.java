package com.portmatch.domain.companies.repository;

import com.portmatch.domain.companies.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByCid(String cid);
    Optional<Company> findByCid(String cid);
    void deleteByCid(String cid);
    Optional<Company> findByCompaniesName(String companiesName);
}
