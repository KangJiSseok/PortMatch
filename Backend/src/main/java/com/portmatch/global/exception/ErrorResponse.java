package com.portmatch.global.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ErrorResponse {
    private String code;         // "VALIDATION_ERROR" 등
    private String message;      // "입력값이 올바르지 않습니다."
    private List<FieldError> errors; // 필드별 상세

    @Getter
    @AllArgsConstructor
    public static class FieldError {
        private String field;    // "email"
        private String reason;   // "이메일은 필수입니다."
    }

    public static ErrorResponse validation(List<FieldError> errors) {
        return new ErrorResponse("VALIDATION_ERROR", "입력값이 올바르지 않습니다.", errors);
    }
}
