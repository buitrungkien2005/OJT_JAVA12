package com.ojt.java12.dto.response;

import java.time.LocalDateTime;

public record ProjectResponse(
    Long id,
    String name,
    String description,
    UserResponse owner,
    int memberCount,
    int documentCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
