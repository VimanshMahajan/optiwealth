package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import com.fin.optiwealth_backend_sb.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
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
            AppUser user = getCurrentUser();
            Portfolio portfolio = portfolioRepository.findById(portfolioId)
                    .orElseThrow(() -> new RuntimeException("Portfolio not found"));

            if (!portfolio.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this portfolio");
            }

            Map<String, Object> request = new HashMap<>();
            request.put("portfolioId", portfolio.getId());
            request.put("holdings", portfolio.getHoldings().stream()
                    .map(h -> Map.of(
                            "symbol", h.getSymbol(),
                            "quantity", h.getQuantity(),
                            "avgCost", h.getAvgCost()
                    ))
                    .collect(Collectors.toList()));

            return WebClient.create(pythonMicroserviceUrl)
                    .post()
                    .uri("/analyze-portfolio")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (RuntimeException e) {
            throw new RuntimeException("Error analyzing portfolio: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error occurred: " + e.getMessage(), e);
        }
    }
}