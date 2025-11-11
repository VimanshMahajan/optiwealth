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

            AppUser user = getCurrentUser();
            log.info("Current user: {}", user.getEmail());

            Portfolio portfolio = portfolioRepository.findById(portfolioId)
                    .orElseThrow(() -> new RuntimeException("Portfolio not found with ID: " + portfolioId));

            if (!portfolio.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this portfolio");
            }

            if (portfolio.getHoldings() == null || portfolio.getHoldings().isEmpty()) {
                throw new RuntimeException("Portfolio has no holdings to analyze");
            }

            log.info("Portfolio found with {} holdings", portfolio.getHoldings().size());

            Map<String, Object> request = new HashMap<>();
            request.put("portfolioId", portfolio.getId());
            request.put("holdings", portfolio.getHoldings().stream()
                    .map(h -> {
                        Map<String, Object> holding = new HashMap<>();
                        holding.put("symbol", h.getSymbol());
                        holding.put("quantity", h.getQuantity().doubleValue());
                        holding.put("avgCost", h.getAvgCost().doubleValue());
                        return holding;
                    })
                    .collect(Collectors.toList()));

            log.info("Sending request to Python microservice at: {}", pythonMicroserviceUrl);
            log.debug("Request payload: {}", request);

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
            log.error("Runtime error analyzing portfolio: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error analyzing portfolio: {}", e.getMessage(), e);
            throw new RuntimeException("Unexpected error occurred: " + e.getMessage(), e);
        }
    }
}