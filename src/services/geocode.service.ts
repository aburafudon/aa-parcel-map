// =============================================================================
// services/geocode.service.ts — Esri World Geocoder integration
// =============================================================================

import type { GeocodeResponse, GeocodeResult } from "../types";
import { GEOCODE_URL, authHeaders } from "./arcgis.config";

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
    const params = new URLSearchParams({
        SingleLine: address,
        outFields: "Match_addr,Addr_type",
        f: "json",
        maxLocations: "1",
    });

    const res = await fetch(`${GEOCODE_URL}?${params}`, { headers: authHeaders() });
    const data = (await res.json()) as GeocodeResponse;

    const candidate = data.candidates?.[0];
    if (!candidate) return null;

    return {
        lat: candidate.location.y,
        lng: candidate.location.x,
        label: candidate.attributes.Match_addr,
    };
}
