package com.portmatch.domain.jobposting.dto;

import com.portmatch.domain.jobposting.entity.TechStackEntity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class TechStackDto {
    private Long stackId;      // DB의 stack_id와 매핑
    private String stackName;  // DB의 stack_name과 매핑

    /**
     * Entity에서 DTO로 변환하는 메서드
     */
    public static TechStackDto fromEntity(TechStackEntity stack) {
        return TechStackDto.builder()
                .stackId(stack.getId())    // 모델의 sid -> DTO의 stackId
                .stackName(stack.getStackName()) // 모델의 tname -> DTO의 stackName
                .build();
    }
}