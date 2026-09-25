package com.portmatch.domain.chat;

import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.global.api.BaseApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static com.portmatch.domain.chat.ChatDtos.*;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {
    private final ChatService service;

    @PostMapping("/rooms")
    BaseApiResponse<RoomResponse> createRoom(@AuthenticationPrincipal UserPrincipal principal,
                                             @Valid @RequestBody CreateRoomRequest request) {
        return BaseApiResponse.ok(service.createOrGetRoom(principal.getUser().getId(), request.targetUserId()));
    }

    @GetMapping("/rooms")
    BaseApiResponse<List<RoomResponse>> rooms(@AuthenticationPrincipal UserPrincipal principal) {
        return BaseApiResponse.ok(service.rooms(principal.getUser().getId()));
    }

    @GetMapping("/rooms/{roomId}/messages")
    BaseApiResponse<List<MessageResponse>> messages(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable UUID roomId,
                                                     @RequestParam(defaultValue = "0") long afterSequence,
                                                     @RequestParam(defaultValue = "100") int limit) {
        return BaseApiResponse.ok(service.messages(principal.getUser().getId(), roomId, afterSequence, limit));
    }

    @PostMapping("/rooms/{roomId}/messages")
    BaseApiResponse<MessageResponse> send(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable UUID roomId,
                                          @Valid @RequestBody SendMessageRequest request) {
        return BaseApiResponse.ok(service.send(principal.getUser().getId(), roomId, request));
    }

    @PatchMapping("/rooms/{roomId}/read")
    BaseApiResponse<Void> read(@AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID roomId,
                               @RequestBody ReadRequest request) {
        service.read(principal.getUser().getId(), roomId, request.roomSequence());
        return BaseApiResponse.ok(null);
    }
}
