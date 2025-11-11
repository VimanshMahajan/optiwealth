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
        // ...existing code...
    }

    @GetMapping("/{portfolioId}/check")
    public ResponseEntity<?> checkPortfolio(@PathVariable Long portfolioId) {
        try {
            log.info("Checking portfolio ID: {}", portfolioId);
            Map<String, Object> status = analyticsService.checkPortfolioStatus(portfolioId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Error checking portfolio {}: {}", portfolioId, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("portfolioId", portfolioId.toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

}
        try {
            log.info("Received request to analyze portfolio ID: {}", portfolioId);
            Map<String, Object> result = analyticsService.analyzePortfolio(portfolioId);
            log.info("Successfully analyzed portfolio ID: {}", portfolioId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            log.error("Error analyzing portfolio {}: {}", portfolioId, e.getMessage(), e);

            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("portfolioId", portfolioId.toString());
            error.put("timestamp", java.time.LocalDateTime.now().toString());

            // Determine appropriate HTTP status code based on error message
            HttpStatus status = HttpStatus.BAD_REQUEST;
            String message = e.getMessage().toLowerCase();

            if (message.contains("not found")) {
                status = HttpStatus.NOT_FOUND;
            } else if (message.contains("unauthorized") || message.contains("not own")) {
                status = HttpStatus.FORBIDDEN;
            } else if (message.contains("no holdings") || message.contains("add stocks")) {
                status = HttpStatus.BAD_REQUEST;
                error.put("suggestion", "Please add stocks to your portfolio before analyzing it.");
            } else if (message.contains("microservice")) {
                status = HttpStatus.SERVICE_UNAVAILABLE;
                error.put("suggestion", "Our analysis service is temporarily unavailable. Please try again later.");
            }

            return ResponseEntity.status(status).body(error);
        } catch (Exception e) {
            log.error("Unexpected error analyzing portfolio {}: {}", portfolioId, e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("error", "An unexpected error occurred while analyzing the portfolio");
            error.put("details", e.getMessage());
            error.put("portfolioId", portfolioId.toString());
            error.put("timestamp", java.time.LocalDateTime.now().toString());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

}
