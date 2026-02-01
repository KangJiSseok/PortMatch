package com.portmatch.domain.scrap.dto;

import com.portmatch.domain.scrap.entity.CompanyScrapEntity;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class CompanyScrapDto {
    private Long id;
    private Long uid;               // 사용자 ID
    private String cid;               // 기업 ID (Company ID)
    private LocalDateTime createdAt;

    /**
     * Entity -> DTO 변환
     */
    public static CompanyScrapDto fromEntity(CompanyScrapEntity entity) {
        return CompanyScrapDto.builder()
                .id(entity.getId())
                .uid(entity.getUid())
                .cid(entity.getCid())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}