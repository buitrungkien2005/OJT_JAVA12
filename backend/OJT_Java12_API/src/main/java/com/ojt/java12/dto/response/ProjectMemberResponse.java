package com.ojt.java12.dto.response;

import java.time.LocalDateTime;

public record ProjectMemberResponse(
    Long id,
    UserResponse user,
    LocalDateTime joinedAt
) {}
