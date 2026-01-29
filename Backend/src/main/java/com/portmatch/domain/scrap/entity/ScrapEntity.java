package com.portmatch.domain.scrap.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "scraps",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"uid", "pid"}) // 중복 스크랩 방지
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ScrapEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long uid;

    @Column(nullable = false)
    private Long pid; // Posting ID
}