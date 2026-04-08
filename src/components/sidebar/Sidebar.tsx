// =============================================================================
// components/sidebar/Sidebar.tsx — orchestrator component
// =============================================================================

import { useState, useEffect, type FC } from "react";
import { Search, Map, Loader2 } from "lucide-react";
import type { NormalisedParcel, ParcelSearchResult } from "../../types";
import { useParcelSearch } from "../../hooks/useParcelSearch";
import { useFavorites } from "../../hooks/useFavorites";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import SearchResults from "./SearchResults";
import FavoritesList from "./FavoritesList";
import PropertyDetail from "./PropertyDetail";

// ─── Types ────────────────────────────────────────────────────────────────────

type SidebarView = "idle" | "results" | "detail" | "loading";
type ActiveTab   = "search" | "favorites";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    property:    NormalisedParcel | null;
    loading:     boolean;
    onPinSelect: (result: ParcelSearchResult) => void;
    rawProps?:   Record<string, unknown>;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Sidebar: FC<Props> = ({ property, loading, onPinSelect, rawProps }) => {
    const [activeTab,  setActiveTab]  = useState<ActiveTab>("search");
    const [openIndex,  setOpenIndex]  = useState<number | null>(null);

    const {
        searchVal, results, searching, activeIdx,
        selectionLockRef, inputRef,
        handleInputChange, handleKeyDown, handleResultClick,
        handleClear, setActiveIdx, setResults, setSearchVal,
    } = useParcelSearch();

    const {
        favorites, isFavorited, toggleFavorite,
        confirmPin, setConfirmPin, confirmRemove,
        requestRemoveFavorite, handleFavoriteClick,
    } = useFavorites();

    useEffect(() => { setOpenIndex(null); }, [property]);

    // ── Derived state ────────────────────────────────────────────────────────
    const view: SidebarView =
        loading ? "loading"
            : !selectionLockRef.current && results.length > 0 && searchVal.trim().length >= 2 ? "results"
                : property ? "detail"
                    : "idle";

    const currentPin = (property?.rawProps as Record<string, unknown>)?.PIN as string | undefined
        ?? rawProps?.PIN as string | undefined;
    const currentLat = (property?.rawProps as Record<string, unknown>)?.DDLat as number | null | undefined ?? null;
    const currentLng = (property?.rawProps as Record<string, unknown>)?.DDLon as number | null | undefined ?? null;

    // ── Handlers ─────────────────────────────────────────────────────────────

    const onResultSelect = (result: ParcelSearchResult): void => {
        handleResultClick(result, onPinSelect);
    };

    const onFavoriteSelect = async (fav: typeof favorites[0]): Promise<void> => {
        selectionLockRef.current = true;
        setSearchVal(fav.address);
        setResults([]);
        await handleFavoriteClick(fav, onPinSelect, () => setActiveTab("search"));
        setTimeout(() => { selectionLockRef.current = false; }, 1500);
    };

    const onToggleFavorite = (): void => {
        if (!property) return;
        toggleFavorite(currentPin, property.address, property.city, currentLat, currentLng);
    };

    const onAccordionToggle = (i: number): void => {
        setOpenIndex((p) => (p === i ? null : i));
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <aside className="sidebar" role="complementary" aria-label="Property information panel">

            {/* Delete confirmation overlay */}
            {confirmPin && (() => {
                const fav = favorites.find((f) => f.pin === confirmPin)
                    ?? (isFavorited(currentPin) && currentPin === confirmPin
                        ? { address: property?.address ?? confirmPin }
                        : null);
                return fav ? (
                    <DeleteConfirmDialog
                        address={(fav as typeof favorites[0]).address ?? confirmPin}
                        onConfirm={() => confirmRemove(confirmPin)}
                        onCancel={() => setConfirmPin(null)}
                    />
                ) : null;
            })()}

            {/* Tab bar */}
            <div className="sidebar-tabs" role="tablist">
                <button role="tab" aria-selected={activeTab === "search"}
                        className={`sidebar-tab${activeTab === "search" ? " sidebar-tab--active" : ""}`}
                        onClick={() => setActiveTab("search")}>
                    <Search size={13} aria-hidden="true" /> Search
                </button>
                <button role="tab" aria-selected={activeTab === "favorites"}
                        className={`sidebar-tab${activeTab === "favorites" ? " sidebar-tab--active" : ""}`}
                        onClick={() => setActiveTab("favorites")}>
                    Saved
                    {favorites.length > 0 && (
                        <span className="tab-badge" aria-label={`${favorites.length} saved`}>{favorites.length}</span>
                    )}
                </button>
            </div>

            {/* Favorites tab */}
            {activeTab === "favorites" && (
                <div className="fav-panel gis-scroll" role="tabpanel" aria-label="Saved parcels">
                    <FavoritesList
                        favorites={favorites}
                        onSelect={onFavoriteSelect}
                        onRequestRemove={requestRemoveFavorite}
                    />
                </div>
            )}

            {/* Search tab */}
            {activeTab === "search" && (
                <>
                    {/* Search bar */}
                    <div className="sidebar-search" role="search">
                        <span className="sidebar-search-icon" aria-hidden="true">
                            {searching ? <Loader2 size={15} className="spin-icon" /> : <Search size={15} />}
                        </span>
                        <input
                            ref={inputRef}
                            id="parcel-search"
                            className="sidebar-search-input"
                            type="search"
                            placeholder="Address, owner, or PIN…"
                            value={searchVal}
                            autoComplete="off"
                            aria-label="Search Ann Arbor parcels"
                            aria-autocomplete="list"
                            aria-controls="search-results"
                            aria-expanded={view === "results"}
                            aria-busy={searching}
                            onChange={handleInputChange}
                            onKeyDown={(e) => handleKeyDown(e, onPinSelect)}
                        />
                        {searchVal && (
                            <button className="sidebar-search-clear" onClick={handleClear} aria-label="Clear search">
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    {view === "results" && (
                        <SearchResults
                            results={results}
                            activeIdx={activeIdx}
                            onSelect={onResultSelect}
                            onHover={setActiveIdx}
                        />
                    )}

                    {/* Loading */}
                    {view === "loading" && (
                        <div className="sidebar-body" role="status" aria-live="polite">
                            <div className="loading-hint">
                                <Loader2 size={16} className="spin-icon" aria-hidden="true" />
                                <span>Fetching parcel data…</span>
                            </div>
                        </div>
                    )}

                    {/* Detail */}
                    {view === "detail" && property && (
                        <PropertyDetail
                            property={property}
                            isFavorited={isFavorited(currentPin)}
                            onToggleFavorite={onToggleFavorite}
                            openIndex={openIndex}
                            onAccordionToggle={onAccordionToggle}
                        />
                    )}

                    {/* Idle */}
                    {view === "idle" && (
                        <div className="sidebar-idle">
                            <Map size={40} className="sidebar-idle-icon" aria-hidden="true" />
                            <p className="sidebar-idle-title">Search or click a parcel</p>
                            <p className="sidebar-idle-hint">Type an address, owner, or PIN, or click the map.</p>
                        </div>
                    )}
                </>
            )}
        </aside>
    );
};

export default Sidebar;
