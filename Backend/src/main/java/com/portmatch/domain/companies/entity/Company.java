package com.portmatch.domain.companies.entity;

import com.portmatch.domain.auth.entity.User;
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
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(name = "companies_name", nullable = false)
    private String companiesName;

    @Column(nullable = false)
    private String address;

    @Column
    private String size;

    @Column(name = "homepage_url")
    private String homepageUrl;

    @Column
    private String cid;

    @Column
    private String totPsncnt;

    @Column
    private String yrSalesAmt;

    @Column
    private String busiCont;

    @Column
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
            throw new IllegalStateException("이미 가입된 기업입니다.");
        }
        this.user = user;
    }
}
