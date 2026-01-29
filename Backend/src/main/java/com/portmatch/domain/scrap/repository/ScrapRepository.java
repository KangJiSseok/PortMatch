package com.portmatch.domain.scrap.repository;

import com.portmatch.domain.scrap.entity.ScrapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface ScrapRepository extends JpaRepository<ScrapEntity, Long> {
    // 특정 유저가 특정 공고를 스크랩했는지 확인하는 용도
    Optional<ScrapEntity> findByUidAndPid(Long uid, Long pid);

    // 마이페이지 등에서 내 스크랩 목록을 볼 때 사용
    List<ScrapEntity> findAllByUidOrderByCreatedAtDesc(Long uid);

    // 존재 여부 확인 (isScraped용)
    boolean existsByUidAndPid(Long uid, Long pid);
}