package com.portmatch.domain.auth.dto.request;

import com.portmatch.domain.applicants.enums.Gender;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class ApplicantSignUpRequest {

    @NotBlank(message = "이름은 필수입니다.")
    //@Size(min = 2, max = 50, message = "이름은 2~50자여야 합니다.")
    private String name;

    @Email(message = "이메일 형식이 올바르지 않습니다.")
    @NotBlank(message = "이메일은 필수입니다.")
    //@Size(max = 100, message = "이메일은 100자 이하로 입력해주세요.")
    private String email;

    @NotBlank(message = "비밀번호는 필수입니다.")
    //@Size(min = 8, max = 64, message = "비밀번호는 8~64자여야 합니다.")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,64}$",
            message = "비밀번호는 영문과 숫자를 포함해야 합니다."
    )
    private String password;

    // ===== 선택 입력(요구사항 기반) =====

    // 성별(선택) - 이미 Gender enum이 있으므로 활용
    private Gender gender;

    // 생년월일(선택)
    @Past(message = "생년월일은 과거 날짜여야 합니다.")
    private LocalDate birthDate;

    // 연락처
    @Pattern(
            regexp = "^(\\+82)?0?1[0-9]-?\\d{3,4}-?\\d{4}$|^$",
            message = "연락처 형식이 올바르지 않습니다."
    )
    @NotBlank(message = "전화번호는 필수입니다.")
    private String phone;

    // 주소(선택)
    //@Size(max = 200, message = "주소는 200자 이하로 입력해주세요.")
    private String address;

    // 현재 Applicant 엔티티에 존재 → 선택값으로 열어두면 좋음
    @Min(value = 0, message = "총 경력 연차는 0 이상이어야 합니다.")
    //@Max(value = 50, message = "총 경력 연차는 50 이하로 입력해주세요.")
    private Integer totalExperienceYears;


    @Override
    public String toString() {
        return "ApplicantSignUpRequest{" +
                "name='" + name + '\'' +
                ", email='" + email + '\'' +
                ", password='" + password + '\'' +
                ", gender=" + gender +
                ", birthDate=" + birthDate +
                ", phone='" + phone + '\'' +
                ", address='" + address + '\'' +
                ", totalExperienceYears=" + totalExperienceYears +
                '}';
    }
}
