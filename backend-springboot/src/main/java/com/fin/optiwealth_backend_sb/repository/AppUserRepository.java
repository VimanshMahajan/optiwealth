package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AppUserRepository extends JpaRepository<com.fin.optiwealth_backend_sb.entity.AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    boolean existsByEmail(String email);
}