package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {
    List<Portfolio> findByUser(AppUser user);
}
