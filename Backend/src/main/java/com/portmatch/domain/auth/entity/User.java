package com.portmatch.domain.auth.entity;

import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.scrap.entity.CompanyScrapEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username; // ERD: users.username (NN)

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String name; // ERD: users.name (NN)

    @Column(nullable = false, length = 20)
    private String phone; // ERD: users.phone (NN)

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public User(String username, String password, String name, String phone, String email, Role role) {
        this.username = username;
        this.password = password;
        this.name = name;
        this.phone = phone;
        this.email = email;
        this.role = role;
    }

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CompanyScrapEntity> companyScraps = new ArrayList<>();
}
