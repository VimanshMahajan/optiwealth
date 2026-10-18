package com.fin.optiwealth_backend_sb.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthCheck {

    @GetMapping
    public ResponseEntity<String> checkHealth() {
        return ResponseEntity.ok("OptiWealth Backend is running!");
    }
}
