package com.portmatch.domain.scrap.repository;

import com.portmatch.domain.scrap.entity.CompanyScrapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface CompanyScrapRepository extends JpaRepository<CompanyScrapEntity, Long> {

    // 특정 유저가 특정 기업을 스크랩했는지 상세 정보 확인
    Optional<CompanyScrapEntity> findByUidAndCid(Long uid, String cid);

    // 사용자가 스크랩한 기업 목록을 최신순으로 조회
    // 도메인 분석 서비스에서 사용자의 선호 기업 리스트를 뽑을 때 핵심이 될 거야!
    List<CompanyScrapEntity> findAllByUidOrderByCreatedAtDesc(Long uid);

    // 스크랩 여부만 빠르게 확인 (좋아요 버튼 활성화 등)
    boolean existsByUidAndCid(Long uid, String cid);

    // (추가 팁) 특정 기업을 얼마나 많은 사람이 스크랩했는지 궁금하다면?
    long countByCid(String cid);
}