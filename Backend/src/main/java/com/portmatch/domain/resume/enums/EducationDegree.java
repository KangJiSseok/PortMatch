package com.portmatch.domain.resume.enums;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "EducationDegree", description = "학위", enumAsRef = true)
public enum EducationDegree {
    HIGH_SCHOOL,
    ASSOCIATE,
    BACHELOR,
    MASTER,
    DOCTORATE,
    OTHER
}
