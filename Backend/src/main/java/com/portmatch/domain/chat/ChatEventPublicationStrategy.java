package com.portmatch.domain.chat;

interface ChatEventPublicationStrategy {
    void publish(ChatMessageCreatedEvent event);
}
