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
import com.portmatch.global.response.ResponseCode;
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
            throw new BusinessException(ResponseCode.DUPLICATE_EMAIL, "email", "이미 사용 중인 이메일입니다.");
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
            throw new BusinessException(ResponseCode.DUPLICATE_EMAIL, "email", "이미 사용 중인 이메일입니다.");
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

        // 2. companyName으로 회사 조회
        Company company = companyRepository
                .findByCompaniesName(req.getCompanyName())
                .orElseGet(() -> {
                    // 3. 없으면 새로 생성
                    Company newCompany = new Company(
                            null, // 아직 user 없음
                            req.getCompanyName(),
                            req.getAddress(),
                            req.getSize(),
                            req.getHomepageUrl()
                    );
                    return companyRepository.save(newCompany);
                });

        // 4. 회사에 user 연결
        company.assignUser(user);
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
            throw new BusinessException(ResponseCode.VALIDATION_ERROR, field, message);
        }
        return phone;
    }

}
