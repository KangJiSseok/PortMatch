package com.portmatch.domain.jobposting.parsed.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 채용공고 LLM 파싱 결과 저장 엔티티
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "job_posting_parsed",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_posting_parsed_job_posting_id",
                columnNames = "job_posting_id"
        )
)
public class JobPostingParsed {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_posting_id", nullable = false)
    private Long jobPostingId;

    @Column(length = 500)
    private String name;

    @Column(length = 100)
    private String domain;

    @Column(columnDefinition = "TEXT")
    private String problem;

    @Column(columnDefinition = "TEXT")
    private String solution;

    @Column(columnDefinition = "TEXT")
    private String tech;

    @Column(name = "architecture_experience", columnDefinition = "TEXT")
    private String architectureExperience;

    @Column(columnDefinition = "TEXT")
    private String keywords;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public JobPostingParsed(Long jobPostingId) {
        this.jobPostingId = jobPostingId;
    }

    public void updateParsed(
            String name,
            String domain,
            String problem,
            String solution,
            String tech,
            String architectureExperience,
            String keywords,
            String content,
            String contentHash
    ) {
        this.name = name;
        this.domain = domain;
        this.problem = problem;
        this.solution = solution;
        this.tech = tech;
        this.architectureExperience = architectureExperience;
        this.keywords = keywords;
        this.content = content;
        this.contentHash = contentHash;
    }

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
