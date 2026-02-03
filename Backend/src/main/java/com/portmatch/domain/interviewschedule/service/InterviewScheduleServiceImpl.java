package com.portmatch.domain.interviewschedule.service;

import com.portmatch.domain.auth.dto.response.MeResponse;
import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.interviewschedule.dto.InterviewScheduleDto;
import com.portmatch.domain.interviewschedule.entity.InterviewScheduleEntity;
import com.portmatch.domain.interviewschedule.repository.InterviewServiceRepository;
import com.portmatch.domain.jobposting.dto.JobPostingDto;
import com.portmatch.domain.jobposting.entity.JobPostingEntity;
import com.portmatch.domain.jobposting.repository.JobPostingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterviewScheduleServiceImpl implements InterviewScheduleService {

    private final InterviewServiceRepository interviewServiceRepository;
    private final UserRepository userRepository;
    private final JobPostingRepository jobPostingRepository;

    @Override
    public List<InterviewScheduleDto> getSchedulesByUser(Long userId) {
        return interviewServiceRepository.findByUserId(userId).stream()
                .map(this::manualConvertToDto) // 아래 만든 수동 변환 메서드 사용
                .collect(Collectors.toList());
    }

    @Override
    public List<InterviewScheduleDto> getSchedulesByJob(Long jobPostingId) {
        return interviewServiceRepository.findByJobPostingId(jobPostingId).stream()
                .map(this::manualConvertToDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Long createSchedule(InterviewScheduleDto dto) {
        // 1. JSON 구조에 맞춰 안전하게 ID 추출 (Null 체크 포함)
        if (dto.getUser() == null || dto.getJobPosting() == null) {
            throw new IllegalArgumentException("유저 정보 또는 공고 정보가 누락되었습니다.");
        }

        Long userId = dto.getUser().getUserId();
        Long jobPostingId = dto.getJobPosting().getId();

        boolean exists = interviewServiceRepository.existsByUserIdAndJobPostingId(userId, jobPostingId);
        if (exists) {
            throw new IllegalStateException("이미 이 공고에 대한 면접 일정이 등록되어 있어!");
        }

        User foundUser = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("유저 없음 ID: " + userId));

        JobPostingEntity foundJobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new IllegalArgumentException("공고 없음 ID: " + jobPostingId));

        // 2. 엔티티 빌드 및 저장
        InterviewScheduleEntity entity = InterviewScheduleEntity.builder()
                .user(foundUser)
                .jobPosting(foundJobPosting)
                .time(dto.getTime())
                .status(dto.getStatus())
                .build();

        return interviewServiceRepository.save(entity).getId();
    }

    @Override
    @Transactional
    public void deleteSchedule(Long scheduleId) {
        if (!interviewServiceRepository.existsById(scheduleId)) {
            throw new IllegalArgumentException("삭제하려는 면접 일정이 존재하지 않아! ID: " + scheduleId);
        }

        // 2. 삭제 실행
        interviewServiceRepository.deleteById(scheduleId);
    }

    @Override
    @Transactional
    public void updateSchedule(Long scheduleId, InterviewScheduleDto dto) {
        // 1. 기존 일정 찾기
        InterviewScheduleEntity entity = interviewServiceRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("수정할 일정이 없어! ID: " + scheduleId));

        // 2. 엔티티 내부 메서드 호출 (Setter 에러 해결!)
        entity.updateSchedule(dto.getTime(), dto.getStatus());

        // JPA 더티 체킹 덕분에 save() 안 불러도 커밋 시점에 반영돼!
    }

    // 💡 다른 서비스 안 빌려쓰고 여기서 직접 DTO로 정성스럽게 옮겨닮는 메서드야!
    private InterviewScheduleDto manualConvertToDto(InterviewScheduleEntity entity) {
        JobPostingEntity jp = entity.getJobPosting();
        User u = entity.getUser();

        // 공고 정보 수동 변환 (빨간 줄 날 일 없음!)
        JobPostingDto jobDto = JobPostingDto.builder()
                .id(jp.getId())
                .title(jp.getTitle())
                .active(jp.getActive())
                .startDate(jp.getStartDate())
                .endDate(jp.getEndDate())
                .vcnt(jp.getVcnt())
                .detail(jp.getDetail())
                .jobType(jp.getJobType())
                .build();

        // 유저 정보 수동 변환
        MeResponse userDto = MeResponse.builder()
                .userId(u.getId())
                .email(u.getEmail())
                .name(u.getName())
                .role(u.getRole())
                .build();

        return InterviewScheduleDto.builder()
                .id(entity.getId())
                .time(entity.getTime())
                .status(entity.getStatus())
                .userId(u.getId())
                .jobPostingId(jp.getId())
                .jobPosting(jobDto)
                .user(userDto)
                .build();
    }
}