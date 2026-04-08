// =============================================================================
// components/sidebar/FavoritesList.tsx — saved parcels tab content
// =============================================================================

import type { FC } from "react";
import { MapPin, Heart, X } from "lucide-react";
import type { FavoriteParcel } from "../../types";

interface Props {
    favorites:           FavoriteParcel[];
    onSelect:            (fav: FavoriteParcel) => void;
    onRequestRemove:     (pin: string, e: React.MouseEvent) => void;
}

const FavoritesList: FC<Props> = ({ favorites, onSelect, onRequestRemove }) => {
    if (favorites.length === 0) {
        return (
            <div className="sidebar-idle">
                <Heart size={36} className="sidebar-idle-icon" aria-hidden="true" />
                <p className="sidebar-idle-title">No saved parcels</p>
                <p className="sidebar-idle-hint">Tap the heart on any parcel to save it here.</p>
            </div>
        );
    }

    return (
        <>
            {favorites.map((fav) => (
                <button
                    key={fav.pin}
                    className="result-card fav-card"
                    onClick={() => onSelect(fav)}
                    aria-label={`Load saved parcel ${fav.address}`}
                >
                    <MapPin size={14} className="result-card-icon" aria-hidden="true" />
                    <span className="result-card-body">
                        <span className="result-card-addr">{fav.address}</span>
                        <span className="result-card-meta">
                            <span className="result-card-owner">{fav.city}</span>
                            <span className="result-card-pin">{fav.pin}</span>
                        </span>
                    </span>
                    <button
                        className="fav-remove-btn"
                        onClick={(e) => onRequestRemove(fav.pin, e)}
                        aria-label={`Remove ${fav.address} from saved`}
                    >
                        <X size={11} aria-hidden="true" />
                    </button>
                </button>
            ))}
        </>
    );
};

export default FavoritesList;
