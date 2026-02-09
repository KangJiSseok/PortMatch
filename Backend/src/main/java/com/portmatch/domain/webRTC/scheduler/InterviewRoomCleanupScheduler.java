package com.portmatch.domain.webRTC.scheduler;

import com.portmatch.domain.webRTC.service.InterviewRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InterviewRoomCleanupScheduler {

    private final InterviewRoomService service;

    @Scheduled(fixedRate = 600000)
    public void scheduleOpen() {
        service.openScheduledRooms();
    }

}
