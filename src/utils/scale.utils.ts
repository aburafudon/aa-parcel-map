// =============================================================================
// utils/scale.utils.ts — Leaflet-compatible map scale computation
// =============================================================================

export interface ScaleLabel {
    label: string;   // e.g. "200 FT" or "0.1 MI"
    px:   number;    // pixel width the scale line should be (default anchor: 60px)
}

/**
 * Compute the scale line label for the coords bar.
 *
 * Strategy: pick the "nice" distance closest to `targetPx` pixels at the
 * given zoom + latitude, bias toward feet for short spans, miles for long.
 *
 * @param zoom   Current Leaflet zoom level
 * @param latDeg Center latitude in decimal degrees
 * @param targetPx Desired pixel width of the scale bar (default 60)
 */
export function computeScale(
    zoom:     number,
    latDeg:   number,
    targetPx = 60,
): ScaleLabel {
    // Meters per pixel at the equator × cos(lat) correction
    const metersPerPx =
        (40_075_016.686 / (256 * Math.pow(2, zoom))) *
        Math.cos((latDeg * Math.PI) / 180);

    const totalMeters = metersPerPx * targetPx;
    const totalFeet   = totalMeters * 3.28084;

    // Pick the "nice" round distance closest to totalFeet
    const nicesFt = [1, 2, 5, 10, 20, 30, 50, 100, 150, 200, 300, 500, 1000, 2000, 2640, 5280];
    const nicesMi = [0.1, 0.25, 0.5, 1, 2, 5, 10];

    if (totalFeet < 5280) {
        // Use feet
        const nice = nicesFt.reduce((best, v) =>
            Math.abs(v - totalFeet) < Math.abs(best - totalFeet) ? v : best,
        );
        const px = Math.round((nice / totalFeet) * targetPx);
        const label = nice >= 1000 ? `${(nice / 5280).toFixed(2)} MI` : `${nice} FT`;
        return { label, px };
    } else {
        // Use miles
        const totalMi = totalFeet / 5280;
        const nice = nicesMi.reduce((best, v) =>
            Math.abs(v - totalMi) < Math.abs(best - totalMi) ? v : best,
        );
        const px = Math.round((nice / totalMi) * targetPx);
        return { label: `${nice} MI`, px };
    }
}
