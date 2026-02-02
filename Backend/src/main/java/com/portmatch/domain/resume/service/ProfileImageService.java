package com.portmatch.domain.resume.service;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.resume.dto.ProfileImageResponse;
import com.portmatch.domain.resume.entity.ProfileImage;
import com.portmatch.domain.resume.repository.ProfileImageRepository;
import com.portmatch.global.config.AwsS3Properties;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ProfileImageService {

    private final ProfileImageRepository profileImageRepository;
    private final UserRepository userRepository;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsS3Properties awsS3Properties;

    public ProfileImageResponse upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResponseCode.PROFILE_IMAGE_REQUIRED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));

        String originalFilename = file.getOriginalFilename();
        String safeFilename = (originalFilename == null || originalFilename.isBlank())
                ? "profile-image"
                : originalFilename;
        String key = "profile-images/" + userId + "/" + UUID.randomUUID() + "_" + safeFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(key)
                .contentType(file.getContentType())
                .build();

        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, file.getSize()));
        } catch (IOException exception) {
            throw new BusinessException(ResponseCode.PROFILE_IMAGE_S3_UPLOAD_FAILED);
        }

        String imageUrl = s3Client.utilities()
                .getUrl(GetUrlRequest.builder()
                        .bucket(awsS3Properties.getBucket())
                        .key(key)
                        .build())
                .toString();

        ProfileImage saved = profileImageRepository.save(new ProfileImage(user, imageUrl, key, safeFilename));
        String presignedUrl = buildPresignedUrl(saved, 10);
        return new ProfileImageResponse(
                saved.getId(),
                user.getId(),
                presignedUrl,
                saved.getImageName(),
                saved.getCreatedAt()
        );
    }

    private String buildPresignedUrl(ProfileImage profileImage, int minutes) {
        int expiresInMinutes = Math.max(1, minutes);
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(profileImage.getImageKey())
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiresInMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        return s3Presigner.presignGetObject(presignRequest).url().toString();
    }
}
