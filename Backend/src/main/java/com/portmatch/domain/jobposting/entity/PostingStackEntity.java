package com.portmatch.domain.jobposting.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "posting_stacks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PostingStackEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 공고에 속한 스택인지?
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id")
    private JobPostingEntity jobPosting;

    // 어떤 기술 스택인지? (Java, Spring 등)
    // TechStackEntity가 이미 있다고 가정하거나 곧 만들 예정이야!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stack_id")
    private TechStackEntity techStack;
}