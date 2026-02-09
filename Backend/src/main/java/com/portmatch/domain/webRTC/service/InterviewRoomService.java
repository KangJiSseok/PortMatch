package com.portmatch.domain.webRTC.service;

import com.portmatch.domain.interviewschedule.entity.InterviewScheduleEntity;
import com.portmatch.domain.interviewschedule.enums.InterviewStatus;
import com.portmatch.domain.interviewschedule.repository.InterviewServiceRepository;
import com.portmatch.domain.webRTC.entity.InterviewRoomEntity;
import com.portmatch.domain.webRTC.entity.RoomStatus;
import com.portmatch.domain.webRTC.repository.InterviewRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class InterviewRoomService {

    private final InterviewRoomRepository repository;
    private final InterviewServiceRepository interviewScheduleRepository;

    // 0. 일정 기준 방 생성 (1일정=1방)
    public String createRoom(Long scheduleId) {
        InterviewScheduleEntity schedule = interviewScheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + scheduleId));

        if (schedule.getStatus() == InterviewStatus.CANCELED
                || schedule.getStatus() == InterviewStatus.COMPLETED) {
            throw new IllegalStateException("Schedule is not active: " + schedule.getStatus());
        }

        return repository.findByScheduleId(scheduleId)
                .map(InterviewRoomEntity::getRoomId)
                .orElseGet(() -> {
                    String roomId = UUID.randomUUID().toString();
                    InterviewRoomEntity room = new InterviewRoomEntity(roomId, schedule);
                    
                    // [수정] 생성 시점이 이미 시작 10분 전 이내라면 OPEN 상태로 시작
                    if (schedule.getTime().isBefore(LocalDateTime.now().plusMinutes(10))) {
                        room.setStatus(RoomStatus.OPEN);
                    }
                    
                    repository.save(room);
                    return roomId;
                });
    }

    // 1. Peer 등록 (입장)
    public void registerPeer(String roomId, String role, String peerId) {
        InterviewRoomEntity room = repository.findByRoomId(roomId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomId));

        if ("INTERVIEWER".equalsIgnoreCase(role)) {
            room.setInterviewerPeerId(peerId);
        } else if ("APPLICANT".equalsIgnoreCase(role)) {
            room.setApplicantPeerId(peerId);
        }

        if (room.getInterviewerPeerId() != null && room.getApplicantPeerId() != null) {
            room.setStatus(RoomStatus.OPEN);
        }

        repository.save(room);
    }

    // 2. 상대방 Peer ID 조회
    @Transactional(readOnly = true)
    public String getPartnerPeerId(String roomId, String myRole) {
        InterviewRoomEntity room = repository.findByRoomId(roomId).orElse(null);
        if (room == null) return null;

        if ("INTERVIEWER".equalsIgnoreCase(myRole)) {
            return room.getApplicantPeerId();
        }
        return room.getInterviewerPeerId();
    }

    // 3. 방 상태 조회
    @Transactional(readOnly = true)
    public String getRoomStatus(String roomId) {
        return repository.findByRoomId(roomId)
                .map(room -> room.getStatus().name())
                .orElse(RoomStatus.CLOSED.name());
    }

    // 4. 일정 시작 10분 전 방 자동 오픈
    public void openScheduledRooms() {
        LocalDateTime threshold = LocalDateTime.now().plusMinutes(10);

        List<InterviewRoomEntity> targetRooms =
                repository.findByStatusAndSchedule_TimeBefore(RoomStatus.WAITING, threshold);

        for (InterviewRoomEntity room : targetRooms) {
            room.setStatus(RoomStatus.OPEN);
            System.out.println("면접�??�동 ?�픈: " + room.getRoomId());
        }

        repository.saveAll(targetRooms);
    }


    // 6. 수동 방 종료
    public void closeRoom(String roomId) {
        repository.findByRoomId(roomId).ifPresent(repository::delete);
    }
}
