package com.ojt.java12.service;

import org.springframework.core.io.Resource;
import java.io.InputStream;

public interface StorageService {

    void uploadFile(String objectKey, InputStream stream, long size, String contentType);

    String generatePresignedUrl(String objectKey, int expirySeconds);

    void deleteFile(String objectKey);

    Resource loadFileAsResource(String objectKey);
}
