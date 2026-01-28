package com.portmatch.domain.auth.dto;

import com.portmatch.domain.auth.dto.response.LoginResponse;
import io.swagger.v3.oas.annotations.media.Schema;

public class AuthApiResponses {

    @Schema(name = "AuthLoginApiResponse")
    public static class AuthLoginApiResponse {
        public boolean status;
        public int code;
        public String message;
        public LoginResponse data;
    }

    @Schema(name = "AuthMeApiResponse")
    public static class AuthMeApiResponse {
        public boolean status;
        public int code;
        public String message;
        public LoginResponse data;
    }

    @Schema(name = "AuthVoidApiResponse")
    public static class AuthVoidApiResponse {
        public boolean status;
        public int code;
        public String message;
        public Object data;
    }
}
