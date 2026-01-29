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
            if (session == null) {
                return new ResponseEntity<>(HttpStatus.NOT_FOUND);
            }

            OpenViduRole role = "INTERVIEWER".equals(request.role())
                    ? OpenViduRole.MODERATOR
                    : OpenViduRole.PUBLISHER;

            ConnectionProperties properties = new ConnectionProperties.Builder()
                    .role(role)
                    .data("{\"nickname\":\"" + request.nickname() + "\"}")
                    .build();

            Connection connection = session.createConnection(properties);
            String originalToken = connection.getToken();
            // 원래 값 예시: ws://localhost:4443?sessionId=...&token=tok_XXXX

            // 1. OpenVidu가 준 주소에서 도메인/포트 부분만 내 서버 주소로 갈아끼우기
            // originalToken: ws://localhost:4443/openvidu?sessionId=...&token=...
            String fixedToken = originalToken
                    .replace("ws://", "wss://")
                    .replace("localhost:4443", "i14d205.p.ssafy.io") // 혹은 도메인 변수 사용
                    .replace(":5443", "");

            System.out.println("최종 전달 토큰: " + fixedToken);

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

    @PostMapping(value = "/webhook")
    @Transactional
    public ResponseEntity<Void> handleOpenViduWebhook(@RequestBody Map<String, Object> callbackData) {
        // 전체 Webhook 데이터 로깅
        System.out.println("=== OpenVidu Webhook 수신 ===");
        System.out.println("전체 데이터: " + callbackData);

        String event = (String) callbackData.get("event");
        System.out.println("이벤트 타입: " + event);

        if ("sessionDestroyed".equals(event)) {
            String sessionId = (String) callbackData.get("sessionId");
            System.out.println("세션 종료 감지 - sessionId: " + sessionId);

            interviewRepository.findBySessionId(sessionId).ifPresentOrElse(
                    session -> {
                        System.out.println("DB에서 세션 찾음: " + sessionId);
                        session.finish();
                        interviewRepository.save(session);
                        System.out.println("세션 상태 업데이트 완료: " + sessionId);
                    },
                    () -> System.out.println("DB에서 세션을 찾을 수 없음: " + sessionId)
            );
        } else {
            System.out.println("무시된 이벤트: " + event);
        }

        return new ResponseEntity<>(HttpStatus.OK);
    }
}