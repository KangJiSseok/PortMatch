package com.portmatch.domain.interviewtemplate.controller;

import com.portmatch.domain.interviewtemplate.dto.*;
import com.portmatch.domain.interviewtemplate.service.InterviewTemplateService;
import com.portmatch.domain.auth.security.UserPrincipal;
import com.portmatch.global.api.BaseApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "인터뷰 템플릿", description = "인터뷰 질문 템플릿 관리 API")
@RestController
@RequestMapping("/api/interview-templates")
@RequiredArgsConstructor
public class InterviewTemplateController {

    private final InterviewTemplateService interviewTemplateService;

    @Operation(summary = "템플릿 생성", description = "사용자가 인터뷰 질문 템플릿을 생성합니다.")
    @PostMapping
    public BaseApiResponse<TemplateResponse> createTemplate(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody TemplateCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.createTemplate(userId, request));
    }

    @Operation(summary = "템플릿 목록 조회", description = "사용자가 생성한 템플릿 목록을 조회합니다.")
    @GetMapping
    public BaseApiResponse<List<TemplateSummaryResponse>> getTemplates(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.getTemplates(userId));
    }

    @Operation(summary = "템플릿 상세 조회", description = "템플릿과 하위 토픽, 질문을 상세 조회합니다.")
    @GetMapping("/{templateId}")
    public BaseApiResponse<TemplateResponse> getTemplate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.getTemplate(userId, templateId));
    }

    @Operation(summary = "템플릿 수정", description = "템플릿 제목/직무 정보를 수정합니다.")
    @PutMapping("/{templateId}")
    public BaseApiResponse<TemplateResponse> updateTemplate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @Valid @RequestBody TemplateUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.updateTemplate(userId, templateId, request));
    }

    @Operation(summary = "템플릿 삭제", description = "템플릿과 하위 토픽/질문을 삭제합니다.")
    @DeleteMapping("/{templateId}")
    public BaseApiResponse<Void> deleteTemplate(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId
    ) {
        Long userId = principal.getUser().getId();
        interviewTemplateService.deleteTemplate(userId, templateId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "토픽 추가", description = "템플릿 하위 토픽을 추가합니다.")
    @PostMapping("/{templateId}/topics")
    public BaseApiResponse<TopicResponse> addTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @Valid @RequestBody TopicCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.addTopic(userId, templateId, request));
    }

    @Operation(summary = "토픽 수정", description = "토픽 정보를 수정합니다.")
    @PatchMapping("/{templateId}/topics/{topicId}")
    public BaseApiResponse<TopicResponse> updateTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @Valid @RequestBody TopicUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.updateTopic(userId, templateId, topicId, request));
    }

    @Operation(summary = "토픽 삭제", description = "토픽과 하위 질문을 삭제합니다.")
    @DeleteMapping("/{templateId}/topics/{topicId}")
    public BaseApiResponse<Void> deleteTopic(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId
    ) {
        Long userId = principal.getUser().getId();
        interviewTemplateService.deleteTopic(userId, templateId, topicId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "토픽 순서 변경", description = "토픽 orderIndex를 일괄 변경합니다.")
    @PatchMapping("/{templateId}/topics/order")
    public BaseApiResponse<Void> reorderTopics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @Valid @RequestBody TopicReorderRequest request
    ) {
        Long userId = principal.getUser().getId();
        interviewTemplateService.reorderTopics(userId, templateId, request);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "질문 추가", description = "토픽 하위 질문을 추가합니다.")
    @PostMapping("/{templateId}/topics/{topicId}/questions")
    public BaseApiResponse<QuestionResponse> addQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @Valid @RequestBody QuestionCreateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.addQuestion(userId, templateId, topicId, request));
    }

    @Operation(summary = "질문 수정", description = "질문 내용을 수정합니다.")
    @PatchMapping("/{templateId}/topics/{topicId}/questions/{questionId}")
    public BaseApiResponse<QuestionResponse> updateQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.updateQuestion(userId, templateId, topicId, questionId, request));
    }

    @Operation(summary = "질문 삭제", description = "질문을 삭제합니다.")
    @DeleteMapping("/{templateId}/topics/{topicId}/questions/{questionId}")
    public BaseApiResponse<Void> deleteQuestion(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @PathVariable Long questionId
    ) {
        Long userId = principal.getUser().getId();
        interviewTemplateService.deleteQuestion(userId, templateId, topicId, questionId);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "질문 순서 변경", description = "질문 orderIndex를 일괄 변경합니다.")
    @PatchMapping("/{templateId}/topics/{topicId}/questions/order")
    public BaseApiResponse<Void> reorderQuestions(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @Valid @RequestBody QuestionReorderRequest request
    ) {
        Long userId = principal.getUser().getId();
        interviewTemplateService.reorderQuestions(userId, templateId, topicId, request);
        return BaseApiResponse.ok(null);
    }

    @Operation(summary = "질문 메모 조회", description = "특정 질문에 작성된 나의 메모를 조회합니다.")
    @GetMapping("/{templateId}/topics/{topicId}/questions/{questionId}/memo")
    public BaseApiResponse<QuestionResponse> getQuestionMemo(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @PathVariable Long questionId
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.getQuestion(userId, templateId, topicId, questionId));
    }

    @Operation(summary = "질문 메모 수정", description = "질문에 대한 나의 답변(메모)을 작성하거나 수정합니다.")
    @PatchMapping("/{templateId}/topics/{topicId}/questions/{questionId}/memo")
    public BaseApiResponse<QuestionResponse> updateQuestionMemo(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long templateId,
            @PathVariable Long topicId,
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionMemoUpdateRequest request
    ) {
        Long userId = principal.getUser().getId();
        return BaseApiResponse.ok(interviewTemplateService.updateQuestionMemo(userId, templateId, topicId, questionId, request));
    }
}
