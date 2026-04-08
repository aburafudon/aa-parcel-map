// =============================================================================
// components/sidebar/SearchResults.tsx — search results listbox panel
// =============================================================================

import type { FC } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import type { ParcelSearchResult } from "../../types";

interface Props {
    results:     ParcelSearchResult[];
    activeIdx:   number;
    onSelect:    (result: ParcelSearchResult) => void;
    onHover:     (idx: number) => void;
}

const SearchResults: FC<Props> = ({ results, activeIdx, onSelect, onHover }) => (
    <div id="search-results" className="results-panel gis-scroll"
         role="listbox" aria-label="Search results">
        <p className="results-eyebrow" aria-live="polite" aria-atomic="true">
            {results.length} result{results.length !== 1 ? "s" : ""}
        </p>
        {results.map((r, i) => (
            <button
                key={r.PIN}
                role="option"
                aria-selected={i === activeIdx}
                className={`result-card${i === activeIdx ? " result-card--active" : ""}`}
                onClick={() => onSelect(r)}
                onMouseEnter={() => onHover(i)}
            >
                <MapPin size={15} className="result-card-icon" aria-hidden="true" />
                <span className="result-card-body">
                    <span className="result-card-addr">{r.PRPACOM || "—"}</span>
                    <span className="result-card-meta">
                        {r.OWNNAME1 && <span className="result-card-owner">{r.OWNNAME1}</span>}
                        <span className="result-card-pin">{r.PIN}</span>
                    </span>
                </span>
                <ChevronRight size={14} className="result-card-chevron" aria-hidden="true" />
            </button>
        ))}
    </div>
);

export default SearchResults;
