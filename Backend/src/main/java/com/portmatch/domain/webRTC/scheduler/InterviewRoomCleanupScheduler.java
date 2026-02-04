package com.portmatch.domain.webRTC.scheduler;

import com.portmatch.domain.webRTC.service.InterviewRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InterviewRoomCleanupScheduler {

    private final InterviewRoomService service;

    // ✅ [추가] 1분마다 실행: 시작 10분 전 방 자동 오픈
    @Scheduled(fixedRate = 600000)
    public void scheduleOpen() {
        service.openScheduledRooms();
    }

    // 기존: 2시간마다 실행 (오래된 방 삭제)
    @Scheduled(fixedRate = 7200000)
    public void autoCleanup() {
        System.out.println("🧹 만료된 인터뷰 방 정리 시작...");
        service.cleanupOldRooms();
    }
}
