package com.portmatch.domain.chat;

import com.portmatch.domain.interviewschedule.entity.InterviewScheduleEntity;
import com.portmatch.domain.interviewschedule.enums.InterviewStatus;
import com.portmatch.domain.interviewschedule.repository.InterviewServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
class ChatSystemAlertScheduler {
    private final InterviewServiceRepository interviews;
    private final ChatService chat;
    private final JdbcTemplate jdbc;

    @Scheduled(fixedDelay = 60_000)
    @Transactional
    void notifyUpcomingInterviews() {
        LocalDateTime now = LocalDateTime.now();
        for (InterviewScheduleEntity interview : interviews.findByStatusAndTimeBetween(
                InterviewStatus.CONFIRMED, now.plusMinutes(5), now.plusMinutes(70))) {
            long minutes = Duration.between(now, interview.getTime()).toMinutes();
            String type = minutes >= 50 ? "60_MIN" : minutes <= 15 ? "10_MIN" : null;
            if (type == null || jdbc.update("insert into chat_system_alert(interview_id,alert_type) values (?,?) on conflict do nothing",
                    interview.getId(), type) == 0) continue;
            String text = "[시스템 알림] 면접이 약 " + (type.equals("60_MIN") ? "1시간" : "10분")
                    + " 뒤에 시작됩니다. 일시: " + interview.getTime();
            chat.sendSystem(interview.getUser().getId(), text, interview.getJobPosting().getId());
            var company = interview.getJobPosting().getCompany();
            if (company != null && company.getUser() != null)
                chat.sendSystem(company.getUser().getId(), text, interview.getJobPosting().getId());
        }
    }
}
