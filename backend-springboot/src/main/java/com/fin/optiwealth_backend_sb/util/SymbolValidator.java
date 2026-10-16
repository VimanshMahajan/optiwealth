package com.fin.optiwealth_backend_sb.util;

import com.fin.optiwealth_backend_sb.service.SymbolService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SymbolValidator {

    private final SymbolService symbolService;

    public boolean isValidSymbol(String symbol) {
        return symbolService.isValidSymbol(symbol);
    }
}
