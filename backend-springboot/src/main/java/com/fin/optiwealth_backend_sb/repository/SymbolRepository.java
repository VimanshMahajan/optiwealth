package com.fin.optiwealth_backend_sb.repository;

import com.fin.optiwealth_backend_sb.entity.Symbol;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface SymbolRepository extends JpaRepository<Symbol, String> {

    @Query("""
        SELECT s FROM Symbol s
        WHERE s.active = true
          AND UPPER(s.symbol) LIKE CONCAT('%', UPPER(:query), '%')
        ORDER BY s.symbol
        """)
    List<Symbol> searchActive(@Param("query") String query, Pageable pageable);

    boolean existsBySymbolAndActiveTrue(String symbol);
}
