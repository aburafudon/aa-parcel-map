// =============================================================================
// types/domain.types.ts — business / domain-layer types
// =============================================================================

import type { Field, QuickStat } from "./ui.types";

export interface ParcelSections {
    propertyInfo: Field[];
    financials:   Field[];
    areaLand:     Field[];
    reports:      Field[];
}

export interface NormalisedParcel {
    address:    string;
    city:       string;
    status:     string;
    quickStats: QuickStat[];
    sections:   ParcelSections;
    /** Raw feature properties — passed through for StreetView link etc. */
    rawProps:   Record<string, unknown>;
}

/**
 * A single result returned by the Ann Arbor MapServer search endpoint.
 * Fields: PIN (parcel ID), OWNNAME1 (owner name), PRPACOM (address/description).
 */
export interface ParcelSearchResult {
    PIN:      string;
    OWNNAME1: string;
    PRPACOM:  string;
    /** Decimal-degree centroid latitude — used to fly the map to the parcel */
    DDLat:    number | null;
    /** Decimal-degree centroid longitude */
    DDLon:    number | null;
}

export interface FavoriteParcel {
    pin:     string;
    address: string;
    city:    string;
    lat:     number | null;
    lng:     number | null;
    savedAt: number;
}
