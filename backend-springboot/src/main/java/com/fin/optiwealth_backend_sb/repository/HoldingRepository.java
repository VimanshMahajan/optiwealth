package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.Holding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HoldingRepository extends JpaRepository<Holding, Long> {
}
