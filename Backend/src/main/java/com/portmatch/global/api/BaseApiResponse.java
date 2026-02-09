package com.portmatch.global.api;

import com.portmatch.global.response.ResponseCode;
import lombok.Getter;

@Getter
public class BaseApiResponse<T> {

    private final boolean status;
    private final int code;
    private final String message;
    private T data;

    public BaseApiResponse(boolean status, int code, String message, T data) {
        this.status = status;
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> BaseApiResponse<T> ok(T data) {
        return new BaseApiResponse<>(ResponseCode.OK.getStatus(), ResponseCode.OK.getCode(), ResponseCode.OK.getMessage(), data);
    }

    public static <T> BaseApiResponse<T> ok(int code, String message, T data) {
        return new BaseApiResponse<>(true, code, message, data);
    }

    public static <T> BaseApiResponse<T> error(ResponseCode responseCode) {
        return new BaseApiResponse<>(responseCode.getStatus(), responseCode.getCode(), responseCode.getMessage(), null);
    }

    public static <T> BaseApiResponse<T> error(int code, String message) {
        return new BaseApiResponse<>(false, code, message, null);
    }
}
