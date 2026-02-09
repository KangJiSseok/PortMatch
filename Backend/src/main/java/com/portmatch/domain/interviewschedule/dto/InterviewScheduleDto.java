package com.portmatch.domain.interviewschedule.dto;

import com.portmatch.domain.auth.dto.response.MeResponse;
import com.portmatch.domain.interviewschedule.enums.InterviewStatus;
import com.portmatch.domain.jobposting.dto.JobPostingDto;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewScheduleDto {
    private Long id;
    private LocalDateTime time;
    private InterviewStatus status;

    // 💡 [추가] 등록(POST) 요청 시 ID를 받기 위한 필드
    private Long userId;
    private Long jobPostingId;

    // 조회(GET) 응답 시 데이터를 담아줄 객체 필드
    private JobPostingDto jobPosting;
    private MeResponse user;
}
