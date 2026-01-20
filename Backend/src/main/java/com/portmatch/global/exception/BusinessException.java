package com.portmatch.global.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final String code;
    private final String field; // 필드 에러로 내려야 할 때만 사용 (null 가능)

    public BusinessException(String code, String message) {
        super(message);
        this.code = code;
        this.field = null;
    }

    public BusinessException(String code, String field, String message) {
        super(message);
        this.code = code;
        this.field = field;
    }
}
