package com.ojt.java12.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddMemberRequest(
    @NotBlank(message = "Member email is required")
    @Email(message = "Must be a valid email address")
    String email
) {}
