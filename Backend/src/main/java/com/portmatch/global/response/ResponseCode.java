package com.portmatch.global.response;

import lombok.Getter;

@Getter
public enum ResponseCode {

    // 1000: success
    OK(true, 1000, "success"),




    // 2000: client error
    NOT_FOUND(false, 2001, "존재하지 않는 URL입니다."),
    INVALID_PARAMETER(false, 2002, "요청 파라미터 형식이 잘못되었습니다."),
    VALIDATION_ERROR(false, 2003, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(false, 2004, "로그인이 필요합니다."),
    INVALID_CREDENTIALS(false, 2100, "이메일 또는 비밀번호가 올바르지 않습니다."),
    ROLE_MISMATCH(false, 2101, "선택한 로그인 유형과 계정 유형이 일치하지 않습니다."),
    ANALYSIS_NOT_FOUND(false, 2401, "분석 결과가 없습니다."),
    COMPANY_PROJECT_ANALYSIS_EMPTY(false, 2402, "회사 프로젝트 분석 결과가 비어있습니다."),
    USER_NOT_FOUND(false, 2403, "사용자를 찾을 수 없습니다."),
    PORTFOLIO_NOT_FOUND(false, 2404, "포트폴리오를 찾을 수 없습니다."),
    PORTFOLIO_FILE_REQUIRED(false, 2405, "포트폴리오 파일은 필수입니다."),
    PORTFOLIO_S3_UPLOAD_FAILED(false, 2406, "포트폴리오 업로드에 실패했습니다."),
    PORTFOLIO_S3_DELETE_FAILED(false, 2407, "포트폴리오 삭제에 실패했습니다."),
    PORTFOLIO_ANALYSIS_SERVICE_UNAVAILABLE(false, 2408, "포트폴리오 분석 서비스가 응답하지 않습니다."),
    PORTFOLIO_ANALYSIS_PAYLOAD_FAILED(false, 2409, "포트폴리오 분석 요청 생성에 실패했습니다."),
    PORTFOLIO_ANALYSIS_EMPTY(false, 2410, "포트폴리오 분석 결과가 비어있습니다."),
    PORTFOLIO_ANALYSIS_BASE_URL_NOT_CONFIGURED(false, 2411, "포트폴리오 분석 URL 설정이 없습니다."),

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
