package com.portmatch.domain.jobcompanies.service;

import com.portmatch.domain.jobcompanies.dto.JobCompaniesDto;

import java.util.List;

public interface JobCompaniesService {
    void createCompany(JobCompaniesDto company);
    void deleteCompany(String cid);
    void updateCompany(JobCompaniesDto company);
    JobCompaniesDto getCompany(String cid);
    List<JobCompaniesDto> getAllCompanys();
}
