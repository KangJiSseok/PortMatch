package com.portmatch.global.api;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiResponse<T> {
    private String code;     // 예: "OK", "VALIDATION_ERROR"
    private String message;  // 사람이 읽는 메시지
    private T data;          // 성공 시 payload, 실패 시 null

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>("OK", "success", data);
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        return new ApiResponse<>(code, message, null);
    }
}