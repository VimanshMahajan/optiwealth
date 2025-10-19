package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.dto.UserRegistrationDto;
import com.fin.optiwealth_backend_sb.dto.UserResponseDto;
import com.fin.optiwealth_backend_sb.service.AppUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AppUserService appUserService;

    @PostMapping("/register")
    public ResponseEntity<UserResponseDto> register(@Valid @RequestBody UserRegistrationDto dto) {
        UserResponseDto created = appUserService.register(dto);
        return ResponseEntity.ok(created);
    }
}
