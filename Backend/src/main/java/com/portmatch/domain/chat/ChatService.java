package com.portmatch.domain.chat;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.enums.Role;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.UUID;

import static com.portmatch.domain.chat.ChatDtos.*;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRoomRepository rooms;
    private final ChatMessageRepository messages;
    private final ChatRoomMemberRepository members;
    private final UserRepository users;
    private final JdbcTemplate jdbc;
    private final ChatEventPublicationStrategy publication;

    @Transactional
    public RoomResponse createOrGetRoom(long requesterId, long targetId) {
        if (requesterId == targetId) throw new BusinessException(ResponseCode.INVALID_PARAMETER);
        User requester = user(requesterId);
        User target = user(targetId);
        if (requester.getRole() == target.getRole()) throw new BusinessException(ResponseCode.ROLE_MISMATCH);

        long companyId = requester.getRole() == Role.COMPANY ? requesterId : targetId;
        long applicantId = requester.getRole() == Role.APPLICANT ? requesterId : targetId;
        ChatRoom room = rooms.findByCompanyUserIdAndApplicantUserId(companyId, applicantId)
                .orElseGet(() -> createRoom(companyId, applicantId));
        return room(room, requesterId);
    }

    private ChatRoom createRoom(long companyId, long applicantId) {
        ChatRoom candidate = ChatRoom.create(companyId, applicantId);
        jdbc.update("insert into chat_room(id,room_type,company_user_id,applicant_user_id,created_at) values (?,'DIRECT',?,?,?) on conflict do nothing",
                candidate.getId(), companyId, applicantId, Timestamp.from(candidate.getCreatedAt()));
        ChatRoom room = rooms.findByCompanyUserIdAndApplicantUserId(companyId, applicantId).orElseThrow();
        initializeRoom(room, companyId, applicantId);
        return room;
    }

    private void initializeRoom(ChatRoom room, long... memberIds) {
        jdbc.update("insert into chat_room_sequence(room_id,next_sequence) values (?,1) on conflict do nothing", room.getId());
        for (long memberId : memberIds) {
            jdbc.update("insert into chat_room_member(room_id,user_id,last_read_sequence) values (?,?,0) on conflict do nothing",
                    room.getId(), memberId);
        }
    }

    @Transactional(readOnly = true)
    public List<RoomResponse> rooms(long userId) {
        return rooms.findAllForUser(userId).stream().map(room -> room(room, userId)).toList();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> messages(long userId, UUID roomId, long afterSequence, int requestedLimit) {
        ChatRoom room = authorizedRoom(roomId, userId);
        int limit = Math.clamp(requestedLimit, 1, 200);
        return messages.findByRoomIdAndRoomSequenceGreaterThanOrderByRoomSequence(
                room.getId(), Math.max(0, afterSequence), PageRequest.of(0, limit)
        ).stream().map(this::message).toList();
    }

    @Transactional
    public MessageResponse send(long senderId, UUID roomId, SendMessageRequest request) {
        ChatRoom room = authorizedRoom(roomId, senderId);
        if (!"DIRECT".equals(room.getRoomType())) throw new BusinessException(ResponseCode.UNAUTHORIZED);
        var existing = messages.findBySenderIdAndClientMessageId(senderId, request.clientMessageId());
        if (existing.isPresent()) {
            if (!existing.get().getRoomId().equals(roomId)) throw new BusinessException(ResponseCode.INVALID_PARAMETER);
            return message(existing.get());
        }

        long sequence = nextSequence(roomId);
        MessageType type = request.messageType() == null ? MessageType.TEXT : request.messageType();
        ChatMessage saved = messages.save(ChatMessage.create(roomId, sequence, senderId,
                request.clientMessageId(), request.content().trim(), type, request.interviewId(),
                request.jobPostingId(), request.jobPostingTitle(), request.testRunId()));
        room.touch(saved.getContent(), senderId, saved.getCreatedAt());
        members.findById(new ChatRoomMember.Key(roomId, senderId)).ifPresent(member -> member.readThrough(sequence));
        publication.publish(ChatMessageCreatedEvent.from(saved, room.recipientOf(senderId)));
        return message(saved);
    }

    @Transactional
    public void read(long userId, UUID roomId, long sequence) {
        authorizedRoom(roomId, userId);
        ChatRoomMember member = members.findById(new ChatRoomMember.Key(roomId, userId))
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        member.readThrough(Math.max(0, sequence));
    }

    @Transactional
    public MessageResponse sendSystem(long recipientId, String content, Long jobPostingId) {
        user(recipientId);
        ChatRoom room = rooms.findBySystemRecipientId(recipientId).orElseGet(() -> {
            ChatRoom candidate = ChatRoom.system(recipientId);
            jdbc.update("insert into chat_room(id,room_type,system_recipient_id,created_at) values (?,'SYSTEM',?,?) on conflict do nothing",
                    candidate.getId(), recipientId, Timestamp.from(candidate.getCreatedAt()));
            ChatRoom created = rooms.findBySystemRecipientId(recipientId).orElseThrow();
            initializeRoom(created, recipientId);
            return created;
        });
        long sequence = nextSequence(room.getId());
        ChatMessage saved = messages.save(ChatMessage.create(room.getId(), sequence, null, UUID.randomUUID(),
                content, MessageType.SYSTEM, null, jobPostingId, null, null));
        room.touch(content, null, saved.getCreatedAt());
        publication.publish(ChatMessageCreatedEvent.from(saved, recipientId));
        return message(saved);
    }

    @Transactional(readOnly = true)
    public boolean canAccess(long userId, UUID roomId) {
        return rooms.findById(roomId).filter(room -> room.contains(userId)).isPresent();
    }

    private long nextSequence(UUID roomId) {
        Long value = jdbc.queryForObject("update chat_room_sequence set next_sequence=next_sequence+1 where room_id=? returning next_sequence-1",
                Long.class, roomId);
        if (value == null) throw new IllegalStateException("room sequence missing");
        return value;
    }

    private ChatRoom authorizedRoom(UUID roomId, long userId) {
        return rooms.findById(roomId).filter(room -> room.contains(userId))
                .orElseThrow(() -> new BusinessException(ResponseCode.UNAUTHORIZED));
    }

    private User user(long id) {
        return users.findById(id).orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));
    }

    private RoomResponse room(ChatRoom room, long viewerId) {
        ChatRoomMember member = members.findById(new ChatRoomMember.Key(room.getId(), viewerId)).orElse(null);
        long read = member == null ? 0 : member.getLastReadSequence();
        long unread = messages.countByRoomIdAndRoomSequenceGreaterThan(room.getId(), read);
        return new RoomResponse(room.getId(), room.getRoomType(), room.getCompanyUserId(), name(room.getCompanyUserId()),
                room.getApplicantUserId(), name(room.getApplicantUserId()), room.getLastMessage(), room.getLastSenderId(),
                room.getLastMessageAt(), unread, read);
    }

    private String name(Long id) {
        return id == null ? "PortMatch 알리미" : users.findById(id).map(User::getName).orElse("Unknown");
    }

    private MessageResponse message(ChatMessage message) {
        return new MessageResponse(message.getId(), message.getRoomId(), message.getRoomSequence(),
                message.getSenderId(), name(message.getSenderId()), message.getContent(),
                message.getMessageType(), message.getCreatedAt(), message.getInterviewId(),
                message.getJobPostingId(), message.getJobPostingTitle(), message.getTestRunId());
    }
}
