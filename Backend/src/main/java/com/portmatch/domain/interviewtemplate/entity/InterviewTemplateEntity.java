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
        name = "interview_templates",
        indexes = {
                @Index(name = "idx_interview_templates_user_id", columnList = "user_id")
        }
)
public class InterviewTemplateEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "target_role", nullable = false, length = 100)
    private String targetRole;

    @OneToMany(mappedBy = "template", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<InterviewTopicEntity> topics = new ArrayList<>();

    public static InterviewTemplateEntity create(Long userId, String title, String targetRole) {
        InterviewTemplateEntity entity = new InterviewTemplateEntity();
        entity.userId = userId;
        entity.title = title;
        entity.targetRole = targetRole;
        return entity;
    }

    public void update(String title, String targetRole) {
        this.title = title;
        this.targetRole = targetRole;
    }

    public void addTopic(InterviewTopicEntity topic) {
        this.topics.add(topic);
    }
}
