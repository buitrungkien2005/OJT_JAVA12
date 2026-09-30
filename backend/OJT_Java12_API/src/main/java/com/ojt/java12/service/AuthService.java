package com.ojt.java12.service;

import com.ojt.java12.dto.request.LoginRequest;
import com.ojt.java12.dto.request.RegisterRequest;
import com.ojt.java12.dto.response.AuthResponse;
import com.ojt.java12.dto.response.UserResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse getCurrentUser();
}
