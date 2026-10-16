package com.fin.optiwealth_backend_sb.controller;

import com.fin.optiwealth_backend_sb.service.SymbolService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/symbols")
@RequiredArgsConstructor
public class SymbolController {

    private final SymbolService symbolService;

    @GetMapping
    public ResponseEntity<List<String>> search(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(symbolService.search(query, limit));
    }
}
