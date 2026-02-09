package com.portmatch.domain.interviewtemplate.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(
        name = "interview_template_questions",
        indexes = {
                @Index(name = "idx_interview_template_questions_topic_id", columnList = "topic_id"),
                @Index(name = "idx_interview_template_questions_order", columnList = "topic_id, order_index")
        }
)
public class InterviewQuestionEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "topic_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_interview_template_questions_topic")
    )
    private InterviewTopicEntity topic;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "memo_content", columnDefinition = "TEXT") // 메모 필드 추가
    private String memoContent;

    public static InterviewQuestionEntity create(InterviewTopicEntity topic, String content, Integer orderIndex) {
        InterviewQuestionEntity entity = new InterviewQuestionEntity();
        entity.topic = topic;
        entity.content = content;
        entity.orderIndex = orderIndex;
        entity.memoContent = "";
        return entity;
    }

    public void update(String content, Integer orderIndex) {
        this.content = content;
        if (orderIndex != null) {
            this.orderIndex = orderIndex;
        }
    }

    public void updateMemo(String memoContent) {
        this.memoContent = memoContent;
    }
}
