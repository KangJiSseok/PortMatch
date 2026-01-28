package com.portmatch.domain.jobposting.entity;

import com.portmatch.domain.companies.entity.Company;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_postings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class JobPostingEntity {

    @Id // 공고 ID (wid)
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    private int active;

    private String startDate;

    private String endDate;

    private int vcnt; // 조회수

    // 1. 단순 String cid 대신, 기업 엔티티와 'N:1' 관계를 맺어줘!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "cid",                       // job_postings 테이블에 생성될 FK 컬럼명
            referencedColumnName = "cid",        // Company 엔티티(companies 테이블)의 cid 컬럼을 참조
            foreignKey = @ForeignKey(name = "fk_job_posting_company") // 제약조건 이름 강제 지정
    )
    private Company company;

    @Column(columnDefinition = "TEXT")
    private String detail;

    private int jobType;

    // 2. [선택사항] 기술 스택과의 관계 (중간 테이블 방식)
    // 한 공고에 여러 스택이 매핑되는 posting_stack 테이블을 바라보게 돼.
    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL)
    @Builder.Default
    private List<PostingStackEntity> techStacks = new ArrayList<>();
}