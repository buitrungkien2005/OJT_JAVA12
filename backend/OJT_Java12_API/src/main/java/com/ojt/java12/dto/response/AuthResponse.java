package com.ojt.java12.dto.response;

public record AuthResponse(
    String token,
    UserResponse user
) {}
