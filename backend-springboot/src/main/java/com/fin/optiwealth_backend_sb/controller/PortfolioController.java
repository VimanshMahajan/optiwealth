package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.entity.Portfolio;
import com.fin.optiwealth_backend_sb.service.PortfolioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portfolios")
public class PortfolioController {

    @Autowired
    private PortfolioService portfolioService;

    @PostMapping
    public ResponseEntity<Portfolio> createPortfolio(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        Portfolio portfolio = portfolioService.createPortfolio(name);
        return ResponseEntity.ok(portfolio);
    }

    @GetMapping
    public ResponseEntity<List<Portfolio>> getUserPortfolios() {
        return ResponseEntity.ok(portfolioService.getUserPortfolios());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Portfolio> getPortfolioById(@PathVariable Long id) {
        return ResponseEntity.ok(portfolioService.getPortfolioById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deletePortfolio(@PathVariable Long id) {
        portfolioService.deletePortfolio(id);
        return ResponseEntity.ok("Portfolio deleted successfully");
    }
}
