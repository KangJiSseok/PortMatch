package com.portmatch.domain.jobapplication.snapshot;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.portmatch.domain.resume.enums.EmploymentStatus;
import com.portmatch.domain.resume.enums.EducationDegree;
import com.portmatch.domain.resume.enums.EducationStatus;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResumeSnapshotPayload {
    private Long id;
    private Long userId;
    private String title;
    private Boolean isMain;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ProfileSnapshot profile;
    private PortfolioSnapshot portfolio;
    private List<CareerSnapshot> careers;
    private List<EducationSnapshot> educations;
    private List<SelfIntroductionSnapshot> selfIntroductions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProfileSnapshot {
        private Long id;
        private Long resumeId;
        private String name;
        private String contact;
        private String email;
        private String address;
        private Long profileImageId;
        private String profileImageKey;
        private String profileImageName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortfolioSnapshot {
        private Long portfolioId;
        private Long resumeId;
        private String fileUrl;
        private String originalFilename;
        private String contentType;
        private Long fileSize;
        private LocalDateTime createdAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CareerSnapshot {
        private Long id;
        private Long resumeId;
        private String company;
        private String role;
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private EmploymentStatus employmentStatus;
        private String description;
        private Integer orderIndex;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationSnapshot {
        private Long id;
        private Long resumeId;
        private String school;
        private String major;
        private EducationDegree degree;
        private LocalDate periodStart;
        private LocalDate periodEnd;
        private EducationStatus status;
        private Integer orderIndex;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SelfIntroductionSnapshot {
        private Long id;
        private Long resumeId;
        private String title;
        private String answerText;
        private Integer orderIndex;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }
}
