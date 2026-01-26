package com.portmatch.domain.scrap.service;

import com.portmatch.domain.scrap.dto.ScrapDto;
import com.portmatch.domain.scrap.entity.ScrapEntity;
import com.portmatch.domain.scrap.repository.ScrapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScrapServiceImpl implements ScrapService {

    private final ScrapRepository scrapRepository;

    /**
     * 스크랩 토글 로직
     * @return true면 스크랩 등록, false면 스크랩 해제
     */
    @Transactional
    public boolean toggleScrap(Long uid, String pid) {
        // 1. 이미 스크랩 했는지 확인
        return scrapRepository.findByUidAndPid(uid, pid)
                .map(scrap -> {
                    // 2. 존재하면 삭제 (스크랩 취소)
                    scrapRepository.delete(scrap);
                    return false;
                })
                .orElseGet(() -> {
                    // 3. 존재하지 않으면 등록 (스크랩 추가)
                    ScrapEntity newScrap = ScrapEntity.builder()
                            .uid(uid)
                            .pid(pid)
                            .build();
                    scrapRepository.save(newScrap);
                    return true;
                });
    }

    @Override
    public boolean isScraped(Long uid, String pid) {
        return scrapRepository.existsByUidAndPid(uid, pid);
    }

    /**
     * 특정 유저의 스크랩 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ScrapDto> getMyScraps(Long uid) {
        return scrapRepository.findAllByUidOrderByCreatedAtDesc(uid).stream()
                .map(ScrapDto::fromEntity)
                .collect(Collectors.toList());
    }
}