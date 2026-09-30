package com.ojt.java12.service.impl;

import com.ojt.java12.service.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalStorageServiceImpl implements StorageService {

    private final Path rootLocation;

    public LocalStorageServiceImpl(@Value("${storage.local.upload-dir:./uploads}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Initialized local disk storage directory at: {}", this.rootLocation);
        } catch (IOException e) {
            log.error("Could not create local upload directory: {}", e.getMessage());
            throw new RuntimeException("Could not initialize local disk storage", e);
        }
    }

    @Override
    public void uploadFile(String objectKey, InputStream stream, long size, String contentType) {
        try {
            Path destinationFile = resolveSafePath(objectKey);
            Files.createDirectories(destinationFile.getParent());
            Files.copy(stream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved local file: {} (size: {} bytes)", destinationFile, size);
        } catch (IOException e) {
            log.error("Failed to store local file for key {}: {}", objectKey, e.getMessage());
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    @Override
    public String generatePresignedUrl(String objectKey, int expirySeconds) {
        // Return direct streaming endpoint for local file
        return "/api/documents/file?key=" + URLEncoder.encode(objectKey, StandardCharsets.UTF_8);
    }

    @Override
    public void deleteFile(String objectKey) {
        try {
            Path file = resolveSafePath(objectKey);
            boolean deleted = Files.deleteIfExists(file);
            log.info("Deleted local file for key {}: {}", objectKey, deleted);
        } catch (IOException e) {
            log.warn("Could not delete local file for key {}: {}", objectKey, e.getMessage());
        }
    }

    @Override
    public Resource loadFileAsResource(String objectKey) {
        try {
            Path file = resolveSafePath(objectKey);
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Could not read file: " + objectKey);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Malformed URL for key: " + objectKey, e);
        }
    }

    private Path resolveSafePath(String objectKey) {
        Path resolved = this.rootLocation.resolve(objectKey).normalize();
        if (!resolved.startsWith(this.rootLocation)) {
            throw new SecurityException("Cannot access file outside current storage directory: " + objectKey);
        }
        return resolved;
    }
}
