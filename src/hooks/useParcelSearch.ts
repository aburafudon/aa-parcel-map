// =============================================================================
// hooks/useParcelSearch.ts — debounced parcel search with keyboard navigation
// =============================================================================

import { useState, useEffect, useRef, useCallback, type ChangeEvent, type KeyboardEvent } from "react";
import type { ParcelSearchResult } from "../types";
import { searchParcels } from "../services/parcel.service";

interface UseParcelSearchReturn {
    searchVal:         string;
    results:           ParcelSearchResult[];
    searching:         boolean;
    activeIdx:         number;
    selectionLockRef:  React.MutableRefObject<boolean>;
    inputRef:          React.RefObject<HTMLInputElement | null>;
    handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleKeyDown:     (e: KeyboardEvent<HTMLInputElement>, onSelect: (r: ParcelSearchResult) => void) => void;
    handleResultClick: (result: ParcelSearchResult, onSelect: (r: ParcelSearchResult) => void) => void;
    handleClear:       () => void;
    setActiveIdx:      React.Dispatch<React.SetStateAction<number>>;
    setResults:        React.Dispatch<React.SetStateAction<ParcelSearchResult[]>>;
    setSearchVal:      React.Dispatch<React.SetStateAction<string>>;
}

export function useParcelSearch(): UseParcelSearchReturn {
    const [searchVal,  setSearchVal]  = useState<string>("");
    const [results,    setResults]    = useState<ParcelSearchResult[]>([]);
    const [searching,  setSearching]  = useState<boolean>(false);
    const [activeIdx,  setActiveIdx]  = useState<number>(-1);

    const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef       = useRef<HTMLInputElement | null>(null);
    const selectionLockRef = useRef<boolean>(false);

    // ── Debounced search ────────────────────────────────────────────────────────
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (selectionLockRef.current) return;

        const term = searchVal.trim();
        if (term.length < 2) { setResults([]); return; }

        debounceRef.current = setTimeout(async () => {
            if (selectionLockRef.current) return;
            setSearching(true);
            try { setResults(await searchParcels(term)); setActiveIdx(-1); }
            catch { setResults([]); }
            finally { setSearching(false); }
        }, 300);

        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchVal]);

    // ── Handlers ────────────────────────────────────────────────────────────────

    const handleClear = useCallback((): void => {
        selectionLockRef.current = false;
        setSearchVal("");
        setResults([]);
        inputRef.current?.focus();
    }, []);

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>): void => {
        selectionLockRef.current = false;
        setSearchVal(e.target.value);
    }, []);

    const handleResultClick = useCallback(
        (result: ParcelSearchResult, onSelect: (r: ParcelSearchResult) => void): void => {
            selectionLockRef.current = true;
            setSearchVal(result.PRPACOM || result.OWNNAME1 || result.PIN);
            setResults([]);
            onSelect(result);
            setTimeout(() => { selectionLockRef.current = false; }, 1500);
        },
        [],
    );

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>, onSelect: (r: ParcelSearchResult) => void): void => {
            if (results.length === 0) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && activeIdx >= 0) {
                e.preventDefault();
                const r = results[activeIdx];
                if (r) handleResultClick(r, onSelect);
            } else if (e.key === "Escape") {
                setResults([]);
                selectionLockRef.current = false;
                inputRef.current?.blur();
            }
        },
        [results, activeIdx, handleResultClick],
    );

    return {
        searchVal, results, searching, activeIdx,
        selectionLockRef, inputRef,
        handleInputChange, handleKeyDown, handleResultClick, handleClear,
        setActiveIdx, setResults, setSearchVal,
    };
}
