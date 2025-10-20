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
    }

    public UserResponseDto login(LoginClassDto dto) {
        AppUser user = userRepository.findByEmail(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(dto.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        return toResponseDto(user);
    }

    public AppUser findByIdOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserResponseDto toResponseDto(AppUser user) {
        UserResponseDto out = new UserResponseDto();
        out.setId(user.getId());
        out.setUsername(user.getUsername());
        out.setEmail(user.getEmail());
        return out;
    }


}
