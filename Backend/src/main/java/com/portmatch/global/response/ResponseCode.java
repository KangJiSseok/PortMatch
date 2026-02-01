package com.portmatch.global.response;

import lombok.Getter;

@Getter
public enum ResponseCode {

    // 1000: success
    OK(true, 1000, "success"),
    ANALYSIS_NOT_FOUND(false, 1001, "분석 결과가 없습니다."),

    // 2000: client error (4xx)
    // common
    NOT_FOUND(false, 2001, "존재하지 않는 URL입니다."),
    INVALID_PARAMETER(false, 2002, "요청 파라미터 형식이 잘못되었습니다."),
    VALIDATION_ERROR(false, 2003, "입력값이 올바르지 않습니다."),
    UNAUTHORIZED(false, 2004, "로그인이 필요합니다."),
    // auth
    INVALID_CREDENTIALS(false, 2100, "이메일 또는 비밀번호가 올바르지 않습니다."),
    ROLE_MISMATCH(false, 2101, "선택한 로그인 유형과 계정 유형이 일치하지 않습니다."),
    DUPLICATE_EMAIL(false, 2102, "이미 사용 중인 이메일입니다."),
    // domain
    COMPANY_PROJECT_ANALYSIS_EMPTY(false, 2200, "회사 프로젝트 분석 결과가 비어있습니다."),
    USER_NOT_FOUND(false, 2201, "사용자를 찾을 수 없습니다."),
    PORTFOLIO_NOT_FOUND(false, 2202, "포트폴리오를 찾을 수 없습니다."),
    PORTFOLIO_FILE_REQUIRED(false, 2203, "포트폴리오 파일은 필수입니다."),
    PROFILE_IMAGE_REQUIRED(false, 2204, "프로필 이미지는 필수입니다."),
    PROFILE_IMAGE_NOT_FOUND(false, 2205, "프로필 이미지를 찾을 수 없습니다."),
    COMPANY_ALREADY_ASSIGNED(false, 2206, "이미 가입된 기업입니다."),
    COMPANY_PROJECT_ANALYSIS_NOT_FOUND(false, 2207, "회사 프로젝트 분석 결과가 없습니다."),

    // 5000: server error (5xx)

    // portfolio
    PORTFOLIO_S3_UPLOAD_FAILED(false, 5001, "포트폴리오 업로드에 실패했습니다."),
    PORTFOLIO_S3_DELETE_FAILED(false, 5002, "포트폴리오 삭제에 실패했습니다."),
    PORTFOLIO_ANALYSIS_SERVICE_UNAVAILABLE(false, 5003, "포트폴리오 분석 서비스가 응답하지 않습니다."),
    PORTFOLIO_ANALYSIS_PAYLOAD_FAILED(false, 5004, "포트폴리오 분석 요청 생성에 실패했습니다."),
    PORTFOLIO_ANALYSIS_EMPTY(false, 5005, "포트폴리오 분석 결과가 비어있습니다."),
    PORTFOLIO_ANALYSIS_BASE_URL_NOT_CONFIGURED(false, 5006, "포트폴리오 분석 URL 설정이 없습니다."),
    PORTFOLIO_EMBEDDING_EMPTY(false, 5007, "포트폴리오 임베딩 결과가 비어있습니다."),
    PORTFOLIO_EMBEDDING_SERVICE_UNAVAILABLE(false, 5008, "포트폴리오 임베딩 서비스가 응답하지 않습니다."),
    PORTFOLIO_EMBEDDING_SIZE_MISMATCH(false, 5009, "포트폴리오 임베딩 결과 사이즈 불일치"),
    PROFILE_IMAGE_S3_UPLOAD_FAILED(false, 5010, "프로필 이미지 업로드에 실패했습니다."),
    PORTFOLIO_EMBEDDING_BASE_URL_NOT_CONFIGURED(false, 5011, "포트폴리오 임베딩 URL 설정이 없습니다."),
    COMPANY_PROJECT_ANALYSIS_PAYLOAD_FAILED(false, 5012, "회사 프로젝트 분석 요청 생성에 실패했습니다."),
    COMPANY_PROJECT_ANALYSIS_SERVICE_UNAVAILABLE(false, 5013, "회사 프로젝트 분석 서비스가 응답하지 않습니다."),
    COMPANY_PROJECT_ANALYSIS_BASE_URL_NOT_CONFIGURED(false, 5014, "회사 프로젝트 분석 URL 설정이 없습니다."),
    EXPLANATION_PAYLOAD_FAILED(false, 5015, "설명 서비스 요청 생성에 실패했습니다."),
    EXPLANATION_SERVICE_UNAVAILABLE(false, 5016, "설명 서비스가 응답하지 않습니다."),
    EXPLANATION_RESPONSE_EMPTY(false, 5017, "설명 서비스 응답이 비어있습니다."),
    EXPLANATION_BASE_URL_NOT_CONFIGURED(false, 5018, "설명 서비스 URL 설정이 없습니다."),
    COMPANY_EMBEDDING_BASE_URL_NOT_CONFIGURED(false, 5019, "회사 임베딩 URL 설정이 없습니다."),
    COMPANY_EMBEDDING_SERVICE_UNAVAILABLE(false, 5020, "회사 임베딩 서비스가 응답하지 않습니다."),
    COMPANY_EMBEDDING_EMPTY(false, 5021, "회사 임베딩 결과가 비어있습니다."),
    COMPANY_EMBEDDING_SIZE_MISMATCH(false, 5022, "회사 임베딩 결과 사이즈 불일치"),
    EMBEDDING_VECTOR_EMPTY(false, 5023, "임베딩 벡터가 비어있습니다."),
    HASH_ALGORITHM_NOT_AVAILABLE(false, 5024, "해시 알고리즘을 사용할 수 없습니다."),

    // openai
    OPENAI_BASE_URL_NOT_CONFIGURED(false, 5100, "OpenAI URL 설정이 없습니다."),
    OPENAI_API_KEY_NOT_CONFIGURED(false, 5101, "OpenAI API 키 설정이 없습니다."),
    OPENAI_EMBEDDING_EMPTY(false, 5102, "OpenAI 임베딩 결과가 비어있습니다."),
    OPENAI_EMBEDDING_SERVICE_UNAVAILABLE(false, 5103, "OpenAI 임베딩 서비스가 응답하지 않습니다."),
    OPENAI_EMBEDDING_SIZE_MISMATCH(false, 5104, "OpenAI 임베딩 결과 사이즈 불일치"),
    OPENAI_EMBEDDING_INDEX_MISMATCH(false, 5105, "OpenAI 임베딩 결과 인덱스 불일치"),
    INTERNAL_SERVER_ERROR(false, 5999, "알 수 없는 서버 오류가 발생했습니다.");

    private final Boolean status;
    private final Integer code;
    private final String message;
    ResponseCode(Boolean status, Integer code, String message) {
        this.status = status;
        this.code = code;
        this.message = message;
    }
}
