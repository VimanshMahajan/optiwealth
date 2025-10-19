package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.Portfolio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioRepository extends JpaRepository<Portfolio, Long> {}
