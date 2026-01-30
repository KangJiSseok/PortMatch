package com.portmatch.domain.resume.service;

import com.portmatch.domain.resume.dto.*;

import java.util.List;

public interface ResumeService {

    ResumeResponse createResume(Long userId, ResumeCreateRequest request);

    List<ResumeSummaryResponse> getResumes(Long userId);

    ResumeResponse getResume(Long userId, Long resumeId);

    ResumeResponse updateResume(Long userId, Long resumeId, ResumeUpdateRequest request);

    void deleteResume(Long userId, Long resumeId);

    void setMainResume(Long userId, Long resumeId);

    ProfileResponse upsertProfile(Long userId, Long resumeId, ProfileUpsertRequest request);

    ProfileResponse updateProfileImage(Long userId, Long resumeId, Long profileImageId);

    void deleteProfileImage(Long userId, Long resumeId);

    CareerResponse addCareer(Long userId, Long resumeId, CareerCreateRequest request);

    CareerResponse updateCareer(Long userId, Long resumeId, Long careerId, CareerUpdateRequest request);

    void deleteCareer(Long userId, Long resumeId, Long careerId);

    void reorderCareers(Long userId, Long resumeId, CareerReorderRequest request);

    EducationResponse addEducation(Long userId, Long resumeId, EducationCreateRequest request);

    EducationResponse updateEducation(Long userId, Long resumeId, Long educationId, EducationUpdateRequest request);

    void deleteEducation(Long userId, Long resumeId, Long educationId);

    void reorderEducations(Long userId, Long resumeId, EducationReorderRequest request);

    ResumePortfolioResponse uploadPortfolio(Long userId, Long resumeId, ResumePortfolioUpdateRequest request);

    void deletePortfolio(Long userId, Long resumeId);

    SelfIntroductionResponse addSelfIntroduction(Long userId, Long resumeId, SelfIntroductionCreateRequest request);

    SelfIntroductionResponse updateSelfIntroduction(Long userId, Long resumeId, Long selfIntroductionId, SelfIntroductionUpdateRequest request);

    void deleteSelfIntroduction(Long userId, Long resumeId, Long selfIntroductionId);

    void reorderSelfIntroductions(Long userId, Long resumeId, SelfIntroductionReorderRequest request);
}
