// =============================================================================
// services/arcgis.config.ts — shared ArcGIS REST config, URL helpers, auth
// =============================================================================

export const IS_DEV = true;

// ─── Service IDs (match the keys in vite.config.ts) ──────────────────────────

export const SVC = {
    TAX_PARCELS:      "2aabce451f2e4ac090b4fbad5108a506",
    OTHER_COMMUNITY:  "99c75a4f7bdd4ec0a17c2babb2ccb997",
    COMMON_PARCELS:   "f67d6c1eeb2b44f5976a686e6d1e3714",
    TAX_EXEMPT:       "6111651f9dec4d12b762f344c7d898d1",
    CITY_OWNED:       "e07bf23f947f439fac270cc2fede57d3",
} as const;

// ─── URL helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the correct URL for a utility.arcgis.com service endpoint.
 * In dev:  /proxy/utility/<id>/rest/services/...  (Vite proxy injects Referer)
 * In prod: https://utility.arcgis.com/usrsvcs/servers/<id>/rest/services/...
 */
export function utilityUrl(serviceId: string, restPath: string): string {
    if (IS_DEV) {
        return `/proxy/utility/${serviceId}/${restPath}`;
    }
    return `https://utility.arcgis.com/usrsvcs/servers/${serviceId}/${restPath}`;
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/**
 * Ann Arbor Tax Parcels MapServer — search/autocomplete only.
 * (geometry queries against this MapServer return 403 without auth)
 */
export const AA_SEARCH_URL = utilityUrl(
    SVC.TAX_PARCELS,
    "rest/services/TaxParcels/MapServer/0",
);

/**
 * Washtenaw County public FeatureServer — spatial point/PIN queries.
 * Override via VITE_PARCEL_LAYER_URL in .env.
 */
export const PARCEL_LAYER_URL: string =
    import.meta.env.VITE_PARCEL_LAYER_URL ??
    (IS_DEV
        ? "/proxy/washtenaw"
        : "https://services.arcgis.com/f4rR7WnIfGBdVYFd/ArcGIS/rest/services/Tax_Parcels/FeatureServer/0");

/**
 * Geocoding endpoint.
 */
export const GEOCODE_URL = IS_DEV
    ? "/proxy/geocode"
    : "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates";

// ─── Auth helper ──────────────────────────────────────────────────────────────

export function authHeaders(): HeadersInit {
    const token = import.meta.env.VITE_ARCGIS_TOKEN;
    return token ? { Authorization: `Bearer ${token}` } : {};
}
