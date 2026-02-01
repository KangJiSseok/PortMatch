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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Aspect
@Component
public class LoggingAspect {

    private static final int MAX_ARG_LENGTH = 500;
    private static final Logger HTTP_STATUS_LOG = LoggerFactory.getLogger("HTTP_STATUS");

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
            String group = groupForStatus(status);
            withHttpGroup(group, () -> HTTP_STATUS_LOG.info(
                    "[HTTP] {} {} status={} resultType={} tookMs={}",
                    requestInfo, signature, status, resultType, tookMs
            ));
            return result;
        } catch (Exception ex) {
            long tookMs = System.currentTimeMillis() - start;
            HTTP_STATUS_LOG.warn("[HTTP] {} {} failed tookMs={} message={}", requestInfo, signature, tookMs,
                    ex.getMessage());
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

    private String groupForStatus(int status) {
        if (status >= 200 && status < 300) {
            return "2xx";
        }
        if (status >= 400 && status < 500) {
            return "4xx";
        }
        if (status >= 500 && status < 600) {
            return "5xx";
        }
        return "other";
    }

    private void withHttpGroup(String group, Runnable action) {
        MDC.put("http_status_group", group);
        try {
            action.run();
        } finally {
            MDC.remove("http_status_group");
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
}
