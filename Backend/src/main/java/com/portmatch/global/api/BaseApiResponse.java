package com.portmatch.global.api;

import com.portmatch.global.response.ResponseCode;
import lombok.Getter;

@Getter
public class BaseApiResponse<T> {

    private final int code;
    private final String message;
    private T data;

    public BaseApiResponse(int code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> BaseApiResponse<T> ok(T data) {
        return new BaseApiResponse<>(ResponseCode.OK.getCode(), ResponseCode.OK.getMessage(), data);
    }

    public static <T> BaseApiResponse<T> ok(int code, String message, T data) {
        return new BaseApiResponse<>(code, message, data);
    }

    public static <T> BaseApiResponse<T> error(ResponseCode responseCode) {
        return new BaseApiResponse<>(responseCode.getCode(), responseCode.getMessage(), null);
    }

    public static <T> BaseApiResponse<T> error(int code, String message) {
        return new BaseApiResponse<>(code, message, null);
    }
}
