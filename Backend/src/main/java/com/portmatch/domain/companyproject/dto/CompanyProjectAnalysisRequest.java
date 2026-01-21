package com.portmatch.domain.companyproject.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CompanyProjectAnalysisRequest {

    @JsonProperty("company_name")
    @NotEmpty(message = "company_name 리스트는 필수입니다.")
    private List<@NotBlank(message = "company_name 값은 비어 있을 수 없습니다.") String> companyName;
}
