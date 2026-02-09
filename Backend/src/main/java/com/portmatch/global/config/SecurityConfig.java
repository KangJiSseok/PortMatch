package com.portmatch.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityCustomizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class SecurityConfig {

    @Bean
    public WebSecurityCustomizer webSecurityCustomizer() {
        return (web) -> web.ignoring()
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html");
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // ✅ CORS (팀 프로젝트라 아직 확정 안 됐으니, 일단 안전한 기본 틀만)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // ✅ 세션 기반 (필요할 때만 생성)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))

                // ✅ CSRF: API 개발 편의상 /api/** 만 무시 (전체 disable 보다 안전)
                .csrf(csrf -> csrf.ignoringRequestMatchers("/api/**"))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> res.sendError(401))
                        .accessDeniedHandler((req, res, e) -> res.sendError(403))
                )

                // ✅ 인가 정책
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                // ✅ 인증 없이 허용
                                "/api/accounts/signup/**",
                                "/api/auth/login",
                                "/api/auth/logout",
                                "/api/company-projects/**",

                                "/api/job-postings",
                                "/api/job-postings/*",
                                "/api/job-postings/*/detail",
                                "/api/job-postings/*/matching",
                                "/api/job-postings/match/**",
                                "/api/stacks/**",
                                "/api/companies/**",
                                "/api/interview/sessions/**",
                                "/api/interview/webhook",
                                "/api/company-scraps/**",
                                "/api/interview-templates/**",

                                // ✅ Swagger / OpenAPI 허용 (springdoc 기본 경로)
                                "/v3/api-docs/**",
                                "/swagger-ui/**",
                                "/swagger-ui.html",

                                "/actuator/**"
                        ).permitAll()

                        .requestMatchers("/api/auth/me").authenticated()
                        .anyRequest().authenticated()
                )

                // 기본 UI 비활성화
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        return http.build();
    }

    /**
     * ⚠️ allowedOrigins는 프론트 주소가 확정되면 정확히 박아주세요.
     * - "*" 와 allowCredentials(true)는 같이 못 씁니다.
     * - 세션(쿠키) 쓰려면 allowCredentials(true) 필요합니다.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 개발 단계 임시 예시: 프론트 도메인 확정되면 정확히 입력 권장
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "https://localhost:*",
                "https://i14d205.p.ssafy.io"
        ));

        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true); // ✅ 세션 쿠키 주고받기 필수
        config.setExposedHeaders(List.of("Set-Cookie"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ✅ AuthenticationManager Bean (세션 로그인 구현에 필요)
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }
}
