package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.entity.Holding;
import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import com.fin.optiwealth_backend_sb.repository.HoldingRepository;
import com.fin.optiwealth_backend_sb.repository.PortfolioRepository;
import com.fin.optiwealth_backend_sb.util.SymbolValidator;
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
    private final SymbolValidator symbolValidator;
    // --- Get the currently authenticated user ---
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

    // --- Add a new holding to a portfolio ---
    public Holding addHolding(Long portfolioId, String symbol, BigDecimal quantity, BigDecimal avgCost) {
        try {
            AppUser user = getCurrentUser();

            if(!symbolValidator.isValidSymbol(symbol)) {
                throw new RuntimeException("Invalid stock symbol: " + symbol);
            }

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
        } catch (RuntimeException e) {
            throw new RuntimeException("Error adding holding: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error occurred while adding holding: " + e.getMessage(), e);
        }
    }

    // --- Get all holdings of a portfolio ---
    public List<Holding> getHoldings(Long portfolioId) {
        try {
            AppUser user = getCurrentUser();

            Portfolio portfolio = portfolioRepository.findById(portfolioId)
                    .orElseThrow(() -> new RuntimeException("Portfolio not found"));

            if (!portfolio.getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this portfolio");
            }

            return portfolio.getHoldings();
        } catch (RuntimeException e) {
            throw new RuntimeException("Error fetching holdings: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error occurred while fetching holdings: " + e.getMessage(), e);
        }
    }

    // --- Update an existing holding ---
    public Holding updateHolding(Long holdingId, BigDecimal quantity, BigDecimal avgCost) {
        try {
            AppUser user = getCurrentUser();

            Holding holding = holdingRepository.findById(holdingId)
                    .orElseThrow(() -> new RuntimeException("Holding not found"));

            if (!holding.getPortfolio().getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this portfolio");
            }

            holding.setQuantity(quantity);
            holding.setAvgCost(avgCost);

            return holdingRepository.save(holding);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error updating holding: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error occurred while updating holding: " + e.getMessage(), e);
        }
    }

    // --- Delete a holding ---
    public void deleteHolding(Long holdingId) {
        try {
            AppUser user = getCurrentUser();

            Holding holding = holdingRepository.findById(holdingId)
                    .orElseThrow(() -> new RuntimeException("Holding not found"));

            if (!holding.getPortfolio().getUser().getId().equals(user.getId())) {
                throw new RuntimeException("Unauthorized: You do not own this portfolio");
            }

            holding.getPortfolio().removeHolding(holding); // maintain bidirectional link
            holdingRepository.delete(holding);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error deleting holding: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error occurred while deleting holding: " + e.getMessage(), e);
        }
    }
}