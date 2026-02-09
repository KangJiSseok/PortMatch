package com.portmatch.domain.jobposting.dto;

import com.portmatch.domain.companies.dto.CompaniesDto;
import lombok.*;

import java.io.Serializable;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobPostingDto implements Serializable {
    private Long id; //공고 ID
    private String title; //공고 제목
    private int active; // 공고 상태(활성: 1, 비활성: 0)
    private String startDate; // 공고 시작일
    private String endDate; // 공고 마감일
    private int vcnt; // 조회수
    private String cid; // 회사 ID
    private String detail; // 공고 상세 내용/설명
    private int jobType; // 채용 형태 코드
    private CompaniesDto company; //기업 정보
    private List<Long> stackIds; // 등록할 때 사용할 스택 ID 리스트
}
