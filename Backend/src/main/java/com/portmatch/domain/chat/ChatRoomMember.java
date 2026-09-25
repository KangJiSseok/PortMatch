package com.portmatch.domain.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "chat_room_member")
@IdClass(ChatRoomMember.Key.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ChatRoomMember {
    @Id @Column(name = "room_id") private UUID roomId;
    @Id @Column(name = "user_id") private Long userId;
    @Column(name = "last_read_sequence", nullable = false) private long lastReadSequence;

    ChatRoomMember(UUID roomId, long userId) {
        this.roomId = roomId;
        this.userId = userId;
    }

    void readThrough(long sequence) {
        lastReadSequence = Math.max(lastReadSequence, sequence);
    }

    @Getter
    @EqualsAndHashCode
    @NoArgsConstructor
    @AllArgsConstructor
    static class Key implements Serializable {
        private UUID roomId;
        private Long userId;
    }
}
