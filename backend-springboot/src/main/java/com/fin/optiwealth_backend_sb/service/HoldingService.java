package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.entity.Holding;
import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import com.fin.optiwealth_backend_sb.repository.HoldingRepository;
import com.fin.optiwealth_backend_sb.repository.PortfolioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HoldingService {

    private final HoldingRepository holdingRepository;
    private final PortfolioRepository portfolioRepository;
    private final AppUserRepository appUserRepository;

    // --- Get the currently authenticated user ---
    private AppUser getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new RuntimeException("No authenticated user found");
        }

        return appUserRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // --- Add a new holding to a portfolio ---
    public Holding addHolding(Long portfolioId, String symbol, BigDecimal quantity, BigDecimal avgCost) {
        AppUser user = getCurrentUser();

        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));

        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this portfolio");
        }

        Holding holding = Holding.builder()
                .symbol(symbol)
                .quantity(quantity)
                .avgCost(avgCost)
                .build();

        portfolio.addHolding(holding); // sets bidirectional link
        return holdingRepository.save(holding);
    }

    // --- Get all holdings of a portfolio ---
    public List<Holding> getHoldings(Long portfolioId) {
        AppUser user = getCurrentUser();

        Portfolio portfolio = portfolioRepository.findById(portfolioId)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));

        if (!portfolio.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this portfolio");
        }

        return portfolio.getHoldings();
    }

    // --- Update an existing holding ---
    public Holding updateHolding(Long holdingId, BigDecimal quantity, BigDecimal avgCost) {
        AppUser user = getCurrentUser();

        Holding holding = holdingRepository.findById(holdingId)
                .orElseThrow(() -> new RuntimeException("Holding not found"));

        if (!holding.getPortfolio().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this portfolio");
        }

        holding.setQuantity(quantity);
        holding.setAvgCost(avgCost);

        return holdingRepository.save(holding);
    }

    // --- Delete a holding ---
    public void deleteHolding(Long holdingId) {
        AppUser user = getCurrentUser();

        Holding holding = holdingRepository.findById(holdingId)
                .orElseThrow(() -> new RuntimeException("Holding not found"));

        if (!holding.getPortfolio().getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized: You do not own this portfolio");
        }

        holding.getPortfolio().removeHolding(holding); // maintain bidirectional link
        holdingRepository.delete(holding);
    }
}
