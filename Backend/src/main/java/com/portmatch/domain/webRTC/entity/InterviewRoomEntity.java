package com.portmatch.domain.webRTC.entity;

import com.portmatch.domain.interviewschedule.entity.InterviewScheduleEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "interview_rooms",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_interview_rooms_schedule",
                columnNames = "schedule_id"
        )
)
@Getter @Setter
@NoArgsConstructor
public class InterviewRoomEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String roomId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "schedule_id", nullable = false)
    private InterviewScheduleEntity schedule;

    private String interviewerPeerId;
    private String applicantPeerId;

    @Enumerated(EnumType.STRING)
    private RoomStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public InterviewRoomEntity(String roomId, InterviewScheduleEntity schedule) {
        this.roomId = roomId;
        this.schedule = schedule;
        this.status = RoomStatus.WAITING;
    }
}
