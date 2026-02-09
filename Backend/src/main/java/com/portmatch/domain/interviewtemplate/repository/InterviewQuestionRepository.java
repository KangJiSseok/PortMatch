package com.portmatch.domain.interviewtemplate.repository;

import com.portmatch.domain.interviewtemplate.entity.InterviewQuestionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InterviewQuestionRepository extends JpaRepository<InterviewQuestionEntity, Long> {
    Optional<InterviewQuestionEntity> findByIdAndTopicId(Long id, Long topicId);

    List<InterviewQuestionEntity> findAllByTopicIdOrderByOrderIndexAscIdAsc(Long topicId);

    List<InterviewQuestionEntity> findAllByTopicIdAndIdIn(Long topicId, List<Long> ids);

    @Query("select coalesce(max(q.orderIndex), -1) from InterviewQuestionEntity q where q.topic.id = :topicId")
    Integer findMaxOrderIndexByTopicId(@Param("topicId") Long topicId);
}
