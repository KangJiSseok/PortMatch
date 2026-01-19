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
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "business_registration_number", nullable = false)
    private String businessRegistrationNumber;

    @Column(name = "companies_name", nullable = false)
    private String companiesName;

    @Column(nullable = false)
    private String address;

    @Column
    private String size;

    @Column(name = "homepage_url")
    private String homepageUrl;

    public Company(
            User user,
            String businessRegistrationNumber,
            String companiesName,
            String address,
            String size,
            String homepageUrl
    ) {
        this.user = user;
        this.businessRegistrationNumber = businessRegistrationNumber;
        this.companiesName = companiesName;
        this.address = address;
        this.size = size;
        this.homepageUrl = homepageUrl;
    }
}