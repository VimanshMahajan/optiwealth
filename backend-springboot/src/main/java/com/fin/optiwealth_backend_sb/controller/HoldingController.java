package com.fin.optiwealth_backend_sb.controller;
import com.fin.optiwealth_backend_sb.entity.Holding;
import com.fin.optiwealth_backend_sb.service.HoldingService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/holdings")
public class HoldingController {

    @Autowired
    private HoldingService holdingService;

    @GetMapping
    public List<Holding> getAllHoldings() {
        return holdingService.getAllHoldings();
    }

    @PostMapping
    public Holding createHolding(@RequestBody Holding holding) {
        return holdingService.saveHolding(holding);
    }

    @GetMapping("/{id}")
    public Holding getHoldingById(@PathVariable Long id) {
        return holdingService.getHoldingById(id);
    }

    @DeleteMapping("/{id}")
    public void deleteHolding(@PathVariable Long id) {
        holdingService.deleteHolding(id);
    }
}
