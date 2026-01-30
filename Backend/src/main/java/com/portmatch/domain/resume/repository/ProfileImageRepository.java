package com.portmatch.domain.resume.repository;

import com.portmatch.domain.resume.entity.ProfileImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProfileImageRepository extends JpaRepository<ProfileImage, Long> {
    Optional<ProfileImage> findByIdAndUser_Id(Long id, Long userId);
}
