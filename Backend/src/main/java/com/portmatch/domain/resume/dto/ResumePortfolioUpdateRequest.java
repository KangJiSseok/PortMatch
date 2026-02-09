package com.portmatch.domain.resume.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ResumePortfolioUpdateRequest {

    @NotNull(message = "Portfolio id is required.")
    private Long portfolioId;
}
