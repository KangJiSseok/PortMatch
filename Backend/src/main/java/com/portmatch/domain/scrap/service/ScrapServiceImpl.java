package com.portmatch.domain.scrap.service;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import com.portmatch.domain.scrap.dto.ScrapDto;
import com.portmatch.domain.scrap.entity.ScrapEntity;
import com.portmatch.domain.scrap.repository.ScrapRepository;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScrapServiceImpl implements ScrapService {

    private final ScrapRepository scrapRepository;
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;

    @Transactional
    public boolean toggleScrap(Long uid, Long pid) {
        // 1. 네 레포지토리에 있는 이름 그대로! (findByUidAndPid)
        return scrapRepository.findByUidAndPid(uid, pid)
                .map(scrap -> {
                    scrapRepository.delete(scrap);
                    return false;
                })
                .orElseGet(() -> {
                    // 2. 저장은 객체 참조 방식이므로 객체를 찾아옴
                    User user = userRepository.findById(uid)
                            .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));
                    JobPostingEntity posting = jobPostingRepository.findById(pid)
                            .orElseThrow(() -> new BusinessException(ResponseCode.NOT_FOUND));

                    // 3. 빌더에도 객체 필드명(user, jobPosting)에 맞춰서 쏙!
                    ScrapEntity newScrap = ScrapEntity.builder()
                            .user(user)
                            .jobPosting(posting)
                            .build();
                    scrapRepository.save(newScrap);
                    return true;
                });
    }

    @Override
    public boolean isScraped(Long uid, Long pid) {
        // 4. 이것도 네 이름 그대로! (existsByUidAndPid)
        return scrapRepository.existsByUidAndPid(uid, pid);
    }

    @Transactional(readOnly = true)
    public List<ScrapDto> getMyScraps(Long uid) {
        // 5. 이것도 네 이름 그대로! (findAllByUidOrderByCreatedAtDesc)
        return scrapRepository.findAllByUidOrderByCreatedAtDesc(uid).stream()
                .map(ScrapDto::fromEntity)
                .collect(Collectors.toList());
    }
}