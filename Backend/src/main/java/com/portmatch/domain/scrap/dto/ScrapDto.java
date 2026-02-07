package com.portmatch.domain.scrap.dto;

import com.portmatch.domain.scrap.entity.ScrapEntity;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ScrapDto {
    private Long id;
    private Long uid;               // 사용자 ID
    private Long pid;             // 공고 ID (사람인/외부 API ID)
    private LocalDateTime createdAt; // BaseTimeEntity에서 물려받은 생성 시간

    /**
     * Entity에서 DTO로 변환하는 메서드
     * BaseTimeEntity의 시간 필드까지 꼼꼼하게 옮겨 담아!
     */
    public static ScrapDto fromEntity(ScrapEntity scrap) {
        return ScrapDto.builder()
                .id(scrap.getId())
                .uid(scrap.getUser() != null ? scrap.getUser().getId() : null)
                .pid(scrap.getJobPosting() != null ? scrap.getJobPosting().getId() : null)
                .createdAt(scrap.getCreatedAt()) // 부모 클래스인 BaseTimeEntity의 필드
                .build();
    }
}