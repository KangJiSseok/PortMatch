package com.portmatch.domain.interviewtemplate.entity;

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
        name = "interview_template_topics",
        indexes = {
                @Index(name = "idx_interview_template_topics_template_id", columnList = "template_id"),
                @Index(name = "idx_interview_template_topics_order", columnList = "template_id, order_index")
        }
)
public class InterviewTopicEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "template_id",
            nullable = false,
            foreignKey = @ForeignKey(name = "fk_interview_template_topics_template")
    )
    private InterviewTemplateEntity template;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InterviewQuestionEntity> questions = new ArrayList<>();

    public static InterviewTopicEntity create(InterviewTemplateEntity template, String name, Integer orderIndex) {
        InterviewTopicEntity entity = new InterviewTopicEntity();
        entity.template = template;
        entity.name = name;
        entity.orderIndex = orderIndex;
        return entity;
    }

    public void update(String name, Integer orderIndex) {
        this.name = name;
        if (orderIndex != null) {
            this.orderIndex = orderIndex;
        }
    }

    public void addQuestion(InterviewQuestionEntity question) {
        this.questions.add(question);
    }
}
