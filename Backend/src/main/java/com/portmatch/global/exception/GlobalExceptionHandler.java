package com.portmatch.global.exception;

import com.portmatch.global.api.BaseApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseApiResponse<ErrorResponse>> handleValidation(MethodArgumentNotValidException ex) {

        List<ErrorResponse.FieldError> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toFieldError)
                .toList();

        ErrorResponse body = ErrorResponse.validation(errors);

        // wrapper를 씌워두면 나중에 프론트 합의에 따라 형태 변경이 쉬움
        return ResponseEntity.badRequest().body(
                new BaseApiResponse<>("VALIDATION_ERROR", "입력값이 올바르지 않습니다.", body)
        );
    }

    private ErrorResponse.FieldError toFieldError(FieldError e) {
        return new ErrorResponse.FieldError(e.getField(), e.getDefaultMessage());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<BaseApiResponse<ErrorResponse>> handleBusiness(BusinessException ex) {

        // field가 있으면 validation 형태로 내려서 프론트가 처리하기 쉽게
        ErrorResponse body;
        if (ex.getField() != null) {
            body = ErrorResponse.validation(
                    List.of(new ErrorResponse.FieldError(ex.getField(), ex.getMessage()))
            );
        } else {
            body = new ErrorResponse(ex.getCode(), ex.getMessage(), null);
        }

        return ResponseEntity.badRequest().body(
                BaseApiResponse.error(body.getCode(), body.getMessage())
        );
    }

}
