package com.fin.optiwealth_backend_sb.service;

import com.fin.optiwealth_backend_sb.entity.Symbol;
import com.fin.optiwealth_backend_sb.repository.SymbolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SymbolService {

    private final SymbolRepository symbolRepository;

    public boolean isValidSymbol(String symbol) {
        return symbol != null
                && symbolRepository.existsBySymbolAndActiveTrue(symbol.trim().toUpperCase(Locale.ROOT));
    }

    public List<String> search(String query, int limit) {
        String normalizedQuery = query == null ? "" : query.trim();
        int safeLimit = Math.min(Math.max(limit, 1), 50);
        return symbolRepository.searchActive(normalizedQuery, PageRequest.of(0, safeLimit))
                .stream()
                .map(Symbol::getSymbol)
                .toList();
    }
}
