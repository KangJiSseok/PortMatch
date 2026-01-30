package com.portmatch.domain.resume.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "resume_profiles",
        uniqueConstraints = @UniqueConstraint(name = "uk_resume_profiles_resume_id", columnNames = "resume_id"),
        indexes = {
                @Index(name = "idx_resume_profiles_resume_id", columnList = "resume_id")
        }
)
public class ResumeProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "resume_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_resume_profiles_resume")
    )
    private Resume resume;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String contact;

    @Column(nullable = false, length = 255)
    private String email;

    @Column(length = 500)
    private String address;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "profile_image_id",
            foreignKey = @ForeignKey(name = "fk_resume_profiles_profile_image")
    )
    private ProfileImage profileImage;

    public static ResumeProfile create(
            Resume resume,
            String name,
            String contact,
            String email,
            String address
    ) {
        ResumeProfile profile = new ResumeProfile();
        profile.resume = resume;
        profile.name = name;
        profile.contact = contact;
        profile.email = email;
        profile.address = address;
        return profile;
    }

    public void update(String name, String contact, String email, String address) {
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.address = address;
    }

    public void updateProfileImage(ProfileImage profileImage) {
        this.profileImage = profileImage;
    }

    public void clearProfileImage() {
        this.profileImage = null;
    }
}
