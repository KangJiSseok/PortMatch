package com.portmatch.domain.chat;

import com.portmatch.domain.auth.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.UUID;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
class ChatWebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final ChatService chatService;
    @Value("${chat.broker-relay.host}") private String relayHost;
    @Value("${chat.broker-relay.port}") private int relayPort;
    @Value("${chat.broker-relay.login}") private String relayLogin;
    @Value("${chat.broker-relay.passcode}") private String relayPasscode;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("http://localhost:*", "https://localhost:*", "https://i14d205.p.ssafy.io");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableStompBrokerRelay("/topic")
                .setRelayHost(relayHost).setRelayPort(relayPort)
                .setClientLogin(relayLogin).setClientPasscode(relayPasscode)
                .setSystemLogin(relayLogin).setSystemPasscode(relayPasscode);
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
                if (accessor.getCommand() == StompCommand.CONNECT && accessor.getUser() == null)
                    throw new IllegalArgumentException("authentication required");
                if (accessor.getCommand() == StompCommand.SEND)
                    throw new IllegalArgumentException("STOMP SEND is disabled; use REST");
                if (accessor.getCommand() == StompCommand.SUBSCRIBE) authorize(accessor);
                return message;
            }
        });
    }

    private void authorize(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        String prefix = "/topic/chat.rooms.";
        if (destination == null || !destination.startsWith(prefix)) throw new IllegalArgumentException("invalid destination");
        long userId = userId(accessor);
        UUID roomId;
        try { roomId = UUID.fromString(destination.substring(prefix.length())); }
        catch (IllegalArgumentException invalid) { throw new IllegalArgumentException("invalid room destination"); }
        if (!chatService.canAccess(userId, roomId)) throw new IllegalArgumentException("room access denied");
    }

    private long userId(StompHeaderAccessor accessor) {
        if (accessor.getUser() instanceof AbstractAuthenticationToken auth
                && auth.getPrincipal() instanceof UserPrincipal principal) return principal.getUser().getId();
        throw new IllegalArgumentException("authentication required");
    }
}
