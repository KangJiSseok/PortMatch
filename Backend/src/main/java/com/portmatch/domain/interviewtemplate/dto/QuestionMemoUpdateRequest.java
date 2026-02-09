package com.portmatch.domain.interviewtemplate.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class QuestionMemoUpdateRequest {
    // 메모는 빈 값으로 지울 수도 있으니까 @NotBlank 보다는 @NotNull이나 제약조건 없이!
    private String memoContent;
}