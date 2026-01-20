package com.portmatch.domain.auth.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CompanySignUpRequest {

    // ===== 계정 정보 =====

    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    private String password;

    @NotBlank(message = "사업자등록번호는 필수입니다.")
    @Pattern(
            regexp = "^(\\d{10}|\\d{3}-\\d{2}-\\d{5})$",
            message = "사업자등록번호 형식이 올바르지 않습니다. (예: 1234567890 또는 123-45-67890)"
    )
    private String businessNumber;

    @NotBlank(message = "담당자 연락처는 필수입니다.")
    @Pattern(regexp = "^[0-9-]{9,20}$", message = "담당자 연락처 형식이 올바르지 않습니다.")
    private String managerPhone;

    // ===== 회사 연결 정보 =====

    @Valid
    @NotNull(message = "company 정보는 필수입니다.")
    private CompanyLink company;

    // =========================
    // 내부 클래스
    // =========================

    @Getter
    @NoArgsConstructor
    public static class CompanyLink {

        /**
         * EXISTING : 기존 회사 선택 (이름 검색 → 선택 → id 전달)
         * NEW      : 신규 회사 등록
         */
        @NotNull(message = "company.type은 필수입니다.")
        private CompanyLinkType type;

        // 기존 회사 선택 시 사용
        private Long existingCompanyId;

        // 신규 회사 등록 시 사용
        @Valid
        private NewCompany newCompany;

        /**
         * 최소 구조 검증:
         * - EXISTING → existingCompanyId 필수
         * - NEW → newCompany 필수
         * - 둘 동시에 존재하면 안 됨
         */
        @AssertTrue(message = "company.type에 맞는 회사 정보가 필요합니다.")
        public boolean isValid() {
            if (type == null) return false;

            return switch (type) {
                case EXISTING ->
                        existingCompanyId != null && newCompany == null;
                case NEW ->
                        existingCompanyId == null && newCompany != null;
            };
        }
    }

    public enum CompanyLinkType {
        EXISTING,
        NEW
    }

    @Getter
    @NoArgsConstructor
    public static class NewCompany {

        // 요구사항 명세: '기업 이름 검색' 기준이므로
        // 신규 등록 시 이름은 거의 확정적으로 필요
        @NotBlank(message = "기업명은 필수입니다.")
        private String name;

        // ERD에 있으므로 받되, 정책 미확정 → optional
        private String size;
        private String address;
    }
}
