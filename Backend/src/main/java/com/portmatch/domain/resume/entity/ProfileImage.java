package com.portmatch.domain.resume.entity;

import com.portmatch.domain.auth.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "profile_images",
        indexes = {
                @Index(name = "idx_profile_images_user_id", columnList = "user_id")
        }
)
public class ProfileImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_profile_images_user")
    )
    private User user;

    @Column(name = "image_url", nullable = false, length = 1024)
    private String imageUrl;

    @Column(name = "image_key", nullable = false, length = 512)
    private String imageKey;

    @Column(name = "image_name", nullable = false, length = 255)
    private String imageName;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public ProfileImage(User user, String imageUrl, String imageKey, String imageName) {
        this.user = user;
        this.imageUrl = imageUrl;
        this.imageKey = imageKey;
        this.imageName = imageName;
    }
}
