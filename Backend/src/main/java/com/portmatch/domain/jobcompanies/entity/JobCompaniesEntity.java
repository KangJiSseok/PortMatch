package com.portmatch.domain.jobcompanies.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "job_companies")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobCompaniesEntity {
    @Id
    private String cid;        // 기업 ID
    private String corpName;     // 기업명
    private String totPsncnt;  // 사원수
    private String busiSize;   // 규모
    private String yrSalesAmt; // 매출액
    private String corpAddr;   // 주소
    private String homePg;     // 홈페이지
    private String busiCont;   // 사업내용
    private String logo;       // 로고 URL
}