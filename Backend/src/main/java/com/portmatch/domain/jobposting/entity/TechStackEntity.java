package com.portmatch.domain.jobposting.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tech_stacks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class TechStackEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String stackName; // "Java", "Python", "React" 등
}