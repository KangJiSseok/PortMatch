package com.portmatch.domain.applicants.entity;

import com.portmatch.domain.applicants.enums.Gender;
import com.portmatch.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "applicants",
        uniqueConstraints = @UniqueConstraint(name = "uk_applicants_user_id", columnNames = "user_id")
)
public class Applicant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User 1 : Applicant 0..1
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_applicants_user")
    )
    private User user;

    @Column(name = "birth_date")
    private LocalDate birthDate; // ERD: applicants.birth_date (date)

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender; // ERD: applicants.gender (varchar)

    @Column(name = "total_experience_years")
    private Integer totalExperienceYears;

    public Applicant(User user, LocalDate birthDate, Gender gender, Integer totalExperienceYears) {
        this.user = user;
        this.birthDate = birthDate;
        this.gender = gender;
        this.totalExperienceYears = totalExperienceYears;
    }
}
