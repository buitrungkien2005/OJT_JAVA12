package com.ojt.java12.service.impl;

import com.ojt.java12.service.StorageService;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "minio")
@RequiredArgsConstructor
@Slf4j
public class MinioStorageServiceImpl implements StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name:ojt-documents}")
    private String bucketName;

    @Value("${minio.endpoint:http://localhost:9000}")
    private String internalEndpoint;

    @Value("${minio.public-url:http://localhost:9000}")
    private String publicEndpoint;

    @Override
    public void uploadFile(String objectKey, InputStream stream, long size, String contentType) {
        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .stream(stream, size, -1)
                            .contentType(contentType)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to upload file to MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Storage service error during upload: " + e.getMessage());
        }
    }

    @Override
    public String generatePresignedUrl(String objectKey, int expirySeconds) {
        try {
            String presignedUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(expirySeconds, TimeUnit.SECONDS)
                            .build()
            );

            // Replace internal endpoint with public endpoint if configured and differing
            if (publicEndpoint != null && !publicEndpoint.isBlank() && !publicEndpoint.equals(internalEndpoint)) {
                return presignedUrl.replace(internalEndpoint, publicEndpoint);
            }
            return presignedUrl;
        } catch (Exception e) {
            log.error("Failed to generate presigned URL: {}", e.getMessage(), e);
            throw new RuntimeException("Storage service error during URL generation: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to delete file from MinIO: {}", e.getMessage(), e);
            throw new RuntimeException("Storage service error during deletion: " + e.getMessage());
        }
    }

    @Override
    public Resource loadFileAsResource(String objectKey) {
        try {
            InputStream stream = minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );
            return new InputStreamResource(stream);
        } catch (Exception e) {
            log.error("Failed to read MinIO object {}: {}", objectKey, e.getMessage());
            throw new RuntimeException("Could not read file from MinIO storage: " + e.getMessage(), e);
        }
    }
}
