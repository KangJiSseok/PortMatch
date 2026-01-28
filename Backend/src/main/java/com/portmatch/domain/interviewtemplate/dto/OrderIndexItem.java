package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OrderIndexItem {

    @NotNull(message = "id는 필수입니다.")
    private Long id;

    @NotNull(message = "orderIndex는 필수입니다.")
    @Min(value = 0, message = "orderIndex는 0 이상이어야 합니다.")
    private Integer orderIndex;
}
