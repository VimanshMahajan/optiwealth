package com.fin.optiwealth_backend_sb.util;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.HashSet;
import java.util.Set;

@Component
public class SymbolValidator {

    private final Set<String> validSymbols = new HashSet<>();

    @PostConstruct
    public void init() {
        try {
            // Read valid symbols from a CSV (put it under src/main/resources)
            try (BufferedReader br = new BufferedReader(new InputStreamReader(
                    getClass().getResourceAsStream("/valid_symbols.csv")))) {
                br.lines()
                        .filter(line -> !line.trim().isEmpty())
                        .map(String::toUpperCase)
                        .forEach(validSymbols::add);
            }
            System.out.println("Loaded " + validSymbols.size() + " valid stock symbols.");
        } catch (Exception e) {
            System.err.println("Failed to load valid symbols: " + e.getMessage());
        }
    }

    public boolean isValidSymbol(String symbol) {
        return validSymbols.contains(symbol.toUpperCase());
    }
}
