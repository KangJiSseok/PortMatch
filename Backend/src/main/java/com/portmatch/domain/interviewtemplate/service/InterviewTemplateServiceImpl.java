package com.portmatch.domain.interviewtemplate.service;

import com.portmatch.domain.interviewtemplate.dto.*;
import com.portmatch.domain.interviewtemplate.entity.InterviewQuestionEntity;
import com.portmatch.domain.interviewtemplate.entity.InterviewTemplateEntity;
import com.portmatch.domain.interviewtemplate.entity.InterviewTopicEntity;
import com.portmatch.domain.interviewtemplate.repository.InterviewQuestionRepository;
import com.portmatch.domain.interviewtemplate.repository.InterviewTemplateRepository;
import com.portmatch.domain.interviewtemplate.repository.InterviewTopicRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewTemplateServiceImpl implements InterviewTemplateService {

    private final InterviewTemplateRepository templateRepository;
    private final InterviewTopicRepository topicRepository;
    private final InterviewQuestionRepository questionRepository;

    @Override
    @Transactional
    public TemplateResponse createTemplate(Long userId, TemplateCreateRequest request) {
        InterviewTemplateEntity template = InterviewTemplateEntity.create(
                userId,
                request.getTitle(),
                request.getTargetRole()
        );
        List<TemplateTopicCreateRequest> topicRequests = request.getTopics();
        if (topicRequests != null) {
            for (int i = 0; i < topicRequests.size(); i++) {
                TemplateTopicCreateRequest topicRequest = topicRequests.get(i);
                Integer topicOrder = topicRequest.getOrderIndex();
                if (topicOrder == null) {
                    topicOrder = i;
                }
                InterviewTopicEntity topic = InterviewTopicEntity.create(template, topicRequest.getName(), topicOrder);
                template.addTopic(topic);

                List<TemplateQuestionCreateRequest> questionRequests = topicRequest.getQuestions();
                if (questionRequests != null) {
                    for (int j = 0; j < questionRequests.size(); j++) {
                        TemplateQuestionCreateRequest questionRequest = questionRequests.get(j);
                        Integer questionOrder = questionRequest.getOrderIndex();
                        if (questionOrder == null) {
                            questionOrder = j;
                        }
                        InterviewQuestionEntity question = InterviewQuestionEntity.create(
                                topic,
                                questionRequest.getContent(),
                                questionOrder
                        );
                        topic.addQuestion(question);
                    }
                }
            }
        }
        InterviewTemplateEntity saved = templateRepository.save(template);
        List<InterviewTopicEntity> topics = topicRepository.findAllByTemplateIdOrderByOrderIndexAscIdAsc(saved.getId());
        List<TopicResponse> topicResponses = topics.stream()
                .map(this::toTopicResponseWithQuestions)
                .toList();
        return toTemplateResponse(saved, topicResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TemplateSummaryResponse> getTemplates(Long userId) {
        return templateRepository.findAllByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toTemplateSummaryResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public TemplateResponse getTemplate(Long userId, Long templateId) {
        InterviewTemplateEntity template = getTemplateOwned(userId, templateId);
        List<InterviewTopicEntity> topics = topicRepository.findAllByTemplateIdOrderByOrderIndexAscIdAsc(templateId);
        List<TopicResponse> topicResponses = topics.stream()
                .map(this::toTopicResponseWithQuestions)
                .toList();
        return toTemplateResponse(template, topicResponses);
    }

    @Override
    @Transactional
    public TemplateResponse updateTemplate(Long userId, Long templateId, TemplateUpdateRequest request) {
        InterviewTemplateEntity template = getTemplateOwned(userId, templateId);
        template.update(request.getTitle(), request.getTargetRole());
        return toTemplateResponse(template, List.of());
    }

    @Override
    @Transactional
    public void deleteTemplate(Long userId, Long templateId) {
        InterviewTemplateEntity template = getTemplateOwned(userId, templateId);
        templateRepository.delete(template);
    }

    @Override
    @Transactional
    public TopicResponse addTopic(Long userId, Long templateId, TopicCreateRequest request) {
        InterviewTemplateEntity template = getTemplateOwned(userId, templateId);
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            Integer maxOrder = topicRepository.findMaxOrderIndexByTemplateId(templateId);
            orderIndex = maxOrder + 1;
        }
        InterviewTopicEntity topic = InterviewTopicEntity.create(template, request.getName(), orderIndex);
        InterviewTopicEntity saved = topicRepository.save(topic);
        return toTopicResponse(saved, List.of());
    }

    @Override
    @Transactional
    public TopicResponse updateTopic(Long userId, Long templateId, Long topicId, TopicUpdateRequest request) {
        getTemplateOwned(userId, templateId);
        InterviewTopicEntity topic = topicRepository.findByIdAndTemplateId(topicId, templateId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        topic.update(request.getName(), null);
        return toTopicResponse(topic, List.of());
    }

    @Override
    @Transactional
    public void deleteTopic(Long userId, Long templateId, Long topicId) {
        getTemplateOwned(userId, templateId);
        InterviewTopicEntity topic = topicRepository.findByIdAndTemplateId(topicId, templateId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        topicRepository.delete(topic);
    }

    @Override
    @Transactional
    public void reorderTopics(Long userId, Long templateId, TopicReorderRequest request) {
        getTemplateOwned(userId, templateId);
        List<Long> ids = request.getItems().stream()
                .map(OrderIndexItem::getId)
                .toList();
        List<InterviewTopicEntity> topics = topicRepository.findAllByTemplateIdAndIdIn(templateId, ids);
        if (topics.size() != ids.size()) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        Map<Long, InterviewTopicEntity> topicMap = topics.stream()
                .collect(Collectors.toMap(InterviewTopicEntity::getId, t -> t));
        request.getItems().forEach(item -> {
            InterviewTopicEntity topic = topicMap.get(item.getId());
            topic.update(topic.getName(), item.getOrderIndex());
        });
        topicRepository.saveAll(topics);
    }

    @Override
    @Transactional
    public QuestionResponse addQuestion(Long userId, Long templateId, Long topicId, QuestionCreateRequest request) {
        InterviewTopicEntity topic = getTopicOwned(userId, templateId, topicId);
        Integer orderIndex = request.getOrderIndex();
        if (orderIndex == null) {
            Integer maxOrder = questionRepository.findMaxOrderIndexByTopicId(topicId);
            orderIndex = maxOrder + 1;
        }
        InterviewQuestionEntity question = InterviewQuestionEntity.create(topic, request.getContent(), orderIndex);
        InterviewQuestionEntity saved = questionRepository.save(question);
        return toQuestionResponse(saved);
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(Long userId, Long templateId, Long topicId, Long questionId, QuestionUpdateRequest request) {
        getTopicOwned(userId, templateId, topicId);
        InterviewQuestionEntity question = questionRepository.findByIdAndTopicId(questionId, topicId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        question.update(request.getContent(), null);
        return toQuestionResponse(question);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long userId, Long templateId, Long topicId, Long questionId) {
        getTopicOwned(userId, templateId, topicId);
        InterviewQuestionEntity question = questionRepository.findByIdAndTopicId(questionId, topicId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        questionRepository.delete(question);
    }

    @Override
    @Transactional
    public void reorderQuestions(Long userId, Long templateId, Long topicId, QuestionReorderRequest request) {
        getTopicOwned(userId, templateId, topicId);
        List<Long> ids = request.getItems().stream()
                .map(OrderIndexItem::getId)
                .toList();
        List<InterviewQuestionEntity> questions = questionRepository.findAllByTopicIdAndIdIn(topicId, ids);
        if (questions.size() != ids.size()) {
            throw new BusinessException(ResponseCode.NOT_FOUND);
        }
        Map<Long, InterviewQuestionEntity> questionMap = questions.stream()
                .collect(Collectors.toMap(InterviewQuestionEntity::getId, q -> q));
        request.getItems().forEach(item -> {
            InterviewQuestionEntity question = questionMap.get(item.getId());
            question.update(question.getContent(), item.getOrderIndex());
        });
        questionRepository.saveAll(questions);
    }

    private InterviewTemplateEntity getTemplateOwned(Long userId, Long templateId) {
        return templateRepository.findByIdAndUserId(templateId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
    }

    private InterviewTopicEntity getTopicOwned(Long userId, Long templateId, Long topicId) {
        InterviewTopicEntity topic = topicRepository.findByIdAndTemplateId(topicId, templateId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        if (!topic.getTemplate().getUserId().equals(userId)) {
            throw new BusinessException(ResponseCode.UNAUTHORIZED);
        }
        return topic;
    }

    private TemplateSummaryResponse toTemplateSummaryResponse(InterviewTemplateEntity template) {
        return TemplateSummaryResponse.builder()
                .id(template.getId())
                .title(template.getTitle())
                .targetRole(template.getTargetRole())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private TemplateResponse toTemplateResponse(InterviewTemplateEntity template, List<TopicResponse> topics) {
        return TemplateResponse.builder()
                .id(template.getId())
                .userId(template.getUserId())
                .title(template.getTitle())
                .targetRole(template.getTargetRole())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .topics(topics)
                .build();
    }

    private TopicResponse toTopicResponseWithQuestions(InterviewTopicEntity topic) {
        List<QuestionResponse> questions = questionRepository.findAllByTopicIdOrderByOrderIndexAscIdAsc(topic.getId())
                .stream()
                .map(this::toQuestionResponse)
                .toList();
        return toTopicResponse(topic, questions);
    }

    private TopicResponse toTopicResponse(InterviewTopicEntity topic, List<QuestionResponse> questions) {
        return TopicResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .orderIndex(topic.getOrderIndex())
                .createdAt(topic.getCreatedAt())
                .updatedAt(topic.getUpdatedAt())
                .questions(questions)
                .build();
    }

    private QuestionResponse toQuestionResponse(InterviewQuestionEntity question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .content(question.getContent())
                .orderIndex(question.getOrderIndex())
                .memoContent(question.getMemoContent())
                .createdAt(question.getCreatedAt())
                .updatedAt(question.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestionMemo(Long userId, Long templateId, Long topicId, Long questionId, QuestionMemoUpdateRequest request) {
        getTopicOwned(userId, templateId, topicId);
        InterviewQuestionEntity question = questionRepository.findByIdAndTopicId(questionId, topicId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        question.updateMemo(request.getMemoContent());
        return toQuestionResponse(question);
    }

    @Override
    @Transactional(readOnly = true)
    public QuestionResponse getQuestion(Long userId, Long templateId, Long topicId, Long questionId) {
        getTopicOwned(userId, templateId, topicId);
        InterviewQuestionEntity question = questionRepository.findByIdAndTopicId(questionId, topicId)
                .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));
        return toQuestionResponse(question);
    }
}
