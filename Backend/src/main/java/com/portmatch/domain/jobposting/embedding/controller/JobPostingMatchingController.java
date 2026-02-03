package com.portmatch.domain.jobposting.embedding.controller;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.domain.jobposting.embedding.dto.JobPostingMatchResponse;
import com.portmatch.domain.jobposting.embedding.service.JobPostingMatchingService;
import com.portmatch.global.api.BaseApiResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/job-postings/match")
public class JobPostingMatchingController {

    private final JobPostingMatchingService matchingService;

    public JobPostingMatchingController(JobPostingMatchingService matchingService) {
        this.matchingService = matchingService;
    }

    /**
     * 포트폴리오 기반 채용공고 매칭
     * 
     * @param portfolioId 포트폴리오 ID
     * @param limit 결과 개수 (기본값: 10)
     * @return 유사도 순으로 정렬된 채용공고 목록
     */
    @GetMapping("/portfolio/{portfolioId}")
    public BaseApiResponse<JobPostingMatchResponse> matchByPortfolio(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            @PathVariable Long portfolioId,
            @RequestParam(defaultValue = "10") int limit
    ) {
        JobPostingMatchResponse response = matchingService.matchByPortfolioId(
                userPrincipal.getUser().getId(),
                portfolioId,
                limit
        );
        return BaseApiResponse.ok(response);
    }
}
