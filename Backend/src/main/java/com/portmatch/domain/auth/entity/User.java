package com.portmatch.domain.auth.entity;

import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.scrap.entity.CompanyScrapEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.io.*;

@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
@Entity
@Table(name = "users")
public class User implements Serializable {
    @Serial private static final long serialVersionUID = 1L;

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

    private void writeObject(ObjectOutputStream out) throws IOException {
        out.writeObject(id); out.writeObject(username); out.writeObject(password); out.writeObject(name);
        out.writeObject(phone); out.writeObject(email); out.writeObject(role); out.writeObject(createdAt);
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        id = (Long) in.readObject(); username = (String) in.readObject(); password = (String) in.readObject();
        name = (String) in.readObject(); phone = (String) in.readObject(); email = (String) in.readObject();
        role = (Role) in.readObject(); createdAt = (LocalDateTime) in.readObject(); companyScraps = new ArrayList<>();
    }
}
