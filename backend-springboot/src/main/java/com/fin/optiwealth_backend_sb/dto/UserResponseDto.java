package com.fin.optiwealth_backend_sb.dto;


import jakarta.persistence.Entity;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode
public class UserResponseDto {
    private Long id;
    private String username;
    private String email;
}
