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

        // 🔹 사업자번호 정규화 (단 한 번)
        String normalizedBusinessNumber = normalizeBusinessNumber(req.getBusinessNumber());

        if (companyRepository.existsByBusinessRegistrationNumber(normalizedBusinessNumber)) {
            throw new BusinessException(
                    "DUPLICATE_BUSINESS_NUMBER",
                    "businessNumber",
                    "이미 등록된 사업자등록번호입니다."
            );
        }

        String username = generateUniqueUsername(req.getEmail());
        String userName = resolveCompanyUserName(req);
        String phone = requirePhone(req.getManagerPhone(), "managerPhone", "담당자 연락처는 필수입니다.");

        User user = new User(
                username,
                passwordEncoder.encode(req.getPassword()),
                userName,
                phone,
                req.getEmail(),
                Role.COMPANY
        );
        userRepository.save(user);

        Company company = buildCompanyEntity(user, normalizedBusinessNumber, req);
        companyRepository.save(company);
    }

    /* ===================== Company 생성 ===================== */

    private Company buildCompanyEntity(
            User user,
            String businessNumber, // ⭐ 반드시 정규화된 값만 받음
            CompanySignUpRequest req
    ) {
        CompanySignUpRequest.CompanyLink link = req.getCompany();

        // NEW 회사 등록
        if (link.getType() == CompanySignUpRequest.CompanyLinkType.NEW) {
            CompanySignUpRequest.NewCompany nc = link.getNewCompany();

            if (nc.getAddress() == null || nc.getAddress().isBlank()) {
                throw new BusinessException(
                        "VALIDATION_ERROR",
                        "company.newCompany.address",
                        "기업 주소는 필수입니다."
                );
            }

            return new Company(
                    user,
                    businessNumber,
                    nc.getName(),
                    nc.getAddress(),
                    nc.getSize(),
                    null
            );
        }

        // EXISTING 회사 선택
        if (link.getExistingCompanyId() == null) {
            throw new BusinessException(
                    "VALIDATION_ERROR",
                    "company.existingCompanyId",
                    "existingCompanyId가 필요합니다."
            );
        }

        Company base = companyRepository.findById(link.getExistingCompanyId())
                .orElseThrow(() -> new BusinessException(
                        "COMPANY_NOT_FOUND",
                        "company.existingCompanyId",
                        "선택한 기업이 존재하지 않습니다."
                ));

        return new Company(
                user,
                businessNumber,
                base.getCompaniesName(),
                base.getAddress(),
                base.getSize(),
                base.getHomepageUrl()
        );
    }

    /* ===================== 유틸 메서드 ===================== */

    private String resolveCompanyUserName(CompanySignUpRequest req) {
        CompanySignUpRequest.CompanyLink link = req.getCompany();
        if (link.getType() == CompanySignUpRequest.CompanyLinkType.NEW && link.getNewCompany() != null) {
            return link.getNewCompany().getName();
        }
        return "COMPANY";
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

    private String normalizeBusinessNumber(String raw) {
        return raw.replaceAll("[^0-9]", "");
    }
}
