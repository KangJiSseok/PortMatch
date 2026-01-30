package com.portmatch.domain.resume.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "resume_self_introductions",
        indexes = {
                @Index(name = "idx_resume_self_introductions_resume_id", columnList = "resume_id"),
                @Index(name = "idx_resume_self_introductions_order", columnList = "resume_id, order_index")
        }
)
public class SelfIntroduction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "resume_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_resume_self_introductions_resume")
    )
    private Resume resume;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "answer_text", nullable = false, columnDefinition = "TEXT")
    private String answerText;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    public static SelfIntroduction create(Resume resume, String title, String answerText, Integer orderIndex) {
        SelfIntroduction entity = new SelfIntroduction();
        entity.resume = resume;
        entity.title = title;
        entity.answerText = answerText;
        entity.orderIndex = orderIndex;
        return entity;
    }

    public void update(String title, String answerText, Integer orderIndex) {
        this.title = title;
        this.answerText = answerText;
        if (orderIndex != null) {
            this.orderIndex = orderIndex;
        }
    }
}
