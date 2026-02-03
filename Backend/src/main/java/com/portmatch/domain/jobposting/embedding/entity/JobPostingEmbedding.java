package com.portmatch.domain.jobposting.embedding.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 채용공고 LLM 파싱 결과 및 임베딩 저장 엔티티
 * - 포트폴리오 프로젝트와의 시맨틱 매칭을 위한 벡터 저장
 */
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(
        name = "job_posting_embeddings",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_job_posting_embeddings_job_posting_id",
                columnNames = "job_posting_id"
        )
)
public class JobPostingEmbedding {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_posting_id", nullable = false)
    private Long jobPostingId;

    /**
     * LLM 파싱 결과 필드들
     */
    @Column(length = 500)
    private String name;

    @Column(length = 100)
    private String domain;

    @Column(columnDefinition = "TEXT")
    private String problem;

    @Column(columnDefinition = "TEXT")
    private String solution;

    @Column(columnDefinition = "TEXT")
    private String tech;  // JSON array string

    @Column(name = "architecture_experience", columnDefinition = "TEXT")
    private String architectureExperience;  // JSON array string

    @Column(columnDefinition = "TEXT")
    private String keywords;  // JSON array string

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "content_hash", length = 64)
    private String contentHash;

    /**
     * 임베딩 벡터 컬럼 (1536 차원 - OpenAI ada-002)
     */
    @Column(name = "name_embedding", columnDefinition = "vector(1536)")
    private String nameEmbedding;

    @Column(name = "domain_embedding", columnDefinition = "vector(1536)")
    private String domainEmbedding;

    @Column(name = "problem_embedding", columnDefinition = "vector(1536)")
    private String problemEmbedding;

    @Column(name = "solution_embedding", columnDefinition = "vector(1536)")
    private String solutionEmbedding;

    @Column(name = "tech_embedding", columnDefinition = "vector(1536)")
    private String techEmbedding;

    @Column(name = "architecture_embedding", columnDefinition = "vector(1536)")
    private String architectureEmbedding;

    @Column(name = "keywords_embedding", columnDefinition = "vector(1536)")
    private String keywordsEmbedding;

    /**
     * Missing 필드 플래그
     */
    @Column(name = "problem_missing", nullable = false)
    private boolean problemMissing = false;

    @Column(name = "solution_missing", nullable = false)
    private boolean solutionMissing = false;

    @Column(name = "tech_missing", nullable = false)
    private boolean techMissing = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public JobPostingEmbedding(
            Long jobPostingId,
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
        this.jobPostingId = jobPostingId;
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

    public void updateEmbeddings(
            String nameEmbedding,
            String domainEmbedding,
            String problemEmbedding,
            String solutionEmbedding,
            String techEmbedding,
            String architectureEmbedding,
            String keywordsEmbedding,
            boolean problemMissing,
            boolean solutionMissing,
            boolean techMissing
    ) {
        this.nameEmbedding = nameEmbedding;
        this.domainEmbedding = domainEmbedding;
        this.problemEmbedding = problemEmbedding;
        this.solutionEmbedding = solutionEmbedding;
        this.techEmbedding = techEmbedding;
        this.architectureEmbedding = architectureEmbedding;
        this.keywordsEmbedding = keywordsEmbedding;
        this.problemMissing = problemMissing;
        this.solutionMissing = solutionMissing;
        this.techMissing = techMissing;
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
