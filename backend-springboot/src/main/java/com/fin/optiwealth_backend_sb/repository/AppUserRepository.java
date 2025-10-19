package com.fin.optiwealth_backend_sb.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AppUserRepository extends JpaRepository<com.fin.optiwealth_backend_sb.entity.AppUser, Long> {}