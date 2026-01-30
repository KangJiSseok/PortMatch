package com.portmatch.domain.resume.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OrderIndexItem {

    @NotNull(message = "Id is required.")
    private Long id;

    @NotNull(message = "Order index is required.")
    private Integer orderIndex;
}
