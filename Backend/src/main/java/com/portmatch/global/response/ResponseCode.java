package com.portmatch.global.response;

import lombok.Getter;

@Getter
public enum ResponseCode {

    // 1000: success
    OK(true, 1000, "로그인에 성공했습니다"),




    // 2000: client error
    NOT_FOUND(false, 2001, "존재하지 않는 URL입니다."),
    INVALID_PARAMETER(false, 2002, "요청 파라미터 형식이 잘못되었습니다."),
    VALIDATION_ERROR(false, 2003, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(false, 2004, "로그인이 필요합니다."),
    INVALID_CREDENTIALS(false, 2100, "이메일 또는 비밀번호가 올바르지 않습니다."),
    ROLE_MISMATCH(false, 2101, "선택한 로그인 유형과 계정 유형이 일치하지 않습니다."),
    ANALYSIS_NOT_FOUND(false, 2401, "분석 결과가 없습니다."),
    COMPANY_PROJECT_ANALYSIS_EMPTY(false, 2402, "회사 프로젝트 분석 결과가 비어있습니다."),

    // 4000: domain error
    DUPLICATE_EMAIL(false, 4100, "이미 사용 중인 이메일입니다."),

    // 9000: server error
    INTERNAL_SERVER_ERROR(false, 9000, "알 수 없는 서버 오류가 발생했습니다.");

    private final Boolean status;
    private final Integer code;
    private final String message;

    ResponseCode(Boolean status, Integer code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
