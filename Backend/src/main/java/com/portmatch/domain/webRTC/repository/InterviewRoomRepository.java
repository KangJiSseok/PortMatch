package com.portmatch.domain.webRTC.repository;

import com.portmatch.domain.webRTC.entity.InterviewRoomEntity;
import com.portmatch.domain.webRTC.entity.RoomStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InterviewRoomRepository extends JpaRepository<InterviewRoomEntity, Long> {

    Optional<InterviewRoomEntity> findByRoomId(String roomId);

    Optional<InterviewRoomEntity> findByScheduleId(Long scheduleId);

    @Transactional
    @Modifying
    void deleteByUpdatedAtBefore(LocalDateTime cutoffTime);

    // ✅ [추가] WAITING 이면서 시작 시간이 특정 시간 이전인 방 조회
    List<InterviewRoomEntity> findByStatusAndSchedule_TimeBefore(RoomStatus status, LocalDateTime time);
}
