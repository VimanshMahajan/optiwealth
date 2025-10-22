package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.service.MarketDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/market")
public class MarketDataController {

    private final MarketDataService marketDataService;

    @GetMapping("/price/{symbol}")
    public ResponseEntity<?> getLivePrice(@PathVariable String symbol) {
        return ResponseEntity.ok(marketDataService.getLivePrice(symbol));
    }
}
