package com.fin.optiwealth_backend_sb.entity;


import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.time.ZonedDateTime;

@Entity
@Table(name = "top_picks")
@Data
@NoArgsConstructor
@RequiredArgsConstructor
public class TopPick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String symbol;
    private String companyName;
    private String sector;
    private String period;
    private Double lastPrice;
    private Double expectedTarget;
    private Double returnPercent;
    private Double score;

    @Column(columnDefinition = "TEXT")
    private String rationale;

    private ZonedDateTime updatedAt;
    private ZonedDateTime createdAt;


}
