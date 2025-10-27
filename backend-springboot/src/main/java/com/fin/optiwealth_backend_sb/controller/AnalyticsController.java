package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/{portfolioId}/analyze")
    public ResponseEntity<?> analyzePortfolio(@PathVariable Long portfolioId) {

        Map<String, Object> stringObjectMap = analyticsService.analyzePortfolio(portfolioId);
        return ResponseEntity.ok(stringObjectMap);
    }

}
