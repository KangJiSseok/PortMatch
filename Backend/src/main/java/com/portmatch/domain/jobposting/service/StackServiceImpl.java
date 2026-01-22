package com.portmatch.domain.jobposting.service;

import com.portmatch.domain.jobposting.dto.TechStackDto;
import com.portmatch.domain.jobposting.entity.PostingStackEntity;
import com.portmatch.domain.jobposting.entity.TechStackEntity;
import com.portmatch.domain.jobposting.repository.PostingStackRepository;
import com.portmatch.domain.jobposting.repository.TechStackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StackServiceImpl implements StackService {

    private final TechStackRepository techStackRepository;
    private final PostingStackRepository postingStackRepository;

    // 1. 새로운 마스터 기술 스택 생성
    @Override
    @Transactional
    public void createStack(String stackName) {
        log.info("새로운 기술 스택 등록: {}", stackName);
        TechStackEntity entity = TechStackEntity.builder()
                .stackName(stackName)
                .build();
        techStackRepository.save(entity);
    }

    // 2. 전체 기술 스택 목록 조회
    @Override
    public List<TechStackDto> getAllTechStacks() {
        log.info("전체 기술 스택 목록 조회");
        return techStackRepository.findAll().stream()
                .map(TechStackDto::fromEntity)
                .collect(Collectors.toList());
    }

    // 3. 특정 공고에 포함된 스택 리스트 조회
    @Override
    public List<TechStackDto> getPostingStacks(String postingId) {
        log.info("공고별 스택 조회 요청 - ID: {}", postingId);

        // posting_stacks 테이블에서 해당 공고 ID로 조회
        List<PostingStackEntity> entities = postingStackRepository.findByJobPostingId(postingId);

        // 연결된 TechStack 정보를 DTO로 변환하여 반환
        return entities.stream()
                .map(entity -> TechStackDto.fromEntity(entity.getTechStack()))
                .collect(Collectors.toList());
    }

    @Override
    public TechStackDto getTechStackById(Long id) {
        log.info("stack id로 stack 조회");
        return techStackRepository.findById(id)
                .map(this::convertToDto)
                .orElseThrow(() -> new RuntimeException("해당 스택을 찾을 수 없습니다. ID: " + id));
    }

    private TechStackDto convertToDto(TechStackEntity techStackEntity) {
        return TechStackDto.builder()
                .stackId(techStackEntity.getId())
                .stackName(techStackEntity.getStackName())
                .build();
    }
}