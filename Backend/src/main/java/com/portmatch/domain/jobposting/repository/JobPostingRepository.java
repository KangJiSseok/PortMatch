package com.portmatch.domain.jobposting.repository;

import com.portmatch.domain.jobposting.entity.JobPostingEntity; // Entity가 필요해!
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface JobPostingRepository extends JpaRepository<JobPostingEntity, Long> {
    String FILTERED_POSTINGS = """
            FROM job_postings j
            CROSS JOIN LATERAL (
                SELECT CASE
                    WHEN j.end_date ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
                        AND pg_input_is_valid(j.end_date, 'date')
                    THEN CAST(NULLIF(j.end_date, '9999-12-31') AS date)
                END AS closing_day,
                CASE WHEN pg_input_is_valid(j.detail, 'jsonb')
                    THEN CAST(j.detail AS jsonb) ->> 'career'
                END AS detail_career
            ) dates
            CROSS JOIN LATERAL (
                SELECT CASE
                    WHEN dates.detail_career IN ('신입', '경력', '무관') THEN dates.detail_career
                    ELSE CASE j.job_type WHEN 0 THEN '신입' WHEN 1 THEN '무관' WHEN 2 THEN '경력' END
                END AS career
            ) hiring
            WHERE CASE WHEN :cid <> '' THEN j.cid = :cid
                       ELSE :keyword = '' OR strpos(lower(j.title), lower(:keyword)) > 0 END
              AND (:stackIds = '' OR EXISTS (
                  SELECT 1 FROM posting_stacks s
                  WHERE s.job_posting_id = j.id
                    AND s.stack_id = ANY(CAST(string_to_array(:stackIds, ',') AS bigint[]))
              ))
              AND CASE :deadline
                  WHEN 'urgent' THEN dates.closing_day - :today BETWEEN 0 AND 3
                  WHEN 'week' THEN dates.closing_day - :today BETWEEN 4 AND 7
                  WHEN 'relaxed' THEN dates.closing_day - :today >= 8
                  WHEN 'always' THEN dates.closing_day IS NULL
                  ELSE true
              END
              AND CASE :experience
                  WHEN 'junior' THEN hiring.career IN ('신입', '무관')
                  WHEN 'career' THEN hiring.career IN ('경력', '무관')
                  ELSE true
              END
            """;

    @Query(value = "SELECT j.* " + FILTERED_POSTINGS + """
            ORDER BY CASE WHEN :sort = 'deadline' THEN
                CASE WHEN dates.closing_day >= :today THEN 0
                     WHEN dates.closing_day IS NULL THEN 1 ELSE 2 END
            END,
            CASE WHEN :sort = 'deadline' AND dates.closing_day >= :today THEN dates.closing_day END,
            j.id DESC
            """, countQuery = "SELECT count(*) " + FILTERED_POSTINGS, nativeQuery = true)
    Page<JobPostingEntity> findFilteredPostings(
            @Param("cid") String cid,
            @Param("keyword") String keyword,
            @Param("stackIds") String stackIds,
            @Param("deadline") String deadline,
            @Param("experience") String experience,
            @Param("sort") String sort,
            @Param("today") LocalDate today,
            Pageable pageable
    );

    @Modifying
    @Query("UPDATE JobPostingEntity j SET j.vcnt = j.vcnt + 1 WHERE j.id = :id")
    int incrementViewCount(@Param("id") Long id);

    List<JobPostingEntity> findByCompanyCid(String cid);
    // 2. 제목 키워드 검색 (기존과 동일)
    List<JobPostingEntity> findByTitleContaining(String keyword);
    List<JobPostingEntity> findAllByIdIn(List<Long> ids);
    List<JobPostingEntity> findAllByOrderByIdDesc(Pageable pageable);

    List<JobPostingEntity> findByCompanyCidAndActive(String cid, Integer active);

    @Query("SELECT j.id, j.title FROM JobPostingEntity j WHERE j.company.cid = :cid ORDER BY j.id DESC")
    List<Object[]> findTop3JobIdsAndTitlesByCid(@Param("cid") String cid, Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE JobPostingEntity j SET j.active = 0 " +
            "WHERE j.active = 1 " +
            "AND j.endDate IS NOT NULL " + // null인 데이터는 건드리지 않음
            "AND j.endDate < :today")
    void updateExpiredJobs(String today);
}
