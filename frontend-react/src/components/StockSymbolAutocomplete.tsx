import React, { useState, useEffect, useRef } from 'react';
import './StockSymbolAutocomplete.css';

interface StockSymbolAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    validSymbols: string[];
    placeholder?: string;
}

const StockSymbolAutocomplete: React.FC<StockSymbolAutocompleteProps> = ({
    value,
    onChange,
    validSymbols,
    placeholder = "Search stock symbol..."
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredSymbols, setFilteredSymbols] = useState<string[]>([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value.trim() === '') {
            setFilteredSymbols([]);
            setIsOpen(false);
        } else {
            const searchTerm = value.toUpperCase();
            const filtered = validSymbols
                .filter(symbol => symbol.toUpperCase().includes(searchTerm))
                .slice(0, 50); // Limit to 50 results for performance
            setFilteredSymbols(filtered);
            setIsOpen(filtered.length > 0);
        }
        setHighlightedIndex(-1);
    }, [value, validSymbols]);

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
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                autoComplete="off"
                required
            />
            {isOpen && filteredSymbols.length > 0 && (
                <div ref={dropdownRef} className="autocomplete-dropdown">
                    <div className="autocomplete-info">
                        {filteredSymbols.length} symbol{filteredSymbols.length !== 1 ? 's' : ''} found
                        {filteredSymbols.length === 50 && ' (showing first 50)'}
                    </div>
                    <div className="autocomplete-list">
                        {filteredSymbols.map((symbol, index) => (
                            <div
                                key={symbol}
                                className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                                onClick={() => handleSelectSymbol(symbol)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            >
                                <span className="symbol-text">{symbol}</span>
                                <span className="symbol-badge">NSE</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockSymbolAutocomplete;

