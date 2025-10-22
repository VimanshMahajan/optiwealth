package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.entity.Holding;
import com.fin.optiwealth_backend_sb.service.HoldingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class HoldingController {

    private final HoldingService holdingService;

    // --- Add a holding to a portfolio ---
    @PostMapping("/portfolios/{portfolioId}/holdings")
    public ResponseEntity<Holding> addHolding(
            @PathVariable Long portfolioId,
            @RequestBody Map<String, String> request
    ) {
        String symbol = request.get("symbol");
        BigDecimal quantity = new BigDecimal(request.get("quantity"));
        BigDecimal avgCost = new BigDecimal(request.get("avgCost"));

        Holding holding = holdingService.addHolding(portfolioId, symbol, quantity, avgCost);
        return ResponseEntity.ok(holding);
    }

    // --- Get all holdings in a portfolio ---
    @GetMapping("/portfolios/{portfolioId}/holdings")
    public ResponseEntity<List<Holding>> getHoldings(@PathVariable Long portfolioId) {
        List<Holding> holdings = holdingService.getHoldings(portfolioId);
        return ResponseEntity.ok(holdings);
    }

    // --- Update a holding ---
    @PutMapping("/holdings/{holdingId}")
    public ResponseEntity<Holding> updateHolding(
            @PathVariable Long holdingId,
            @RequestBody Map<String, String> request
    ) {
        BigDecimal quantity = new BigDecimal(request.get("quantity"));
        BigDecimal avgCost = new BigDecimal(request.get("avgCost"));

        Holding updated = holdingService.updateHolding(holdingId, quantity, avgCost);
        return ResponseEntity.ok(updated);
    }

    // --- Delete a holding ---
    @DeleteMapping("/holdings/{holdingId}")
    public ResponseEntity<String> deleteHolding(@PathVariable Long holdingId) {
        holdingService.deleteHolding(holdingId);
        return ResponseEntity.ok("Holding deleted successfully");
    }
}
