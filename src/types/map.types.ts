// =============================================================================
// types/map.types.ts — map / spatial types
// =============================================================================

export interface LatLng {
    lat: number;
    lng: number;
}

export interface MapBounds {
    north: number;
    south: number;
    east:  number;
    west:  number;
}

/** Map of layer id → current visibility state */
export type LayerVisibility = Record<string, boolean>;

export type Theme = "dark" | "light";
