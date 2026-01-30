package com.portmatch.domain.resume.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class CareerReorderRequest {

    @Valid
    @NotEmpty(message = "Items are required.")
    private List<OrderIndexItem> items;
}
