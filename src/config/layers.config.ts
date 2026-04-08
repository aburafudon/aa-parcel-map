// =============================================================================
// config/layers.config.ts — overlay layer configuration
// =============================================================================

export interface LayerConfig {
    id:           string;
    title:        string;
    url:          string;
    defaultOn:    boolean;
    color:        string;
    fillColor:    string;
    fillOpacity:  number;
    weight:       number;
    dashArray?:   string;
    lineCap?:     string;
    lineJoin?:    string;
    /**
     * All layers use "geojson" — /query?f=geojson via the Vite proxy.
     * Both MapServer and FeatureServer endpoints support this when the
     * correct Referer header is injected by the proxy.
     */
    renderMode:   "geojson";
}

export const ANN_ARBOR_BASEMAP_URL =
    "https://a2maps.a2gov.org/a2arcgis/rest/services/CachedBasemaps/BaseCachePlat/MapServer";

export const OVERLAY_LAYERS: LayerConfig[] = [
    {
        // MapServer — queried as GeoJSON via /query endpoint (proxy injects Referer)
        id:          "tax-parcels",
        title:       "Tax Parcels",
        url:         "https://utility.arcgis.com/usrsvcs/servers/2aabce451f2e4ac090b4fbad5108a506/rest/services/TaxParcels/MapServer/0",
        defaultOn:   true,
        color:       "#94a3b8",   // slate — parcel grid outlines
        fillColor:   "#000000",
        fillOpacity: 0,
        weight:      0.8,
        renderMode:  "geojson",
    },
    {
        id:          "other-community",
        title:       "Other Community Parcels",
        url:         "https://utility.arcgis.com/usrsvcs/servers/99c75a4f7bdd4ec0a17c2babb2ccb997/rest/services/TaxParcelsTypes/FeatureServer/2",
        defaultOn:   true,
        color:       "#ef4444",   // red — community / institutional
        fillColor:   "#ef4444",
        fillOpacity: 0.08,
        weight:      2,
        dashArray:   "4 3",
        renderMode:  "geojson",
    },
    {
        id:          "common-parcels",
        title:       "Common Parcels",
        url:         "https://utility.arcgis.com/usrsvcs/servers/f67d6c1eeb2b44f5976a686e6d1e3714/rest/services/TaxParcelsTypes/FeatureServer/1",
        defaultOn:   true,
        color:       "#38bdf8",   // sky blue — shared/common areas
        fillColor:   "#38bdf8",
        fillOpacity: 0.07,
        weight:      2,
        dashArray:   "8 4",
        renderMode:  "geojson",
    },
    {
        id:          "tax-exempt",
        title:       "Tax Exempt Parcels",
        url:         "https://utility.arcgis.com/usrsvcs/servers/6111651f9dec4d12b762f344c7d898d1/rest/services/TaxParcelsTypes/FeatureServer/55",
        defaultOn:   false,
        color:       "#a855f7",   // purple — exempt / government
        fillColor:   "#a855f7",
        fillOpacity: 0.12,
        weight:      2,
        renderMode:  "geojson",
    },
    {
        // MapServer — queried as GeoJSON via /query endpoint (proxy injects Referer)
        id:          "city-owned",
        title:       "City Owned Land",
        url:         "https://utility.arcgis.com/usrsvcs/servers/e07bf23f947f439fac270cc2fede57d3/rest/services/CityOwnedLand/MapServer/0",
        defaultOn:   false,
        color:       "#22c55e",   // green — public parks / city land
        fillColor:   "#22c55e",
        fillOpacity: 0.15,
        weight:      2.5,
        renderMode:  "geojson",
    },
];

/** Layer swatch colours for the legend panel (mirrors OVERLAY_LAYERS) */
export const LAYER_SWATCHES: Record<string, string> = Object.fromEntries(
    OVERLAY_LAYERS.map((l) => [l.id, l.color]),
);
