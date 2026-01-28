package com.portmatch.domain.interviewtemplate.repository;

import com.portmatch.domain.interviewtemplate.entity.InterviewTopicEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InterviewTopicRepository extends JpaRepository<InterviewTopicEntity, Long> {
    Optional<InterviewTopicEntity> findByIdAndTemplateId(Long id, Long templateId);

    List<InterviewTopicEntity> findAllByTemplateIdOrderByOrderIndexAscIdAsc(Long templateId);

    List<InterviewTopicEntity> findAllByTemplateIdAndIdIn(Long templateId, List<Long> ids);

    @Query("select coalesce(max(t.orderIndex), -1) from InterviewTopicEntity t where t.template.id = :templateId")
    Integer findMaxOrderIndexByTemplateId(@Param("templateId") Long templateId);
}
