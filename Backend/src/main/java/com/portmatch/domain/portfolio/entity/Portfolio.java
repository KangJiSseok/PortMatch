package com.portmatch.domain.portfolio.entity;

import com.portmatch.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "portfolios",
        indexes = {
                @Index(name = "idx_portfolios_user_id", columnList = "user_id")
        }
)
public class Portfolio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_portfolios_user")
    )
    private User user;

    @Column(name = "s3_key", nullable = false, length = 512)
    private String s3Key;

    @Column(name = "file_url", nullable = false, length = 1024)
    private String fileUrl;

    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    @Column(name = "content_type", length = 255)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "is_main", nullable = false)
    private Boolean isMain;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Portfolio(
            User user,
            String s3Key,
            String fileUrl,
            String originalFilename,
            String contentType,
            Long fileSize
    ) {
        this.user = user;
        this.s3Key = s3Key;
        this.fileUrl = fileUrl;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.fileSize = fileSize;
        this.isMain = false;
    }

    public void markMain(boolean isMain) {
        this.isMain = isMain;
    }
}
