package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.AppUser;
import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.repository.AppUserRepository;
import com.fin.optiwealth_backend_sb.repository.PortfolioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PortfolioService {

    @Autowired
    private PortfolioRepository portfolioRepository;

    @Autowired
    private AppUserRepository appUserRepository;

    // Helper: get the currently logged-in user from the JWT SecurityContext
    private AppUser getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getPrincipal() == null) {
                throw new RuntimeException("No authenticated user found");
            }

            String email = auth.getName(); // email comes from JWT token
            return appUserRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));
        } catch (RuntimeException e) {
            throw new RuntimeException("Error fetching current user: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while fetching current user: " + e.getMessage(), e);
        }
    }

    public Portfolio createPortfolio(String name) {
        try {
            AppUser currentUser = getCurrentUser();

            Portfolio portfolio = Portfolio.builder()
                    .name(name)
                    .user(currentUser)
                    .build();

            return portfolioRepository.save(portfolio);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error creating portfolio: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while creating portfolio: " + e.getMessage(), e);
        }
    }

    public List<Portfolio> getUserPortfolios() {
        try {
            AppUser currentUser = getCurrentUser();
            return portfolioRepository.findByUser(currentUser);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error fetching user portfolios: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while fetching portfolios: " + e.getMessage(), e);
        }
    }

    public Portfolio getPortfolioById(Long id) {
        try {
            AppUser currentUser = getCurrentUser();
            Portfolio portfolio = portfolioRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Portfolio not found"));

            if (!portfolio.getUser().getId().equals(currentUser.getId())) {
                throw new RuntimeException("Unauthorized access to this portfolio");
            }

            return portfolio;
        } catch (RuntimeException e) {
            throw new RuntimeException("Error fetching portfolio: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while fetching portfolio: " + e.getMessage(), e);
        }
    }

    public void deletePortfolio(Long id) {
        try {
            Portfolio portfolio = getPortfolioById(id);
            portfolioRepository.delete(portfolio);
        } catch (RuntimeException e) {
            throw new RuntimeException("Error deleting portfolio: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Unexpected error while deleting portfolio: " + e.getMessage(), e);
        }
    }
}