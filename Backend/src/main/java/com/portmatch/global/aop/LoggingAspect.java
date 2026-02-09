package com.portmatch.global.aop;

import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import com.portmatch.global.exception.BusinessException;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    private static final int MAX_ARG_LENGTH = 500;
    @Pointcut("within(com.portmatch.domain..controller..*)")
    public void controllerLayer() {
    }

    @Pointcut("within(com.portmatch.domain..service..*)")
    public void serviceLayer() {
    }

    @Pointcut("within(com.portmatch.domain..repository..*)")
    public void repositoryLayer() {
    }

    @Around("controllerLayer()")
    public Object logController(ProceedingJoinPoint joinPoint) throws Throwable {
        try {
            return joinPoint.proceed();
        } catch (Exception ex) {
            throw ex;
        }
    }

    @Around("serviceLayer() || repositoryLayer()")
    public Object logServiceOrRepository(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        String signature = joinPoint.getSignature().toShortString();
        String args = formatArgs(joinPoint.getArgs());

        log.debug("[APP] {} args={}", signature, args);
        try {
            Object result = joinPoint.proceed();
            long tookMs = System.currentTimeMillis() - start;
            String resultType = result == null ? "void" : result.getClass().getSimpleName();
            log.debug("[APP] {} resultType={} tookMs={}", signature, resultType, tookMs);
            return result;
        } catch (Exception ex) {
            long tookMs = System.currentTimeMillis() - start;
            if (isServerError(ex)) {
                log.error("[APP] {} failed tookMs={} message={}", signature, tookMs, ex.getMessage(), ex);
            } else {
                log.warn("[APP] {} failed tookMs={} message={}", signature, tookMs, ex.getMessage());
            }
            throw ex;
        }
    }

    private String formatArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        return Arrays.stream(args)
                .map(this::safeArg)
                .collect(Collectors.joining(", ", "[", "]"));
    }

    private String safeArg(Object arg) {
        if (arg == null) {
            return "null";
        }
        if (arg instanceof ServletRequest) {
            return "<ServletRequest>";
        }
        if (arg instanceof ServletResponse) {
            return "<ServletResponse>";
        }
        if (arg instanceof MultipartFile file) {
            String name = file.getOriginalFilename();
            return name == null ? "<MultipartFile>" : "<MultipartFile:" + name + ">";
        }
        if (arg instanceof InputStream) {
            return "<InputStream>";
        }
        if (arg instanceof OutputStream) {
            return "<OutputStream>";
        }
        String value = String.valueOf(arg);
        if (value.length() > MAX_ARG_LENGTH) {
            return value.substring(0, MAX_ARG_LENGTH) + "...";
        }
        return value;
    }

    private boolean isServerError(Exception ex) {
        if (ex instanceof BusinessException be) {
            Integer code = be.getResponseCode().getCode();
            return code != null && code >= 5000;
        }
        return true;
    }
}
