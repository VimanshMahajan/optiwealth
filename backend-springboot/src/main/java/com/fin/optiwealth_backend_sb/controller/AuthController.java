package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.dto.LoginClassDto;
import com.fin.optiwealth_backend_sb.dto.UserRegistrationDto;
import com.fin.optiwealth_backend_sb.dto.UserResponseDto;
import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.security.JwtService;
import com.fin.optiwealth_backend_sb.service.AppUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AppUserService appUserService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@Valid @RequestBody UserRegistrationDto dto) {
        UserResponseDto created = appUserService.register(dto);
        return ResponseEntity.ok(created);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginClassDto dto) {
        UserResponseDto user = appUserService.login(dto);
        String token = jwtService.generateToken(user.getEmail());

        return ResponseEntity.ok(new LoginResponse(user, token));
    }

    // DTO for returning token + user
    @lombok.Data
    @lombok.AllArgsConstructor
    static class LoginResponse {
        private UserResponseDto user;
        private String token;
    }
}
