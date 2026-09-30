package com.ojt.java12.service;

import com.ojt.java12.dto.request.AdminUpdateUserRequest;
import com.ojt.java12.dto.request.ChangePasswordRequest;
import com.ojt.java12.dto.request.UpdateProfileRequest;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.dto.response.UserResponse;

public interface UserService {

    PagedResponse<UserResponse> getAllUsers(int page, int size, String search);

    UserResponse getUserById(Long id);

    UserResponse updateUserAsAdmin(Long id, AdminUpdateUserRequest request);

    void deleteUser(Long id);

    UserResponse getProfile();

    UserResponse updateProfile(UpdateProfileRequest request);

    void changePassword(ChangePasswordRequest request);
}
