package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.TechStackEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TechStackRepository extends JpaRepository<TechStackEntity, Long> { // String -> Long으로 변경

    boolean existsByStackName(String stackName);
    boolean existsById(Long id);
    List<TechStackEntity> findByStackNameContainingIgnoreCase(String stackName);
    Optional<TechStackEntity> findById(Long id);
}