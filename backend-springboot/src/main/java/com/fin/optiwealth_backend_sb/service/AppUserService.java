package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.dto.LoginClassDto;
import com.fin.optiwealth_backend_sb.dto.UserRegistrationDto;
import com.fin.optiwealth_backend_sb.dto.UserResponseDto;
import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Registers a new user. Throws RuntimeException on duplicate email.
     */
    public UserResponseDto register(UserRegistrationDto dto) {
        try {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new RuntimeException("Email already registered");
            }

            AppUser user = AppUser.builder()
                    .username(dto.getUsername())
                    .email(dto.getEmail())
                    .passwordHash(passwordEncoder.encode(dto.getPassword()))
                    .build();

            AppUser saved = userRepository.save(user);
            return toResponseDto(saved);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error during user registration: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error during user registration: " + e.getMessage(), e);
        }
    }

    public UserResponseDto login(LoginClassDto dto) {
        try {
            AppUser user = userRepository.findByEmail(dto.getEmail())
                    .orElseThrow(() -> new RuntimeException("Invalid email or password"));

            if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
                throw new RuntimeException("Invalid email or password");
            }

            return toResponseDto(user);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error during login: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error during login: " + e.getMessage(), e);
        }
    }

    public AppUser findByIdOrThrow(Long id) {
        try {
            return userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (RuntimeException e) {
            throw new RuntimeException("Error fetching user by ID: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error fetching user by ID: " + e.getMessage(), e);
        }
    }

    private UserResponseDto toResponseDto(AppUser user) {
        UserResponseDto out = new UserResponseDto();
        out.setId(user.getId());
        out.setUsername(user.getUsername());
        out.setEmail(user.getEmail());
        return out;
    }
}