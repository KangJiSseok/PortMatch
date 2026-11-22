package com.portmatch.domain.jobposting.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class JobPostingListQuery {
    public static final int PAGE_SIZE = 20;

    @Min(0)
    @Max(Integer.MAX_VALUE / PAGE_SIZE)
    private int page;

    private String cid = "";
    private String keyword = "";
    private List<@NotNull @Positive Long> stackIds = List.of();

    @Pattern(regexp = "all|urgent|week|relaxed|always")
    private String deadline = "all";

    @Pattern(regexp = "all|junior|career")
    private String experience = "all";

    @Pattern(regexp = "latest|deadline")
    private String sort = "latest";
}
