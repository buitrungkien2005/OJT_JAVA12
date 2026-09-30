package com.ojt.java12.config;

import com.ojt.java12.entity.Role;
import com.ojt.java12.entity.User;
import com.ojt.java12.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@ojt.com}")
    private String adminEmail;

    @Value("${app.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.admin.name:System Administrator}")
    private String adminName;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .fullName(adminName)
                    .role(Role.ADMIN)
                    .active(true)
                    .build();

            userRepository.save(admin);
            log.info("Default ADMIN user seeded with email: {}", adminEmail);
        } else {
            log.info("Admin user '{}' already exists", adminEmail);
        }
    }
}
