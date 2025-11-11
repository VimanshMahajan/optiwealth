package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import com.fin.optiwealth_backend_sb.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    @Value("${microservice.python.url}")
    private String pythonMicroserviceUrl;

    private final AppUserRepository appUserRepository;
    private final PortfolioRepository portfolioRepository;

    private AppUser getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null) {
                throw new RuntimeException("No authenticated user found");
            }

            return appUserRepository.findByEmail(auth.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (RuntimeException e) {
            throw new RuntimeException("Error fetching current user: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> analyzePortfolio(Long portfolioId) {
        try {
            log.info("Analyzing portfolio with ID: {}", portfolioId);

            // Get current authenticated user
            AppUser user = getCurrentUser();
            log.info("Current user: {} (ID: {})", user.getEmail(), user.getId());

            // Fetch portfolio with holdings eagerly loaded
            Portfolio portfolio = portfolioRepository.findByIdWithHoldings(portfolioId)
                    .orElseThrow(() -> {
                        log.error("Portfolio not found with ID: {}", portfolioId);
                        return new RuntimeException("Portfolio not found with ID: " + portfolioId);
                    });

            log.info("Portfolio found: {} (Owner ID: {})", portfolio.getName(), portfolio.getUser().getId());

            // Check ownership
            if (!portfolio.getUser().getId().equals(user.getId())) {
                log.error("Unauthorized access attempt. User {} trying to access portfolio {} owned by {}",
                         user.getId(), portfolioId, portfolio.getUser().getId());
                throw new RuntimeException("Unauthorized: You do not own this portfolio");
            }

            // Check if portfolio has holdings
            if (portfolio.getHoldings() == null || portfolio.getHoldings().isEmpty()) {
                log.error("Portfolio {} has no holdings to analyze", portfolioId);
                throw new RuntimeException("Portfolio has no holdings to analyze. Please add stocks to your portfolio first.");
            }

            log.info("Portfolio has {} holdings", portfolio.getHoldings().size());

            // Build request payload
            Map<String, Object> request = new HashMap<>();
            request.put("portfolioId", portfolio.getId());
            request.put("holdings", portfolio.getHoldings().stream()
                    .map(h -> {
                        Map<String, Object> holding = new HashMap<>();
                        holding.put("symbol", h.getSymbol());
                        holding.put("quantity", h.getQuantity().doubleValue());
                        holding.put("avgCost", h.getAvgCost().doubleValue());
                        log.debug("Adding holding: {} x {} @ {}", h.getSymbol(), h.getQuantity(), h.getAvgCost());
                        return holding;
                    })
                    .collect(Collectors.toList()));

            log.info("Sending request to Python microservice at: {}/analyze-portfolio", pythonMicroserviceUrl);
            log.debug("Request payload: {}", request);

            // Call Python microservice
            Map<String, Object> response = WebClient.create(pythonMicroserviceUrl)
                    .post()
                    .uri("/analyze-portfolio")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            log.info("Successfully received response from Python microservice");
            return response;

        } catch (WebClientResponseException e) {
            log.error("Python microservice returned error. Status: {}, Body: {}",
                     e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Python microservice error: " + e.getResponseBodyAsString(), e);
        } catch (RuntimeException e) {
            log.error("Runtime error analyzing portfolio {}: {}", portfolioId, e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error analyzing portfolio {}: {}", portfolioId, e.getMessage(), e);
            throw new RuntimeException("Unexpected error occurred: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> checkPortfolioStatus(Long portfolioId) {
        try {
            log.info("Checking status of portfolio ID: {}", portfolioId);

            AppUser user = getCurrentUser();

            Portfolio portfolio = portfolioRepository.findByIdWithHoldings(portfolioId)
                    .orElseThrow(() -> new RuntimeException("Portfolio not found with ID: " + portfolioId));

            Map<String, Object> status = new HashMap<>();
            status.put("portfolioId", portfolio.getId());
            status.put("portfolioName", portfolio.getName());
            status.put("ownerId", portfolio.getUser().getId());
            status.put("currentUserId", user.getId());
            status.put("isOwner", portfolio.getUser().getId().equals(user.getId()));
            status.put("holdingsCount", portfolio.getHoldings() != null ? portfolio.getHoldings().size() : 0);
            status.put("canAnalyze", portfolio.getHoldings() != null && !portfolio.getHoldings().isEmpty());

            if (portfolio.getHoldings() != null && !portfolio.getHoldings().isEmpty()) {
                status.put("holdings", portfolio.getHoldings().stream()
                        .map(h -> {
                            Map<String, Object> holding = new HashMap<>();
                            holding.put("symbol", h.getSymbol());
                            holding.put("quantity", h.getQuantity());
                            holding.put("avgCost", h.getAvgCost());
                            return holding;
                        })
                        .collect(Collectors.toList()));
            }

            return status;
        } catch (Exception e) {
            log.error("Error checking portfolio status: {}", e.getMessage(), e);
            throw new RuntimeException("Error checking portfolio: " + e.getMessage(), e);
        }
    }
}