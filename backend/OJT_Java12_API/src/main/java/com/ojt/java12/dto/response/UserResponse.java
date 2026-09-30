package com.ojt.java12.dto.response;

import com.ojt.java12.entity.Role;
import java.time.LocalDateTime;

public record UserResponse(
    Long id,
    String email,
    String fullName,
    Role role,
    boolean active,
    LocalDateTime createdAt
) {}
