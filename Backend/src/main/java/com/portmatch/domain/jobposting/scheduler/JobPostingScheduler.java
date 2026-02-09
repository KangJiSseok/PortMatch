package com.portmatch.domain.jobposting.scheduler;

import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobPostingScheduler {

    private final JobPostingRepository jobPostingRepository;

    @Transactional
    @Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")
    public void autoUpdateJobStatus() {
        log.info("채용 공고 상태 업데이트 스케줄러 시작");

        String todayStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));

        try {
            jobPostingRepository.updateExpiredJobs(todayStr);
            log.info("오늘 날짜({}) 기준 마감 처리 완료", todayStr);
        } catch (Exception e) {
            log.error("스케줄러 실행 중 오류 발생: {}", e.getMessage());
        }

        log.info("채용 공고 상태 업데이트 스케줄러 완료");
    }
}