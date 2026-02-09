package com.portmatch.domain.jobposting.dto;

import com.portmatch.domain.jobposting.entity.PostingStackEntity;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostingStackDto {
    private Long jobPostingId; // 연결된 공고 ID (FK)
    private Long stackId;     // 기술 스택 ID (FK)
    private String stackName;    // 화면에 보여주기 위한 스택 이름 (예: Java)

    /**
     * Entity -> DTO 변환
     */
    public static PostingStackDto fromEntity(PostingStackEntity entity) {
        return PostingStackDto.builder()
                .jobPostingId(entity.getJobPosting().getId()) // JobPostingEntity의 id
                .stackId(entity.getTechStack().getId())  // TechStackEntity의 id
                .stackName(entity.getTechStack().getStackName()) // TechStackEntity의 이름
                .build();
    }
}