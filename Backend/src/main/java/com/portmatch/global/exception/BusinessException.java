package com.portmatch.global.exception;

import com.portmatch.global.response.ResponseCode;
import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ResponseCode responseCode;
    private final String field;

    public BusinessException(ResponseCode responseCode) {
        super(responseCode.getMessage());
        this.responseCode = responseCode;
        this.field = null;
    }

    public BusinessException(ResponseCode responseCode, String field, String message) {
        super(message);
        this.responseCode = responseCode;
        this.field = field;
    }
}