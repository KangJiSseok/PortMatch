package com.portmatch.domain.webRTC.controller;

import com.portmatch.domain.webRTC.dto.ConnectionRequestDto;
import com.portmatch.domain.webRTC.entity.InterviewSessionEntity;
import com.portmatch.domain.webRTC.repository.InterviewSessionRepository;
import io.openvidu.java.client.*;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/interview")
@CrossOrigin(origins = "*") // 테스트를 위해 모든 도메인 허용
public class SessionController {

    private final InterviewSessionRepository interviewRepository;
    private OpenVidu openVidu;
//    private String OPENVIDU_URL = "http://localhost:4443";
//    private String OPENVIDU_SECRET = "MY_SECRET";

    @Value("${openvidu.url}")
    private String OPENVIDU_URL;

    @Value("${openvidu.secret}")
    private String OPENVIDU_SECRET;

    @PostConstruct
    public void init() {
        this.openVidu = new OpenVidu(OPENVIDU_URL, OPENVIDU_SECRET);
    }

    /**
     * 1단계: 세션(방) 생성 + DB 기록
     * @param params 방 설정 정보 (JSON 형태)
     * @return 생성된 세션의 ID
     */
    @PostMapping("/sessions")
    public ResponseEntity<String> initializeSession(@RequestBody(required = false) Map<String, Object> params)
            throws OpenViduJavaClientException, OpenViduHttpException {

        SessionProperties properties = SessionProperties.fromJson(params).build();
        Session session = openVidu.createSession(properties);

        // --- DB 저장 로직 추가 ---
        String title = (params != null && params.containsKey("title")) ? (String) params.get("title") : "새 면접 방";
        InterviewSessionEntity interviewSession = new InterviewSessionEntity(session.getSessionId(), title);
        interviewRepository.save(interviewSession);
        // -----------------------

        return new ResponseEntity<>(session.getSessionId(), HttpStatus.OK);
    }

    /**
     * 2단계: 커넥션(토큰) 생성
     * @param sessionId 입장할 방의 ID
     * @param request 커넥션 설정 정보
     * @return 클라이언트에게 전달할 토큰(입장권)
     */
    @PostMapping("/sessions/{sessionId}/connections")
    public ResponseEntity<String> createConnection(@PathVariable("sessionId") String sessionId,
                                                   @RequestBody ConnectionRequestDto request) {
        try {
            Session session = openVidu.getActiveSession(sessionId);
            if (session == null) return new ResponseEntity<>(HttpStatus.NOT_FOUND);

            OpenViduRole role = "INTERVIEWER".equals(request.role())
                    ? OpenViduRole.MODERATOR
                    : OpenViduRole.PUBLISHER;

            ConnectionProperties properties = new ConnectionProperties.Builder()
                    .role(role)
                    .data("{\"nickname\":\"" + request.nickname() + "\"}")
                    .build();

            Connection connection = session.createConnection(properties);

            String originalToken = connection.getToken();

            // localhost, openvidu-server 등 모든 경우 처리
            String fixedToken = originalToken
                    .replaceAll("ws://[^/]+:\\d+", "wss://i14d205.p.ssafy.io")  // ws://호스트:포트 → wss://도메인
                    .replaceAll("wss://[^/]+:\\d+", "wss://i14d205.p.ssafy.io") // wss://호스트:포트 → wss://도메인
                    .replace("/openvidu", "/openvidu");  // 경로는 유지

            return new ResponseEntity<>(fixedToken, HttpStatus.OK);

        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> closeSession(@PathVariable("sessionId") String sessionId)
            throws OpenViduJavaClientException, OpenViduHttpException {
        Session session = openVidu.getActiveSession(sessionId);
        if (session != null) {
            session.close(); // 방에 있는 모든 유저가 튕겨나가고 세션이 종료됨
            // 여기서 DB의 면접 상태를 '종료'로 바꿔주면 완벽!
            interviewRepository.findBySessionId(sessionId).ifPresent(s -> {
                s.finish();
                interviewRepository.save(s);
            });
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }

    /**
     * OpenVidu 서버에서 날아오는 Webhook 처리
     * 세션이 자동으로 종료(sessionDestroyed)될 때 DB 상태를 업데이트함
     */
    /**
     * OpenVidu Webhook 처리
     * 주의: yml에 적은 주소(http://.../api/webhook)와 일치해야 함!
     */
    @PostMapping(value = "/webhook") // @RequestMapping이 /api/interview 라면 최종 주소는 /api/interview/webhook 이 됨!
    @Transactional
    public ResponseEntity<Void> handleOpenViduWebhook(@RequestBody Map<String, Object> callbackData) {
        String event = (String) callbackData.get("event");

        if ("sessionDestroyed".equals(event)) {
            String sessionId = (String) callbackData.get("sessionId");
            System.out.println("WebHook 수신 - 세션 종료됨: " + sessionId);

            interviewRepository.findBySessionId(sessionId).ifPresent(session -> {
                session.finish();
                interviewRepository.save(session);
            });
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }
}