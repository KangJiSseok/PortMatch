package com.portmatch.domain.companies.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class CompanyNameResponse {
    private String cid; //기업 ID
    private String corpName; //기업 이름
    private String totPsncnt;  // 전체 사원수
    private String busiSize;   // 기업 규모 (중소/중견/대기업 등)
    private String corpAddr;   // 기업 주소
    private String homePg;     // 홈페이지 주소
    private String logo;       //
    private List<JobSummary> recentJob;

    @Getter
    @Builder
    public static class JobSummary {
        private Long id;       // 공고 ID
        private String title;  // 공고 제목
    }
}
