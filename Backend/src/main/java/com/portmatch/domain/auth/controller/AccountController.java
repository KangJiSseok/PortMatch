package com.portmatch.domain.auth.controller;

import com.portmatch.domain.auth.dto.request.ApplicantSignUpRequest;
import com.portmatch.domain.auth.dto.request.CompanySignUpRequest;
import com.portmatch.domain.auth.service.AuthSignUpService;
import com.portmatch.global.api.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accounts")
public class AccountController {

    private final AuthSignUpService authSignUpService;

    @PostMapping("/signup/applicant")
    public ResponseEntity<ApiResponse<Void>> signUpApplicant(
            @Valid @RequestBody ApplicantSignUpRequest req
    ) {
        authSignUpService.signUpApplicant(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
    }

    @PostMapping("/signup/company")
    public ResponseEntity<ApiResponse<Void>> signUpCompany(
            @Valid @RequestBody CompanySignUpRequest req
    ) {

        System.out.println(">>> company signup request arrived");

        authSignUpService.signUpCompany(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(null));
    }
}
