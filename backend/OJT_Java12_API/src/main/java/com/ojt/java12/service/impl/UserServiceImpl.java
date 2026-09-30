package com.ojt.java12.service.impl;

import com.ojt.java12.dto.request.AdminUpdateUserRequest;
import com.ojt.java12.dto.request.ChangePasswordRequest;
import com.ojt.java12.dto.request.UpdateProfileRequest;
import com.ojt.java12.dto.response.PagedResponse;
import com.ojt.java12.dto.response.UserResponse;
import com.ojt.java12.entity.User;
import com.ojt.java12.repository.UserRepository;
import com.ojt.java12.service.UserService;
import com.ojt.java12.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtil securityUtil;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<UserResponse> getAllUsers(int page, int size, String search) {
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("id").descending());
        Page<User> usersPage = userRepository.searchUsers(search, pageable);

        return new PagedResponse<>(
                usersPage.getContent().stream().map(this::toUserResponse).toList(),
                usersPage.getNumber(),
                usersPage.getSize(),
                usersPage.getTotalElements(),
                usersPage.getTotalPages(),
                usersPage.isLast()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));
        return toUserResponse(user);
    }

    @Override
    public UserResponse updateUserAsAdmin(Long id, AdminUpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        user.setFullName(request.fullName().trim());
        user.setRole(request.role());
        if (request.active() != null) {
            user.setActive(request.active());
        }

        User updated = userRepository.save(user);
        return toUserResponse(updated);
    }

    @Override
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("User not found with id: " + id));

        String currentEmail = securityUtil.getCurrentUserEmail();
        if (user.getEmail().equalsIgnoreCase(currentEmail)) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }

        userRepository.delete(user);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getProfile() {
        String email = securityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
        return toUserResponse(user);
    }

    @Override
    public UserResponse updateProfile(UpdateProfileRequest request) {
        String email = securityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        user.setFullName(request.fullName().trim());
        User updated = userRepository.save(user);
        return toUserResponse(updated);
    }

    @Override
    public void changePassword(ChangePasswordRequest request) {
        String email = securityUtil.getCurrentUserEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
