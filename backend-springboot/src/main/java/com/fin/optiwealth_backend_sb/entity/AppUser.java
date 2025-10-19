package com.fin.optiwealth_backend_sb.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_user", indexes = {
        @Index(columnList = "email", name = "idx_user_email", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@ToString
@EqualsAndHashCode
@Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;

    @Column(nullable = false, unique = true)
    private String email;

    /**
     * We store only the password hash. Mark it @JsonIgnore so it never
     * gets serialized in API responses.
     */
    @JsonIgnore
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // NOTE: if you later add bidirectional links, avoid exposing them here
    // to prevent infinite JSON recursion (use @JsonManagedReference / @JsonBackReference).
}