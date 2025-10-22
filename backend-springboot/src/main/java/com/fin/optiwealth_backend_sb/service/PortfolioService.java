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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new RuntimeException("No authenticated user found");
        }

        String email = auth.getName(); // email comes from JWT token
        return appUserRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public Portfolio createPortfolio(String name) {
        AppUser currentUser = getCurrentUser();

        Portfolio portfolio = Portfolio.builder()
                .name(name)
                .user(currentUser)
                .build();

        return portfolioRepository.save(portfolio);
    }

    public List<Portfolio> getUserPortfolios() {
        AppUser currentUser = getCurrentUser();
        return portfolioRepository.findByUser(currentUser);
    }

    public Portfolio getPortfolioById(Long id) {
        AppUser currentUser = getCurrentUser();
        Portfolio portfolio = portfolioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Portfolio not found"));

        if (!portfolio.getUser().getId().equals(currentUser.getId())) {
            throw new RuntimeException("Unauthorized access to this portfolio");
        }

        return portfolio;
    }

    public void deletePortfolio(Long id) {
        Portfolio portfolio = getPortfolioById(id);
        portfolioRepository.delete(portfolio);
    }
}
