package com.portmatch.global.exception;

import com.portmatch.global.api.BaseApiResponse;
import com.portmatch.global.response.ResponseCode;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger HTTP_STATUS_LOG = LoggerFactory.getLogger("HTTP_STATUS");

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<BaseApiResponse<?>> handleBusiness(BusinessException ex) {
        ResponseCode code = ex.getResponseCode();
        HttpStatus status = mapToHttpStatus(code.getCode());

        if (status.is5xxServerError()) {
            withHttpGroup("5xx", () -> HTTP_STATUS_LOG.error(
                    "[HTTP-5XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), ex.getMessage(), ex
            ));
        } else if (status.is4xxClientError()) {
            withHttpGroup("4xx", () -> HTTP_STATUS_LOG.warn(
                    "[HTTP-4XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), ex.getMessage()
            ));
        }

        if (ex.getField() != null) {
            List<ErrorField> errors = List.of(new ErrorField(ex.getField(), ex.getMessage()));
            return ResponseEntity.status(status).body(
                    new BaseApiResponse<>(code.getStatus(), code.getCode(), code.getMessage(), errors)
            );
        }

        return ResponseEntity.status(status).body(BaseApiResponse.error(code));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<BaseApiResponse<?>> handleValidation(MethodArgumentNotValidException ex) {
        List<ErrorField> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toErrorField)
                .toList();

        ResponseCode code = ResponseCode.VALIDATION_ERROR;
        HttpStatus status = mapToHttpStatus(code.getCode());

        if (status.is4xxClientError()) {
            withHttpGroup("4xx", () -> HTTP_STATUS_LOG.warn(
                    "[HTTP-4XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), code.getMessage()
            ));
        }

        return ResponseEntity
                .status(status)
                .body(new BaseApiResponse<>(code.getStatus(), code.getCode(), code.getMessage(), errors));
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<BaseApiResponse<?>> handleBindException(BindException ex) {
        List<ErrorField> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toErrorField)
                .toList();

        ResponseCode code = ResponseCode.VALIDATION_ERROR;
        HttpStatus status = mapToHttpStatus(code.getCode());

        if (status.is4xxClientError()) {
            withHttpGroup("4xx", () -> HTTP_STATUS_LOG.warn(
                    "[HTTP-4XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), code.getMessage()
            ));
        }

        return ResponseEntity
                .status(status)
                .body(new BaseApiResponse<>(code.getStatus(), code.getCode(), code.getMessage(), errors));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<BaseApiResponse<?>> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        ResponseCode code = ResponseCode.INVALID_PARAMETER;
        HttpStatus status = mapToHttpStatus(code.getCode());

        if (status.is4xxClientError()) {
            withHttpGroup("4xx", () -> HTTP_STATUS_LOG.warn(
                    "[HTTP-4XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), code.getMessage()
            ));
        }

        return ResponseEntity
                .status(status)
                .body(BaseApiResponse.error(code));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<BaseApiResponse<?>> handleMissingParam(MissingServletRequestParameterException e) {
        ResponseCode code = ResponseCode.INVALID_PARAMETER;
        HttpStatus status = mapToHttpStatus(code.getCode());

        if (status.is4xxClientError()) {
            withHttpGroup("4xx", () -> HTTP_STATUS_LOG.warn(
                    "[HTTP-4XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), code.getMessage()
            ));
        }

        return ResponseEntity
                .status(status)
                .body(BaseApiResponse.error(code));
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<BaseApiResponse<?>> handleNotFound(NoHandlerFoundException e) {
        ResponseCode code = ResponseCode.NOT_FOUND;
        HttpStatus status = mapToHttpStatus(code.getCode());

        if (status.is4xxClientError()) {
            withHttpGroup("4xx", () -> HTTP_STATUS_LOG.warn(
                    "[HTTP-4XX] {} status={} code={} message={}",
                    resolveRequestInfo(), status.value(), code.getCode(), code.getMessage()
            ));
        }

        return ResponseEntity
                .status(status)
                .body(BaseApiResponse.error(code));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<BaseApiResponse<?>> handleException(Exception e) {
        ResponseCode code = ResponseCode.INTERNAL_SERVER_ERROR;
        HttpStatus status = mapToHttpStatus(code.getCode());

        withHttpGroup("5xx", () -> HTTP_STATUS_LOG.error(
                "[HTTP-5XX] {} status={} code={} message={}",
                resolveRequestInfo(), status.value(), code.getCode(), e.getMessage(), e
        ));

        return ResponseEntity
                .status(status)
                .body(BaseApiResponse.error(code));
    }

    private ErrorField toErrorField(FieldError e) {
        return new ErrorField(e.getField(), e.getDefaultMessage());
    }

    @Getter
    @AllArgsConstructor
    public static class ErrorField {
        private String field;
        private String message;
    }

    private HttpStatus mapToHttpStatus(int code) {
        if (code >= 1000 && code < 2000) {
            return HttpStatus.OK;
        }
        if (code >= 2000 && code < 5000) {
            return HttpStatus.BAD_REQUEST;
        }
        if (code >= 5000 && code < 6000) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private void withHttpGroup(String group, Runnable action) {
        MDC.put("http_status_group", group);
        try {
            action.run();
        } finally {
            MDC.remove("http_status_group");
        }
    }

    private String resolveRequestInfo() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null || attributes.getRequest() == null) {
            return "-";
        }
        return attributes.getRequest().getMethod() + " " + attributes.getRequest().getRequestURI();
    }
}
