package com.portmatch.global.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                // ✅ 개발 초기: 전부 허용 (Security가 앱을 막지 않게)
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )

                // ✅ 기본 로그인 폼/로그아웃 화면 같은 “기본 UI”가 튀어나오는 것 방지
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                // ✅ (선택) REST 개발 편의: CSRF 끔
                // - Security 켜고 POST/PUT/DELETE 테스트하면 403 뜨는 경우가 많아서
                .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
