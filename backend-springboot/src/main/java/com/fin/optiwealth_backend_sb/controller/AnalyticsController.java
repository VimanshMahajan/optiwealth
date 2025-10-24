package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.repository.PortfolioRepository;
import com.fin.optiwealth_backend_sb.service.AnalyticsService;
import com.fin.optiwealth_backend_sb.service.PortfolioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;


@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @PostMapping("/{portfolioId}/analyze")
    public ResponseEntity<?> analyzePortfolio(@PathVariable Long portfolioId) {

        Map<String, Object> stringObjectMap = analyticsService.analyzePortfolio(portfolioId);
        return ResponseEntity.ok(stringObjectMap);
    }

}
