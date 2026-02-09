package com.portmatch.domain.jobapplication.repository;

import com.portmatch.domain.jobapplication.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    Optional<JobApplication> findByUser_IdAndJobPosting_Id(Long userId, Long jobPostingId);

    boolean existsByUser_IdAndJobPosting_Id(Long userId, Long jobPostingId);

    List<JobApplication> findAllByJobPosting_IdOrderByCreatedAtDesc(Long jobPostingId);

	List<JobApplication> findAllByUser_IdOrderByCreatedAtDesc(Long userId);

    @Query("select ja.id from JobApplication ja where ja.resume.id = :resumeId")
    List<Long> findIdsByResume_Id(@Param("resumeId") Long resumeId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "update job_applications set resume_id = null where resume_id = :resumeId", nativeQuery = true)
    int clearResumeByResumeId(@Param("resumeId") Long resumeId);

    Optional<JobApplication> findByIdAndJobPosting_Id(Long id, Long jobPostingId);
}
