package com.portmatch.domain.resume.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "EducationStatus", description = "학적 상태", enumAsRef = true)
public enum EducationStatus {
    ENROLLED,
    GRADUATED,
    LEAVE,
    DROPPED,
    OTHER
}
