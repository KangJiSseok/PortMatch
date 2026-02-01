package com.portmatch.domain.scrap.entity;

import com.portmatch.global.common.entity.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "company_scraps", // 테이블명 분리
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"uid", "cid"}) // 한 사용자가 한 기업을 중복 스크랩 방지
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CompanyScrapEntity extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long uid; // User ID

    @Column(nullable = false)
    private String cid; // Company ID (기업 ID)
}