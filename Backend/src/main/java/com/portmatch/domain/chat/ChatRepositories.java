package com.portmatch.domain.chat;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

interface ChatRoomRepository extends JpaRepository<ChatRoom, UUID> {
    Optional<ChatRoom> findByCompanyUserIdAndApplicantUserId(Long companyUserId, Long applicantUserId);
    Optional<ChatRoom> findBySystemRecipientId(Long systemRecipientId);

    @Query("select r from ChatRoom r where r.companyUserId=:userId or r.applicantUserId=:userId or r.systemRecipientId=:userId order by r.lastMessageAt desc nulls last, r.createdAt desc")
    List<ChatRoom> findAllForUser(@Param("userId") long userId);
}

interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    Optional<ChatMessage> findBySenderIdAndClientMessageId(Long senderId, UUID clientMessageId);
    List<ChatMessage> findByRoomIdAndRoomSequenceGreaterThanOrderByRoomSequence(UUID roomId, long after, Pageable pageable);
    long countByRoomIdAndRoomSequenceGreaterThan(UUID roomId, long sequence);
}

interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, ChatRoomMember.Key> {}
interface ChatOutboxRepository extends JpaRepository<ChatOutbox, UUID> {}
interface ChatConsumedEventRepository extends JpaRepository<ChatConsumedEvent, UUID> {}
