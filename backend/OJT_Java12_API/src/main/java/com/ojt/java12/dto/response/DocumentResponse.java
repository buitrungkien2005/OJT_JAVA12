package com.ojt.java12.dto.response;

import com.ojt.java12.entity.FileCategory;
import java.time.LocalDateTime;

public record DocumentResponse(
    Long id,
    String originalName,
    String mimeType,
    FileCategory fileCategory,
    Long fileSize,
    UserResponse uploader,
    Long projectId,
    LocalDateTime createdAt
) {}
