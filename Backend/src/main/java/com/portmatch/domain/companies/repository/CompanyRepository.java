package com.portmatch.domain.companies.repository;

import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    boolean existsByCid(String cid);
    Optional<Company> findByCompaniesName(String companiesName);
    Optional<Company> findByCid(String cid);
    void deleteByCid(String cid);
    Optional<Company> findByUserId(Long userId);
    List<Company> findByCompaniesNameContaining(String keyword);
}
