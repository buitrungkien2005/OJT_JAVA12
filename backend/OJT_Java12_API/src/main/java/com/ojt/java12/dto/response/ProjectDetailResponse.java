package com.ojt.java12.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record ProjectDetailResponse(
    Long id,
    String name,
    String description,
    UserResponse owner,
    List<ProjectMemberResponse> members,
    int documentCount,
    boolean isOwner,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}
