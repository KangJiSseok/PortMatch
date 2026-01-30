package com.portmatch.domain.resume.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "EmploymentStatus", description = "고용 형태", enumAsRef = true)
public enum EmploymentStatus {
    FULL_TIME,
    PART_TIME,
    INTERN,
    CONTRACT,
    FREELANCE,
    OTHER
}
