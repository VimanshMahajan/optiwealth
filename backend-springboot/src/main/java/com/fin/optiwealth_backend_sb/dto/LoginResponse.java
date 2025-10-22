package com.fin.optiwealth_backend_sb.dto;

@lombok.Data
@lombok.AllArgsConstructor
public class LoginResponse {
    private UserResponseDto user;
    private String token;
}
