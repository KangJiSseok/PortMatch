package com.portmatch.domain.auth.service;

import com.portmatch.domain.applicants.entity.Applicant;
import com.portmatch.domain.applicants.repository.ApplicantRepository;
import com.portmatch.domain.auth.dto.request.ApplicantSignUpRequest;
import com.portmatch.domain.auth.dto.request.CompanySignUpRequest;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.companies.entity.Company;
import com.portmatch.domain.companies.repository.CompanyRepository;
import com.portmatch.global.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthSignUpService {

    private final UserRepository userRepository;
    private final ApplicantRepository applicantRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    /* ===================== 개인 회원가입 ===================== */

    public void signUpApplicant(ApplicantSignUpRequest req) {

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("DUPLICATE_EMAIL", "email", "이미 사용 중인 이메일입니다.");
        }

        String phone = requirePhone(req.getPhone(), "phone", "연락처는 필수입니다.");
        String username = generateUniqueUsername(req.getEmail());

        User user = new User(
                username,
                passwordEncoder.encode(req.getPassword()),
                req.getName(),
                phone,
                req.getEmail(),
                Role.APPLICANT
        );
        userRepository.save(user);

        Applicant applicant = new Applicant(
                user,
                req.getBirthDate(),
                req.getGender(),
                req.getTotalExperienceYears()
        );
        applicantRepository.save(applicant);
    }

    /* ===================== 기업 회원가입 ===================== */

    public void signUpCompany(CompanySignUpRequest req) {

        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("DUPLICATE_EMAIL", "email", "이미 사용 중인 이메일입니다.");
        }

        String username = generateUniqueUsername(req.getEmail());
        String phone = requirePhone(req.getManagerPhone(), "managerPhone", "담당자 연락처는 필수입니다.");

        User user = new User(
                username,
                passwordEncoder.encode(req.getPassword()),
                req.getManagerName(),   // ✅ 담당자명
                phone,
                req.getEmail(),
                Role.COMPANY
        );
        userRepository.save(user);

        // ✅ businessNumber는 받지만 매핑/저장에서는 무시
        Company company = new Company(
                user,
                req.getCompanyName(),
                req.getAddress(),
                req.getSize(),
                req.getHomepageUrl()
        );
        companyRepository.save(company);
    }

    private String generateUniqueUsername(String email) {
        String base = email.split("@")[0];
        String candidate = base;

        int guard = 0;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + UUID.randomUUID().toString().substring(0, 8);
            if (++guard > 10) break;
        }
        return candidate;
    }

    private String requirePhone(String phone, String field, String message) {
        if (phone == null || phone.isBlank()) {
            throw new BusinessException("VALIDATION_ERROR", field, message);
        }
        return phone;
    }

}
