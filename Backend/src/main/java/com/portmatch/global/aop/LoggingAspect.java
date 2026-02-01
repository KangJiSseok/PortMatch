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
import org.slf4j.Marker;
import org.slf4j.MarkerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    private static final int MAX_ARG_LENGTH = 500;
    private static final Marker HTTP_2XX = MarkerFactory.getMarker("HTTP_2XX");
    private static final Marker HTTP_4XX = MarkerFactory.getMarker("HTTP_4XX");
    private static final Marker HTTP_5XX = MarkerFactory.getMarker("HTTP_5XX");

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
        long start = System.currentTimeMillis();
        String requestInfo = resolveRequestInfo();
        String signature = joinPoint.getSignature().toShortString();
        String args = formatArgs(joinPoint.getArgs());

        log.info("[HTTP] {} {} args={}", requestInfo, signature, args);
        try {
            Object result = joinPoint.proceed();
            long tookMs = System.currentTimeMillis() - start;
            String resultType = result == null ? "void" : result.getClass().getSimpleName();
            int status = resolveResponseStatus();
            Marker marker = markerForStatus(status);
            if (marker != null) {
                log.info(marker, "[HTTP] {} {} status={} resultType={} tookMs={}", requestInfo, signature, status,
                        resultType, tookMs);
            } else {
                log.info("[HTTP] {} {} status={} resultType={} tookMs={}", requestInfo, signature, status, resultType,
                        tookMs);
            }
            return result;
        } catch (Exception ex) {
            long tookMs = System.currentTimeMillis() - start;
            log.warn("[HTTP] {} {} failed tookMs={} message={}", requestInfo, signature, tookMs, ex.getMessage());
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
            log.warn("[APP] {} failed tookMs={} message={}", signature, tookMs, ex.getMessage());
            throw ex;
        }
    }

    private String resolveRequestInfo() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return "-";
        }
        return attributes.getRequest().getMethod() + " " + attributes.getRequest().getRequestURI();
    }

    private int resolveResponseStatus() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null || attributes.getResponse() == null) {
            return 200;
        }
        int status = attributes.getResponse().getStatus();
        return status == 0 ? 200 : status;
    }

    private Marker markerForStatus(int status) {
        if (status >= 200 && status < 300) {
            return HTTP_2XX;
        }
        if (status >= 400 && status < 500) {
            return HTTP_4XX;
        }
        if (status >= 500 && status < 600) {
            return HTTP_5XX;
        }
        return null;
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
}
