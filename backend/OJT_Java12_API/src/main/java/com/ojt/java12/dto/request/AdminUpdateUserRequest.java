package com.ojt.java12.dto.request;

import com.ojt.java12.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminUpdateUserRequest(
    @NotBlank(message = "Full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    String fullName,

    @NotNull(message = "Role is required")
    Role role,

    Boolean active
) {}
