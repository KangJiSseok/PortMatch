package com.portmatch.domain.interviewtemplate.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class TopicReorderRequest {

    @Valid
    @NotEmpty(message = "정렬 목록은 비어 있을 수 없습니다.")
    private List<OrderIndexItem> items;
}
