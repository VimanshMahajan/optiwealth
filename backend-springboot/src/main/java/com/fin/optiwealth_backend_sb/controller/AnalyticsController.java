package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;


@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/{portfolioId}/analyze")
    public ResponseEntity<?> analyzePortfolio(@PathVariable Long portfolioId) {
        try {
            log.info("Received request to analyze portfolio ID: {}", portfolioId);
            Map<String, Object> result = analyticsService.analyzePortfolio(portfolioId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Error analyzing portfolio {}: {}", portfolioId, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("portfolioId", portfolioId.toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Unexpected error analyzing portfolio {}: {}", portfolioId, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "An unexpected error occurred: " + e.getMessage());
            error.put("portfolioId", portfolioId.toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

}
