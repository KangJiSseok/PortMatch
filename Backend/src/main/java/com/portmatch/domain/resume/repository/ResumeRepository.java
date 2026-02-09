package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    Optional<Resume> findByIdAndUser_Id(Long id, Long userId);

    List<Resume> findAllByUser_IdOrderByUpdatedAtDesc(Long userId);

    Optional<Resume> findByUser_IdAndIsMainTrue(Long userId);

    boolean existsByUser_IdAndIsMainTrue(Long userId);

    boolean existsByPortfolio_Id(Long portfolioId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Resume r set r.isMain = false where r.user.id = :userId")
    int unsetMainForUser(@Param("userId") Long userId);
}
