// =============================================================================
// hooks/useFavorites.ts — localStorage-backed saved parcels
// =============================================================================

import { useState, useCallback } from "react";
import type { FavoriteParcel, ParcelSearchResult } from "../types";
import { searchParcels } from "../services/parcel.service";

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "gis-favorites";

function loadFavorites(): FavoriteParcel[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as FavoriteParcel[]; }
    catch { return []; }
}

function persistFavorites(favs: FavoriteParcel[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseFavoritesReturn {
    favorites:            FavoriteParcel[];
    isFavorited:          (pin: string | undefined) => boolean;
    toggleFavorite:       (pin: string | undefined, address: string, city: string, lat: number | null, lng: number | null) => void;
    confirmPin:           string | null;
    setConfirmPin:        React.Dispatch<React.SetStateAction<string | null>>;
    confirmRemove:        (pin: string) => void;
    requestRemoveFavorite:(pin: string, e: React.MouseEvent) => void;
    handleFavoriteClick:  (fav: FavoriteParcel, onSelect: (r: ParcelSearchResult) => void, onSwitchTab: () => void) => Promise<void>;
}

export function useFavorites(): UseFavoritesReturn {
    const [favorites,  setFavorites]  = useState<FavoriteParcel[]>(loadFavorites);
    const [confirmPin, setConfirmPin] = useState<string | null>(null);

    const isFavorited = useCallback(
        (pin: string | undefined): boolean => !!pin && favorites.some((f) => f.pin === pin),
        [favorites],
    );

    const toggleFavorite = useCallback(
        (pin: string | undefined, address: string, city: string, lat: number | null, lng: number | null): void => {
            if (!pin) return;
            if (favorites.some((f) => f.pin === pin)) {
                setConfirmPin(pin);
            } else {
                setFavorites((prev) => {
                    const next = [...prev, { pin, address, city, lat, lng, savedAt: Date.now() }];
                    persistFavorites(next);
                    return next;
                });
            }
        },
        [favorites],
    );

    const confirmRemove = useCallback((pin: string): void => {
        setFavorites((prev) => {
            const next = prev.filter((f) => f.pin !== pin);
            persistFavorites(next);
            return next;
        });
        setConfirmPin(null);
    }, []);

    const requestRemoveFavorite = useCallback((pin: string, e: React.MouseEvent): void => {
        e.stopPropagation();
        setConfirmPin(pin);
    }, []);

    const handleFavoriteClick = useCallback(
        async (fav: FavoriteParcel, onSelect: (r: ParcelSearchResult) => void, onSwitchTab: () => void): Promise<void> => {
            onSwitchTab();

            if (fav.lat && fav.lng) {
                onSelect({ PIN: fav.pin, PRPACOM: fav.address, OWNNAME1: "", DDLat: fav.lat, DDLon: fav.lng });
                return;
            }

            try {
                const results = await searchParcels(fav.pin);
                const match = results.find((r) => r.PIN === fav.pin) ?? results[0];
                if (match) {
                    setFavorites((prev) => {
                        const updated = prev.map((f) =>
                            f.pin === fav.pin ? { ...f, lat: match.DDLat ?? f.lat, lng: match.DDLon ?? f.lng } : f,
                        );
                        persistFavorites(updated);
                        return updated;
                    });
                    onSelect({ PIN: match.PIN, PRPACOM: match.PRPACOM, OWNNAME1: match.OWNNAME1, DDLat: match.DDLat, DDLon: match.DDLon });
                } else {
                    onSelect({ PIN: fav.pin, PRPACOM: fav.address, OWNNAME1: "", DDLat: null, DDLon: null });
                }
            } catch {
                onSelect({ PIN: fav.pin, PRPACOM: fav.address, OWNNAME1: "", DDLat: null, DDLon: null });
            }
        },
        [],
    );

    return {
        favorites, isFavorited,
        toggleFavorite, confirmPin, setConfirmPin, confirmRemove,
        requestRemoveFavorite, handleFavoriteClick,
    };
}
