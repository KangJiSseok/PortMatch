package com.portmatch.domain.scrap.entity;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "scraps",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"user_id", "pid"})})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ScrapEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Long uid 대신 객체로!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Long pid 대신 객체로!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pid", nullable = false)
    private JobPostingEntity jobPosting;
}