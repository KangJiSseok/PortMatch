package com.portmatch.domain.resume.entity;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "resumes",
        indexes = {
                @Index(name = "idx_resumes_user_id", columnList = "user_id")
        }
)
public class Resume extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_resumes_user")
    )
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "is_main", nullable = false)
    private Boolean isMain;

    @OneToOne(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private ResumeProfile profile;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeCareerEntry> careerEntries = new ArrayList<>();

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ResumeEducationEntry> educationEntries = new ArrayList<>();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "portfolio_id",
            unique = true,
            foreignKey = @ForeignKey(name = "fk_resumes_portfolio")
    )
    private Portfolio portfolio;

    @OneToMany(mappedBy = "resume", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SelfIntroduction> selfIntroductions = new ArrayList<>();

    public static Resume create(User user, String title, boolean isMain) {
        Resume resume = new Resume();
        resume.user = user;
        resume.title = title;
        resume.isMain = isMain;
        return resume;
    }

    public void updateTitle(String title) {
        this.title = title;
    }

    public void markMain(boolean isMain) {
        this.isMain = isMain;
        if (this.portfolio != null) {
            this.portfolio.markMain(isMain);
        }
    }

    public void setProfile(ResumeProfile profile) {
        this.profile = profile;
    }

    public void setPortfolio(Portfolio portfolio) {
        this.portfolio = portfolio;
        if (this.portfolio != null) {
            this.portfolio.markMain(Boolean.TRUE.equals(this.isMain));
        }
    }
}
