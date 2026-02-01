package com.portmatch.domain.portfolio.service;

import com.portmatch.domain.auth.entity.User;
import com.portmatch.domain.auth.repository.UserRepository;
import com.portmatch.domain.portfolio.dto.PortfolioResponse;
import com.portmatch.domain.portfolio.dto.PresignedUrlResponse;
import com.portmatch.domain.portfolio.entity.Portfolio;
import com.portmatch.domain.portfolio.repository.PortfolioAnalysisRepository;
import com.portmatch.domain.portfolio.repository.PortfolioRepository;
import com.portmatch.global.config.AwsS3Properties;
import com.portmatch.global.exception.BusinessException;
import com.portmatch.global.response.ResponseCode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;
    private final PortfolioAnalysisRepository portfolioAnalysisRepository;
    private final UserRepository userRepository;
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final AwsS3Properties awsS3Properties;

    public PortfolioService(
            PortfolioRepository portfolioRepository,
            PortfolioAnalysisRepository portfolioAnalysisRepository,
            UserRepository userRepository,
            S3Client s3Client,
            S3Presigner s3Presigner,
            AwsS3Properties awsS3Properties
    ) {
        this.portfolioRepository = portfolioRepository;
        this.portfolioAnalysisRepository = portfolioAnalysisRepository;
        this.userRepository = userRepository;
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
        this.awsS3Properties = awsS3Properties;
    }

    public PortfolioResponse upload(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ResponseCode.PORTFOLIO_FILE_REQUIRED);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.USER_NOT_FOUND));

        String originalFilename = file.getOriginalFilename();
        String safeFilename = (originalFilename == null || originalFilename.isBlank())
                ? "portfolio"
                : originalFilename;
        String key = "portfolios/" + userId + "/" + UUID.randomUUID() + "_" + safeFilename;

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(key)
                .contentType(file.getContentType())
                .build();

        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(inputStream, file.getSize()));
        } catch (IOException exception) {
            throw new BusinessException(ResponseCode.PORTFOLIO_S3_UPLOAD_FAILED);
        }

        String fileUrl = s3Client.utilities()
                .getUrl(GetUrlRequest.builder()
                        .bucket(awsS3Properties.getBucket())
                        .key(key)
                        .build())
                .toString();

        Portfolio portfolio = new Portfolio(
                user,
                key,
                fileUrl,
                safeFilename,
                file.getContentType(),
                file.getSize()
        );

        Portfolio saved = portfolioRepository.save(portfolio);
        return PortfolioResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<PortfolioResponse> getByUserId(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ResponseCode.USER_NOT_FOUND);
        }

        return portfolioRepository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(PortfolioResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PortfolioResponse getById(Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        return PortfolioResponse.from(portfolio);
    }

    @Transactional(readOnly = true)
    public PresignedUrlResponse getPresignedUrl(Long portfolioId, int minutes) {
        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        return buildPresignedUrl(portfolio, minutes);
    }

    @Transactional(readOnly = true)
    public PresignedUrlResponse getPresignedUrlForUser(Long userId, Long portfolioId, int minutes) {
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        return buildPresignedUrl(portfolio, minutes);
    }

    public void deleteForUser(Long userId, Long portfolioId) {
        Portfolio portfolio = portfolioRepository.findByIdAndUserId(portfolioId, userId)
                .orElseThrow(() -> new BusinessException(ResponseCode.PORTFOLIO_NOT_FOUND));

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(portfolio.getS3Key())
                .build();
        try {
            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception exception) {
            throw new BusinessException(ResponseCode.PORTFOLIO_S3_DELETE_FAILED);
        }

        portfolioAnalysisRepository.findByPortfolioId(portfolio.getId())
                .ifPresent(portfolioAnalysisRepository::delete);

        portfolioRepository.delete(portfolio);
    }

    private PresignedUrlResponse buildPresignedUrl(Portfolio portfolio, int minutes) {
        int expiresInMinutes = Math.max(1, minutes);
        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(awsS3Properties.getBucket())
                .key(portfolio.getS3Key())
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(expiresInMinutes))
                .getObjectRequest(getObjectRequest)
                .build();

        String url = s3Presigner.presignGetObject(presignRequest).url().toString();
        return new PresignedUrlResponse(url, expiresInMinutes);
    }
}
