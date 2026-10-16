package com.fin.optiwealth_backend_sb.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Entity
@Table(name = "symbols")
@Data
@NoArgsConstructor
public class Symbol {

    @Id
    @Column(name = "symbol", length = 30)
    private String symbol;

    @Column(name = "company_name")
    private String companyName;

    @Column(name = "exchange", nullable = false, length = 20)
    private String exchange;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "updated_at", nullable = false)
    private ZonedDateTime updatedAt;
}
