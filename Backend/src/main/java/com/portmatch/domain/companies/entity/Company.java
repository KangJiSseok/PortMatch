package com.portmatch.domain.companies.entity;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // companies.user_id -> users.id (FK)
    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_id", unique = true, nullable = true)
    private User user;

    @Column(name = "companies_name", nullable = false, unique = true, length = 500)
    private String companiesName;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 500)
    private String size;

    @Column(name = "homepage_url", columnDefinition = "TEXT")
    private String homepageUrl;

    @Column(unique = true, name = "cid")
    private String cid;

    @Column(length = 100)
    private String totPsncnt;

    @Column(length = 100)
    private String yrSalesAmt;

    @Column(name = "busi_cont", columnDefinition = "TEXT")
    private String busiCont;

    @Column(columnDefinition = "TEXT")
    private String logo;

    public Company(
            User user,
            String companiesName,
            String address,
            String size,
            String homepageUrl
    ) {
        this.user = user;
        this.companiesName = companiesName;
        this.address = address;
        this.size = size;
        this.homepageUrl = homepageUrl;
    }

    public Company(
            String cid,
            String companiesName,
            String address,
            String size,
            String homepageUrl,
            String totPsncnt,
            String yrSalesAmt,
            String busiCont,
            String logo
    ) {
        this.cid = cid;
        this.companiesName = companiesName;
        this.address = address;
        this.size = size;
        this.homepageUrl = homepageUrl;
        this.totPsncnt = totPsncnt;
        this.yrSalesAmt = yrSalesAmt;
        this.busiCont = busiCont;
        this.logo = logo;
    }

    public void updateJobCompany(
            String companiesName,
            String address,
            String size,
            String homepageUrl,
            String totPsncnt,
            String yrSalesAmt,
            String busiCont,
            String logo
    ) {
        this.companiesName = companiesName;
        this.address = address;
        this.size = size;
        this.homepageUrl = homepageUrl;
        this.totPsncnt = totPsncnt;
        this.yrSalesAmt = yrSalesAmt;
        this.busiCont = busiCont;
        this.logo = logo;
    }

    public void assignUser(User user) {
        if (this.user != null) {
            throw new BusinessException(ResponseCode.COMPANY_ALREADY_ASSIGNED);
        }
        this.user = user;
    }

    public void assignCid(String cid) {
        if (this.cid == null || this.cid.isBlank()) {
            this.cid = cid;
        }
    }
}
