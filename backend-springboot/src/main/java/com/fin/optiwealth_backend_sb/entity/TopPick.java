package com.fin.optiwealth_backend_sb.entity;


import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.ZonedDateTime;

@Entity
@Table(name = "top_picks")
@Data
@NoArgsConstructor
public class TopPick {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "symbol")
    private String symbol;

    @Column(name = "company_name")
    @JsonProperty("companyName")
    private String companyName;

    @Column(name = "sector")
    private String sector;

    @Column(name = "period")
    private String period;

    @Column(name = "last_price")
    @JsonProperty("lastPrice")
    private Double lastPrice;

    @Column(name = "expected_target")
    @JsonProperty("expectedTarget")
    private Double expectedTarget;

    @Column(name = "return_percent")
    @JsonProperty("returnPercent")
    private Double returnPercent;

    @Column(name = "score")
    private Double score;

    @Column(name = "rationale", columnDefinition = "TEXT")
    private String rationale;

    @Column(name = "updated_at")
    @JsonProperty("lastUpdated")
    private ZonedDateTime updatedAt;

    @Column(name = "created_at")
    @JsonProperty("createdAt")
    private ZonedDateTime createdAt;


}
