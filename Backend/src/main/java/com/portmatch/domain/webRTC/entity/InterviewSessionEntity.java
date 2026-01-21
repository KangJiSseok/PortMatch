package com.portmatch.domain.webRTC.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
public class InterviewSessionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String sessionId; // OpenVidu에서 발급받은 ID

    private String title; // 면접 방 제목

    @Enumerated(EnumType.STRING)
    private SessionStatus status; // OPEN, FINISHED 등

    private LocalDateTime createdAt;

    public InterviewSessionEntity(String sessionId, String title) {
        this.sessionId = sessionId;
        this.title = title;
        this.status = SessionStatus.OPEN;
        this.createdAt = LocalDateTime.now();
    }

    public void finish() {
        this.status = SessionStatus.FINISHED;
    }
}

enum SessionStatus {
    OPEN, FINISHED
}

