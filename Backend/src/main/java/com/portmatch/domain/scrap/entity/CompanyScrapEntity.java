package com.portmatch.domain.scrap.entity;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.companies.entity.Company;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user; // User ID

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_cid", referencedColumnName = "cid", nullable = false)
    private Company company; // Company ID (기업 ID)
}