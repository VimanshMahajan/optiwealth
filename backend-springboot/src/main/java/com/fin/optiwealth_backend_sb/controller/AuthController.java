package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.dto.LoginClassDto;
import com.fin.optiwealth_backend_sb.dto.UserRegistrationDto;
import com.fin.optiwealth_backend_sb.dto.UserResponseDto;
import com.fin.optiwealth_backend_sb.service.AppUserService;
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
        try{
            UserResponseDto created = appUserService.register(dto);
            return ResponseEntity.ok(created);
        }
        catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }

    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginClassDto dto) {
        try {
            UserResponseDto login = appUserService.login(dto);
            return ResponseEntity.ok(login);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }

    }
}
