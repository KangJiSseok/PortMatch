package com.portmatch.global.exception;

import com.portmatch.global.api.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<ErrorResponse>> handleValidation(MethodArgumentNotValidException ex) {

        List<ErrorResponse.FieldError> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldError)
                .toList();

        ErrorResponse body = ErrorResponse.validation(errors);

        // wrapper를 씌워두면 나중에 프론트 합의에 따라 형태 변경이 쉬움
        return ResponseEntity.badRequest().body(
                ApiResponse.error(body.getCode(), body.getMessage())
        );
    }

    private ErrorResponse.FieldError toFieldError(FieldError e) {
        return new ErrorResponse.FieldError(e.getField(), e.getDefaultMessage());
    }
}
