package com.portmatch.domain.jobposting.entity;

import jakarta.persistence.*;
import lombok.*;

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

    private String cid; // 기업 ID

    @Column(columnDefinition = "TEXT") // HTML 상세 내용이 길기 때문에 TEXT 타입 필수!
    private String detail;

    private int jobType;
}