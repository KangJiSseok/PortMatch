package com.portmatch.domain.scrap.repository;

import com.portmatch.domain.scrap.entity.ScrapEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.List;

public interface ScrapRepository extends JpaRepository<ScrapEntity, Long> {

    // 1. 특정 유저가 특정 공고를 스크랩했는지 확인
    @Query("SELECT s FROM ScrapEntity s WHERE s.user.id = :uid AND s.jobPosting.id = :pid")
    Optional<ScrapEntity> findByUidAndPid(Long uid, Long pid);

    // 2. 내 스크랩 목록 조회
    @Query("SELECT s FROM ScrapEntity s WHERE s.user.id = :uid ORDER BY s.createdAt DESC")
    List<ScrapEntity> findAllByUidOrderByCreatedAtDesc(Long uid);

    // 3. 존재 여부 확인
    @Query("SELECT COUNT(s) > 0 FROM ScrapEntity s WHERE s.user.id = :uid AND s.jobPosting.id = :pid")
    boolean existsByUidAndPid(Long uid, Long pid);

    // 4. 인기 공고 (이건 기존 쿼리의 pid를 jobPosting.id로 변경)
    @Query("SELECT s.jobPosting.id FROM ScrapEntity s GROUP BY s.jobPosting.id ORDER BY COUNT(s.jobPosting.id) DESC")
    List<Long> findTopPidsByScrapCount(Pageable pageable);
}