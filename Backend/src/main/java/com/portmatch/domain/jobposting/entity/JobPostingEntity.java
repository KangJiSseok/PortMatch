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

    @Id // 사람인 공고 ID (wid)
    private String id;

    private String title;

    private int active;

    private String startDate;

    private String endDate;

    private int vcnt; // 조회수

    // 1. 단순 String cid 대신, 기업 엔티티와 'N:1' 관계를 맺어줘!
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cid") // DB에는 여전히 cid라는 컬럼명으로 저장돼
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