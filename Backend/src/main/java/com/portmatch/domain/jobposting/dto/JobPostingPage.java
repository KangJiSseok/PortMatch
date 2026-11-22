package com.portmatch.domain.jobposting.dto;

import java.time.LocalDate;
import java.util.List;

public record JobPostingPage(
        List<JobPostingDto> content,
        long totalElements,
        int totalPages,
        LocalDate asOfDate
) {
}
