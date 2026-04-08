// =============================================================================
// components/sidebar/ParcelThumbnail.tsx — satellite thumbnail or map fallback
// =============================================================================

import { useState, type FC } from "react";

interface Props {
    lat: number | null;
    lng: number | null;
}

/**
 * Uses Google Static Maps to render a satellite-view thumbnail.
 * No API key required at low zoom/resolution for basic use.
 * Falls back to an SVG map illustration when lat/lng are unavailable.
 */
const ParcelThumbnail: FC<Props> = ({ lat, lng }) => {
    const [imgError, setImgError] = useState(false);

    if (!lat || !lng || imgError) {
        return (
            <div className="parcel-placeholder" aria-hidden="true">
                <svg viewBox="0 0 320 130" xmlns="http://www.w3.org/2000/svg" className="placeholder-svg">
                    <rect width="320" height="130" fill="#1a1a2e"/>
                    <rect x="240" y="0"   width="80"  height="55"  fill="#1e2a1e"/>
                    <rect x="0"   y="80"  width="50"  height="50"  fill="#1e2a1e"/>
                    <rect x="0"   y="0"   width="55"  height="44"  fill="#252538" rx="1"/>
                    <rect x="65"  y="0"   width="75"  height="44"  fill="#252538" rx="1"/>
                    <rect x="150" y="0"   width="82"  height="44"  fill="#252538" rx="1"/>
                    <rect x="60"  y="55"  width="62"  height="70"  fill="#252538" rx="1"/>
                    <rect x="132" y="55"  width="90"  height="40"  fill="#252538" rx="1"/>
                    <rect x="132" y="103" width="90"  height="27"  fill="#252538" rx="1"/>
                    <rect x="232" y="55"  width="88"  height="75"  fill="#252538" rx="1"/>
                    <rect x="0"   y="45"  width="320" height="10"  fill="#2d2d3d"/>
                    <rect x="56"  y="0"   width="8"   height="130" fill="#2d2d3d"/>
                    <rect x="140" y="45"  width="8"   height="85"  fill="#2d2d3d"/>
                    <rect x="228" y="0"   width="7"   height="130" fill="#2d2d3d"/>
                    <rect x="56"  y="96"  width="172" height="7"   fill="#2d2d3d"/>
                    <line x1="0" y1="50" x2="320" y2="50" stroke="#3a3a52" strokeWidth="0.8" strokeDasharray="8 6"/>
                    <line x1="60" y1="0" x2="60"  y2="45" stroke="#3a3a52" strokeWidth="0.6" strokeDasharray="6 5"/>
                    <rect x="62"  y="56"  width="60"  height="38"  fill="#f97316" fillOpacity="0.18" rx="2"/>
                    <rect x="62"  y="56"  width="60"  height="38"  fill="none"    stroke="#f97316" strokeWidth="2" rx="2"/>
                    <circle cx="92" cy="78" r="9"   fill="#f97316"/>
                    <circle cx="92" cy="78" r="4.5" fill="white"/>
                    <text x="12"  y="42"  fontSize="5" fill="#9999bb" fontFamily="sans-serif">MAIN ST</text>
                    <text x="68"  y="42"  fontSize="5" fill="#9999bb" fontFamily="sans-serif">ELM AVE</text>
                    <text x="160" y="42"  fontSize="5" fill="#9999bb" fontFamily="sans-serif">MAPLE DR</text>
                </svg>
            </div>
        );
    }

    const url = `https://maps.googleapis.com/maps/api/staticmap`
        + `?center=${lat},${lng}`
        + `&zoom=17&size=320x130&scale=2`
        + `&maptype=satellite`
        + `&markers=color:orange%7C${lat},${lng}`
        + `&style=feature:all|element:labels|visibility:off`;

    return (
        <img
            src={url}
            alt="Satellite view of parcel"
            className="parcel-sat-img"
            onError={() => setImgError(true)}
            loading="lazy"
        />
    );
};

export default ParcelThumbnail;
