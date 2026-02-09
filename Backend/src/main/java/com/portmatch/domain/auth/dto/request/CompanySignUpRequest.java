package com.portmatch.domain.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    @NotBlank(message = "담당자명은 필수입니다.")
    private String managerName;

    @NotBlank(message = "담당자 연락처는 필수입니다.")
    @Pattern(regexp = "^[0-9-]{9,20}$", message = "담당자 연락처 형식이 올바르지 않습니다.")
    private String managerPhone;

    // ===== 회사 정보 =====
    @NotBlank(message = "기업명은 필수입니다.")
    private String companyName;

    /**
     * ✅ 요청으로는 받되, 서버 매핑/저장에서는 사용하지 않음(무시)
     * - UI 모양새 때문에 존재하는 필드
     * - 검증 때문에 막히면 안 되니 너무 빡센 정규식은 금지
     */
    @NotBlank(message = "사업자등록번호는 필수입니다.")
    @Pattern(regexp = "^[0-9-]{1,20}$", message = "사업자등록번호 형식이 올바르지 않습니다.")
    private String businessNumber;

    @NotBlank(message = "기업 주소는 필수입니다.")
    private String address;

    // optional
    private String size;
    private String homepageUrl;
}
