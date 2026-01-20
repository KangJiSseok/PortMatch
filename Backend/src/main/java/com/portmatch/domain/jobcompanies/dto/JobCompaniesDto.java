package com.portmatch.domain.jobcompanies.dto;

import lombok.*;

import java.io.Serializable;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class JobCompaniesDto implements Serializable {
    private String cid; //기업 ID
    private String corpName; //기업 이름
    private String totPsncnt;  // 전체 사원수
    private String busiSize;   // 기업 규모 (중소/중견/대기업 등)
    private String yrSalesAmt; // 연매출액
    private String corpAddr;   // 기업 주소
    private String homePg;     // 홈페이지 주소
    private String busiCont;   // 사업 내용
    private String logo;       // 로고 URL
}
