package com.portmatch.domain.interviewtemplate.service;

import com.portmatch.domain.interviewtemplate.dto.*;

import java.util.List;

public interface InterviewTemplateService {
    TemplateResponse createTemplate(Long userId, TemplateCreateRequest request);

    List<TemplateSummaryResponse> getTemplates(Long userId);

    TemplateResponse getTemplate(Long userId, Long templateId);

    TemplateResponse updateTemplate(Long userId, Long templateId, TemplateUpdateRequest request);

    void deleteTemplate(Long userId, Long templateId);

    TopicResponse addTopic(Long userId, Long templateId, TopicCreateRequest request);

    TopicResponse updateTopic(Long userId, Long templateId, Long topicId, TopicUpdateRequest request);

    void deleteTopic(Long userId, Long templateId, Long topicId);

    void reorderTopics(Long userId, Long templateId, TopicReorderRequest request);

    QuestionResponse addQuestion(Long userId, Long templateId, Long topicId, QuestionCreateRequest request);

    QuestionResponse updateQuestion(Long userId, Long templateId, Long topicId, Long questionId, QuestionUpdateRequest request);

    void deleteQuestion(Long userId, Long templateId, Long topicId, Long questionId);

    void reorderQuestions(Long userId, Long templateId, Long topicId, QuestionReorderRequest request);

    QuestionResponse updateQuestionMemo(Long userId, Long templateId, Long topicId, Long questionId, QuestionMemoUpdateRequest request);
    QuestionResponse getQuestion(Long userId, Long templateId, Long topicId, Long questionId);
}
