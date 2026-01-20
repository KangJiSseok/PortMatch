package com.portmatch.domain.companyproject.service;

import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisRequest;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResponse;
import com.portmatch.domain.companyproject.dto.CompanyProjectAnalysisResult;
import com.portmatch.domain.companyproject.client.CompanyProjectAnalysisClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class CompanyProjectAnalysisService {

    private final CompanyProjectAnalysisClient companyProjectAnalysisClient;

    public CompanyProjectAnalysisService(CompanyProjectAnalysisClient companyProjectAnalysisClient) {
        this.companyProjectAnalysisClient = companyProjectAnalysisClient;
    }

    public CompanyProjectAnalysisResponse analyze(CompanyProjectAnalysisRequest request) {
        List<CompanyProjectAnalysisResult> results = new ArrayList<>();
        for (String companyName : request.getCompanyName()) {
            try {
                Object response = companyProjectAnalysisClient.analyzeCompanyProject(companyName);
                results.add(new CompanyProjectAnalysisResult(companyName, true, response, null));
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
}
