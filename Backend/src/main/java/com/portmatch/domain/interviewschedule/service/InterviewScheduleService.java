package com.portmatch.domain.interviewschedule.service;


import com.portmatch.domain.interviewschedule.dto.InterviewScheduleDto;

import java.util.List;

public interface InterviewScheduleService {
    List<InterviewScheduleDto> getSchedulesByUser(Long userId);
    List<InterviewScheduleDto> getSchedulesByJob(Long jobPostingId);
    List<InterviewScheduleDto> getSchedulesByCompany(String cid);
    Long createSchedule(InterviewScheduleDto dto);
    void deleteSchedule(Long scheduleId);
    void updateSchedule(Long scheduleId, InterviewScheduleDto dto);
}
