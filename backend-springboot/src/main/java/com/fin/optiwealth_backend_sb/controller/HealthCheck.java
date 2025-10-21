package com.fin.optiwealth_backend_sb.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthCheck {

    @GetMapping
    public ResponseEntity<String> checkHealth(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok("OptiWealth Backend is running! Logged in as: " + user.getUsername());
    }
}
