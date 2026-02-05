package com.portmatch.domain.companies.service;

import com.portmatch.domain.companies.dto.CompaniesDto;
import com.portmatch.domain.companies.dto.CompanyNameResponse;

import java.util.List;

public interface CompaniesService {
    void createCompany(CompaniesDto company);
    void deleteCompany(String cid);
    void updateCompany(CompaniesDto company);
    CompaniesDto getCompany(String cid);
    List<CompaniesDto> getAllCompanys();
    List<CompanyNameResponse> getCompanyByName(String keword);
}
