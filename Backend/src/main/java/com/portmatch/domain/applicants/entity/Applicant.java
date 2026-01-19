package com.portmatch.domain.applicants.entity;

import com.portmatch.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(name = "applicants",
        uniqueConstraints = @UniqueConstraint(name = "uk_applicants_user_id", columnNames = "user_id"))
public class Applicant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // User 1 : Applicant 0..1
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_applicants_user"))
    private User user;

    @Column(nullable = false)
    private String name;

    private String phone;

    @Column(name = "total_experience_years")
    private Integer totalExperienceYears;

    public Applicant(User user, String name, String phone, Integer totalExperienceYears) {
        this.user = user;
        this.name = name;
        this.phone = phone;
        this.totalExperienceYears = totalExperienceYears;
    }
}
