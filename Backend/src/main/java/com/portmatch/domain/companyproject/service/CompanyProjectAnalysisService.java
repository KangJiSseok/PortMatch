package com.portmatch.domain.companyproject.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portmatch.domain.companyproject.client.CompanyProjectAnalysisClient;
import com.portmatch.domain.companyproject.client.ExplanationClient;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisPayload;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResponse;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResult;
import com.portmatch.domain.companyproject.dto.ExplanationMatchPayload;
import com.portmatch.domain.companyproject.dto.ExplanationMatchRequestItem;
import com.portmatch.domain.companyproject.dto.ExplanationMatchResponse;
import com.portmatch.domain.companyproject.dto.ExplanationMatchResponseItem;
import com.portmatch.domain.companyproject.dto.ExplanationServiceProject;
import com.portmatch.domain.companyproject.dto.ExplanationServiceRequest;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysis;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProject;
import com.portmatch.domain.companyproject.entity.CompanyProjectAnalysisProjectTech;
import com.portmatch.domain.companyproject.repository.CompanyProjectAnalysisProjectRepository;
import com.portmatch.domain.companyproject.repository.CompanyProjectAnalysisRepository;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProject;
import com.portmatch.domain.portfolio.entity.PortfolioAnalysisProjectTech;
import com.portmatch.domain.portfolio.repository.PortfolioAnalysisProjectRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CompanyProjectAnalysisService {

    private final CompanyProjectAnalysisClient companyProjectAnalysisClient;
    private final ExplanationClient explanationClient;
    private final CompanyRepository companyRepository;
    private final CompanyProjectAnalysisRepository companyProjectAnalysisRepository;
    private final CompanyProjectAnalysisProjectRepository companyProjectAnalysisProjectRepository;
    private final PortfolioAnalysisProjectRepository portfolioAnalysisProjectRepository;
    private final ObjectMapper objectMapper;

    public CompanyProjectAnalysisService(
            CompanyProjectAnalysisClient companyProjectAnalysisClient,
            ExplanationClient explanationClient,
            CompanyRepository companyRepository,
            CompanyProjectAnalysisRepository companyProjectAnalysisRepository,
            CompanyProjectAnalysisProjectRepository companyProjectAnalysisProjectRepository,
            PortfolioAnalysisProjectRepository portfolioAnalysisProjectRepository,
            ObjectMapper objectMapper
    ) {
        this.companyProjectAnalysisClient = companyProjectAnalysisClient;
        this.explanationClient = explanationClient;
        this.companyRepository = companyRepository;
        this.companyProjectAnalysisRepository = companyProjectAnalysisRepository;
        this.companyProjectAnalysisProjectRepository = companyProjectAnalysisProjectRepository;
        this.portfolioAnalysisProjectRepository = portfolioAnalysisProjectRepository;
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

    public ExplanationMatchResponseItem explainMatch(Long userId, ExplanationMatchRequestItem item) {
        Long companyId = item.companyId();
        Long portfolioProjectId = item.portfolioProjectId();
        Long companyProjectId = item.companyProjectId();

        try {
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
            PortfolioAnalysisProject portfolioProject = portfolioAnalysisProjectRepository
                    .findByIdWithTechsAndUserId(portfolioProjectId, userId)
                    .orElseThrow(() -> new BusinessException(ResponseCode.UNAUTHORIZED));
            CompanyProjectAnalysisProject companyProject = companyProjectAnalysisProjectRepository
                    .findByIdWithTechs(companyProjectId)
                    .orElseThrow(() -> new BusinessException(ResponseCode.ANALYSIS_NOT_FOUND));

            ExplanationServiceRequest payload = new ExplanationServiceRequest(
                    company.getCompaniesName(),
                    toServiceProject(portfolioProject),
                    toServiceProject(companyProject)
            );
            ExplanationMatchPayload response = explanationClient.explain(payload);
            return new ExplanationMatchResponseItem(
                    companyId,
                    portfolioProjectId,
                    companyProjectId,
                    true,
                    response,
                    null
            );
        } catch (BusinessException exception) {
            return new ExplanationMatchResponseItem(
                    companyId,
                    portfolioProjectId,
                    companyProjectId,
                    false,
                    null,
                    exception.getMessage()
            );
        } catch (ResponseStatusException exception) {
            return new ExplanationMatchResponseItem(
                    companyId,
                    portfolioProjectId,
                    companyProjectId,
                    false,
                    null,
                    exception.getReason()
            );
        } catch (Exception exception) {
            return new ExplanationMatchResponseItem(
                    companyId,
                    portfolioProjectId,
                    companyProjectId,
                    false,
                    null,
                    "Unexpected error"
            );
        }
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

    private ExplanationServiceProject toServiceProject(PortfolioAnalysisProject project) {
        List<String> techs = project.getTechs().stream()
                .map(PortfolioAnalysisProjectTech::getTech)
                .filter(tech -> tech != null && !tech.isBlank())
                .toList();
        return new ExplanationServiceProject(
                safeText(project.getName()),
                safeText(project.getDomain()),
                safeText(project.getProblem()),
                safeText(project.getSolution()),
                techs == null ? List.of() : techs
        );
    }

    private ExplanationServiceProject toServiceProject(CompanyProjectAnalysisProject project) {
        List<String> techs = project.getTechs().stream()
                .map(CompanyProjectAnalysisProjectTech::getTech)
                .filter(tech -> tech != null && !tech.isBlank())
                .toList();
        return new ExplanationServiceProject(
                safeText(project.getName()),
                safeText(project.getDomain()),
                safeText(project.getProblem()),
                safeText(project.getSolution()),
                techs == null ? List.of() : techs
        );
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }
}
