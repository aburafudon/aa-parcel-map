// =============================================================================
// services/parcel.service.ts — parcel search and spatial queries
// =============================================================================

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { ParcelSearchResult, LatLng, RawParcelProperties } from "../types";
import { IS_DEV, AA_SEARCH_URL, PARCEL_LAYER_URL, authHeaders } from "./arcgis.config";

// ─── Overlay layer URL resolver ───────────────────────────────────────────────

/**
 * Given a full utility.arcgis.com URL from layers.config.ts, returns the
 * correct URL to use at runtime (proxy path in dev, direct URL in prod).
 *
 * Used by LeafletMap when fetching overlay GeoJSON.
 */
export function resolveLayerUrl(fullUrl: string): string {
    if (!IS_DEV) return fullUrl;

    // Match utility.arcgis.com service URLs and rewrite to /proxy/utility/<id>/...
    const match = fullUrl.match(
        /https:\/\/utility\.arcgis\.com\/usrsvcs\/servers\/([a-f0-9]+)\/(.+)/,
    );
    if (match) {
        const [, id, restPath] = match;
        return `/proxy/utility/${id}/${restPath}`;
    }

    return fullUrl;
}

// ─── Parcel search ────────────────────────────────────────────────────────────

/**
 * Autocomplete search by PIN, owner name (OWNNAME1), or address (PRPACOM).
 * Mirrors the exact query used by the ArcGIS Experience app.
 */
export async function searchParcels(term: string): Promise<ParcelSearchResult[]> {
    if (!term.trim()) return [];

    const escaped = term.toLowerCase().replace(/'/g, "''");

    const where = [
        `(PIN NOT LIKE '81-%' AND PIN NOT LIKE '%-9%')`,
        `and ((LOWER(PIN) LIKE '${escaped}%')`,
        `OR (LOWER(OWNNAME1) LIKE '${escaped}%')`,
        `OR (LOWER(PRPACOM) LIKE '${escaped}%'))`,
    ].join(" ");

    const params = new URLSearchParams({
        f:                    "json",
        where,
        outFields:            "OWNNAME1,PRPACOM,PIN,DDLat,DDLon",
        orderByFields:        "OWNNAME1",
        returnDistinctValues: "true",
        returnGeometry:       "false",
        spatialRel:           "esriSpatialRelIntersects",
        resultRecordCount:    "10",
    });

    const res = await fetch(`${AA_SEARCH_URL}/query?${params}`, {
        headers: authHeaders(),
    });

    const data = (await res.json()) as {
        features?: Array<{ attributes: ParcelSearchResult }>;
    };

    return (data.features ?? []).map((feat) => feat.attributes);
}

// ─── Parcel spatial queries ───────────────────────────────────────────────────

function buildQueryUrl(overrides: Record<string, string>): string {
    const params = new URLSearchParams({
        f:              "geojson",
        outFields:      "*",
        returnGeometry: "true",
        inSR:           "4326",
        outSR:          "4326",
        ...overrides,
    });
    return `${PARCEL_LAYER_URL}/query?${params}`;
}

/**
 * Return the parcel polygon containing the clicked lat/lng point.
 */
export async function queryParcelByPoint(
    latlng: LatLng,
): Promise<Feature<Geometry, RawParcelProperties> | null> {
    const geometry = JSON.stringify({
        x: latlng.lng, y: latlng.lat,
        spatialReference: { wkid: 4326 },
    });

    const url = buildQueryUrl({
        geometry,
        geometryType:      "esriGeometryPoint",
        spatialRel:        "esriSpatialRelIntersects",
        resultRecordCount: "1",
        where:             "1=1",
    });

    const res  = await fetch(url, { headers: authHeaders() });
    const data = (await res.json()) as FeatureCollection<Geometry, RawParcelProperties>;
    return data.features?.[0] ?? null;
}

/**
 * Fetch a parcel polygon by its PIN — called after selecting a search result.
 */
export async function queryParcelByPin(
    pin: string,
): Promise<Feature<Geometry, RawParcelProperties> | null> {
    const safePIN = pin.replace(/'/g, "''");

    // Try both field names — Washtenaw uses PARCELID, Ann Arbor uses PIN
    const where = `PARCELID = '${safePIN}' OR PIN = '${safePIN}'`;

    const url = buildQueryUrl({
        where,
        resultRecordCount: "1",
    });

    const res  = await fetch(url, { headers: authHeaders() });
    const data = (await res.json()) as FeatureCollection<Geometry, RawParcelProperties>;
    return data.features?.[0] ?? null;
}
