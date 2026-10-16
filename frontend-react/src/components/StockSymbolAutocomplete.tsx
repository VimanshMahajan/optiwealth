import React, { useState, useEffect, useRef } from 'react';
import { searchSymbols } from '../services/api';
import './StockSymbolAutocomplete.css';

interface StockSymbolAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const StockSymbolAutocomplete: React.FC<StockSymbolAutocompleteProps> = ({
    value,
    onChange,
    placeholder = "Search stock symbol..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value.trim().length < 1) {
            setFilteredSymbols([]);
            setIsOpen(false);
            return;
        }

        const timeout = window.setTimeout(async () => {
            try {
                const symbols = await searchSymbols(value.trim());
                setFilteredSymbols(symbols);
                setIsOpen(symbols.length > 0);
                setHighlightedIndex(-1);
            } catch (error) {
                console.error("Error searching symbols:", error);
                setFilteredSymbols([]);
                setIsOpen(false);
            }
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleSelectSymbol = (symbol: string) => {
        // Always use the exact symbol from the list (case-sensitive)
        onChange(symbol);
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredSymbols.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < filteredSymbols.length) {
                    handleSelectSymbol(filteredSymbols[highlightedIndex]);
                }
                break;
            case 'Escape':
                setIsOpen(false);
                break;
        }
    };

    const handleInputFocus = () => {
        if (value.trim() !== '' && filteredSymbols.length > 0) {
            setIsOpen(true);
        }
    };

    return (
        <div className="autocomplete-container">
            <input
                ref={inputRef}
                type="text"
                className="form-input"
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="symbol-search-results"
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                autoComplete="off"
                required
            />
            {isOpen && filteredSymbols.length > 0 && (
                <div ref={dropdownRef} id="symbol-search-results" className="autocomplete-dropdown" role="listbox">
                    <div className="autocomplete-info">
                        {filteredSymbols.length} symbol{filteredSymbols.length !== 1 ? 's' : ''} found
                        {filteredSymbols.length === 50 && ' (showing first 50)'}
                    </div>
                    <div className="autocomplete-list">
                        {filteredSymbols.map((symbol, index) => (
                            <button
                                key={symbol}
                                type="button"
                                role="option"
                                aria-selected={index === highlightedIndex}
                                className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                                onClick={() => handleSelectSymbol(symbol)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <span className="symbol-text">{symbol}</span>
                                <span className="symbol-badge">NSE</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockSymbolAutocomplete;
