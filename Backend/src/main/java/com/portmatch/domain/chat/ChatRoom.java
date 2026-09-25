package com.portmatch.domain.chat;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
class ChatRoom {
    @Id private UUID id;
    @Column(name = "room_type", nullable = false) private String roomType;
    @Column(name = "company_user_id") private Long companyUserId;
    @Column(name = "applicant_user_id") private Long applicantUserId;
    @Column(name = "system_recipient_id") private Long systemRecipientId;
    @Column(name = "last_message") private String lastMessage;
    @Column(name = "last_sender_id") private Long lastSenderId;
    @Column(name = "last_message_at") private Instant lastMessageAt;
    @Column(name = "created_at", nullable = false) private Instant createdAt;

    static ChatRoom create(long companyUserId, long applicantUserId) {
        ChatRoom room = new ChatRoom();
        room.id = UUID.randomUUID();
        room.roomType = "DIRECT";
        room.companyUserId = companyUserId;
        room.applicantUserId = applicantUserId;
        room.createdAt = Instant.now();
        return room;
    }

    static ChatRoom system(long recipientId) {
        ChatRoom room = new ChatRoom();
        room.id = UUID.randomUUID();
        room.roomType = "SYSTEM";
        room.systemRecipientId = recipientId;
        room.createdAt = Instant.now();
        return room;
    }

    boolean contains(long userId) {
        return (companyUserId != null && companyUserId == userId)
                || (applicantUserId != null && applicantUserId == userId)
                || (systemRecipientId != null && systemRecipientId == userId);
    }

    long recipientOf(long senderId) {
        if (companyUserId != null && companyUserId == senderId) return applicantUserId;
        if (applicantUserId != null && applicantUserId == senderId) return companyUserId;
        if (senderId == 0 && systemRecipientId != null) return systemRecipientId;
        throw new IllegalArgumentException("not a room member");
    }

    void touch(String content, Long senderId, Instant at) {
        lastMessage = content;
        lastSenderId = senderId;
        lastMessageAt = at;
    }
}
