package com.portmatch.domain.companyproject.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.companyproject.client.CompanyProjectAnalysisClient;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisPayload;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResponse;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResult;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProject;
import com.portmatch.domain.companyproject.repository.CompanyProjectAnalysisRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@Transactional
public class CompanyProjectAnalysisService {

    private final CompanyProjectAnalysisClient companyProjectAnalysisClient;
    private final CompanyRepository companyRepository;
    private final CompanyProjectAnalysisRepository companyProjectAnalysisRepository;
    private final ObjectMapper objectMapper;

    public CompanyProjectAnalysisService(
            CompanyProjectAnalysisClient companyProjectAnalysisClient,
            CompanyRepository companyRepository,
            CompanyProjectAnalysisRepository companyProjectAnalysisRepository,
            ObjectMapper objectMapper
    ) {
        this.companyProjectAnalysisClient = companyProjectAnalysisClient;
        this.companyRepository = companyRepository;
        this.companyProjectAnalysisRepository = companyProjectAnalysisRepository;
        this.objectMapper = objectMapper;
    }

    public CompanyProjectAnalysisResponse analyze(CompanyProjectAnalysisRequest request) {
        List<CompanyProjectAnalysisResult> results = new ArrayList<>();
        for (String companyName : request.getCompanyName()) {
            Company company = companyRepository.findByCompaniesName(companyName)
                    .orElseGet(() -> companyRepository.save(new Company(null, companyName, null, null, null)));

            try {
                Object response = companyProjectAnalysisClient.analyzeCompanyProject(companyName);
                persistResult(company, response);
                results.add(new CompanyProjectAnalysisResult(companyName, true, response, null));
            } catch (BusinessException exception) {
                results.add(new CompanyProjectAnalysisResult(
                        companyName,
                        false,
                        null,
                        exception.getMessage()
                ));
            } catch (ResponseStatusException exception) {
                results.add(new CompanyProjectAnalysisResult(
                        companyName,
                        false,
                        null,
                        exception.getReason()
                ));
            } catch (Exception exception) {
                log.error("Unexpected company project analysis error. companyName={}", companyName, exception);
                results.add(new CompanyProjectAnalysisResult(
                        companyName,
                        false,
                        null,
                        "Unexpected error"
                ));
            }
        }
        return new CompanyProjectAnalysisResponse(results);
    }

    private void persistResult(Company company, Object body) {
        if (body == null) {
            throw new BusinessException(ResponseCode.COMPANY_PROJECT_ANALYSIS_EMPTY);
        }

        CompanyProjectAnalysisPayload payload = objectMapper.convertValue(body, CompanyProjectAnalysisPayload.class);
        CompanyProjectAnalysis analysis = companyProjectAnalysisRepository.findByCompanyId(company.getId())
                .orElseGet(() -> new CompanyProjectAnalysis(company));

        analysis.replaceProjects(buildProjects(analysis, payload));
        companyProjectAnalysisRepository.save(analysis);
    }

    private List<CompanyProjectAnalysisProject> buildProjects(
            CompanyProjectAnalysis analysis,
            CompanyProjectAnalysisPayload payload
    ) {
        if (payload == null || payload.projects() == null) {
            return List.of();
        }

        return payload.projects().stream()
                .filter(project -> project != null && project.projectName() != null && !project.projectName().isBlank())
                .map(project -> {
                    CompanyProjectAnalysisProject entity = new CompanyProjectAnalysisProject(
                            analysis,
                            project.projectName(),
                            project.domain(),
                            project.problem(),
                            project.solution()
                    );
                    if (project.tech() != null) {
                        project.tech().stream()
                                .filter(tech -> tech != null && !tech.isBlank())
                                .forEach(entity::addTech);
                    }
                    return entity;
                })
                .toList();
    }
}
