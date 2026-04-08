// =============================================================================
// components/map/LeafletMap.tsx — Leaflet map container
// =============================================================================

import { useEffect, useRef, useCallback } from "react";
import L, {
    Map as LeafletMap,
    TileLayer,
    GeoJSON as LeafletGeoJSON,
    type PathOptions,
    type LeafletMouseEvent,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { RawParcelProperties, LatLng, LayerVisibility, Theme } from "../../types";
import { OVERLAY_LAYERS } from "../../config/layers.config";
import { resolveLayerUrl } from "../../services/parcel.service";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../../config/map.config";

// ─── Ann Arbor geofence ──────────────────────────────────────────────────────

const ANN_ARBOR_BOUNDS = L.latLngBounds(
    L.latLng(42.1800, -83.8800),
    L.latLng(42.4000, -83.5800),
);

// ─── Basemap configs (split base + label layers) ──────────────────────────────
//
// Splitting into two tile layers means our GeoJSON overlays sit between them:
//   [base tiles]  →  [GeoJSON overlays]  →  [label tiles]  →  [selection highlight]
//
// This way street names and address numbers are always readable on top of
// coloured parcel polygons, while the orange selection highlight still wins.

const ATTRIBUTION = '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const BASEMAPS: Record<Theme, { base: string; labels: string; attribution: string }> = {
    dark: {
        base: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
        labels: "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png",
        attribution: ATTRIBUTION,
    },
    light: {
        base: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        labels: "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        attribution: ATTRIBUTION,
    },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    onParcelClick: (latlng: LatLng) => void;
    selectedFeature: FeatureCollection<Geometry, RawParcelProperties> | null;
    layerVisibility: LayerVisibility;
    theme: Theme;
    onMapReady: (map: LeafletMap) => void;
}

// ─── Selection highlight style ────────────────────────────────────────────────

const selectedStyle: PathOptions = {
    color: "#f97316", weight: 3, opacity: 1,
    fillColor: "#f97316", fillOpacity: 0.18,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeafletMapComponent({
    onParcelClick,
    selectedFeature,
    layerVisibility,
    theme,
    onMapReady,
}: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<LeafletMap | null>(null);
    const baseTileRef = useRef<TileLayer | null>(null);
    const labelTileRef = useRef<TileLayer | null>(null);
    const selectionLayerRef = useRef<LeafletGeoJSON<RawParcelProperties> | null>(null);
    const overlayLayersRef = useRef<Map<string, LeafletGeoJSON>>(new Map());
    const lastRenderedIdRef = useRef<string | null>(null);

    // Stable refs — prevent stale closures in async callbacks
    const onParcelClickRef = useRef(onParcelClick);
    const layerVisibilityRef = useRef(layerVisibility);
    const themeRef = useRef(theme);
    useEffect(() => { onParcelClickRef.current = onParcelClick; });
    useEffect(() => { layerVisibilityRef.current = layerVisibility; });
    useEffect(() => { themeRef.current = theme; });

    // ── Abort controller ref — cancelled when viewport changes ─────────────────
    const fetchAbortRef = useRef<AbortController | null>(null);

    // ── Feature cache — persists loaded features across viewport changes ─────────
    //
    // Structure: layerId → Map<featureKey, GeoJSON feature>
    //
    // Features already in the cache are not re-fetched or re-added to the Leaflet
    // layer, so panning/zooming only loads the genuinely new area.
    // Each layer cache is pruned to MAX_CACHE_PER_LAYER when it grows too large.
    //
    const MAX_CACHE_PER_LAYER = 5_000;
    type FeatureRecord = Record<string, unknown>;
    const featureCacheRef = useRef<Map<string, Map<string, FeatureRecord>>>(new Map());

    // ── Overlay GeoJSON fetch with pagination ────────────────────────────────
    //
    // Strategy:
    //   • Zoom-adaptive page size: larger pages at high zoom (small area),
    //     smaller pages at low zoom (large area, fewer needed for context)
    //   • Paginate via resultOffset until exceededTransferLimit is false
    //   • Cap at MAX_PAGES per layer per fetch to bound worst-case requests
    //   • Abort in-flight requests when the viewport changes
    //   • Render each page incrementally (addData per page, not clear-all-then-add)
    //
    const fetchOverlays = useCallback(async (map: LeafletMap): Promise<void> => {
        // Cancel any previous fetch round
        fetchAbortRef.current?.abort();
        const controller = new AbortController();
        fetchAbortRef.current = controller;
        const { signal } = controller;

        const zoom = map.getZoom();
        const b = map.getBounds();
        const envelope = JSON.stringify({
            xmin: b.getWest(), ymin: b.getSouth(),
            xmax: b.getEast(), ymax: b.getNorth(),
            spatialReference: { wkid: 4326 },
        });

        // Zoom-adaptive page size: ~100 at z12, ~1000 at z18+
        const pageSize = Math.min(1000, Math.max(100, Math.round(100 * Math.pow(2, zoom - 12))));
        const MAX_PAGES = 5;

        const baseParams = {
            f: "geojson",
            outFields: "PIN,PRPACOM,OWNNAME1",
            returnGeometry: "true",
            inSR: "4326",
            outSR: "4326",
            geometry: envelope,
            geometryType: "esriGeometryEnvelope",
            spatialRel: "esriSpatialRelIntersects",
            where: "1=1",
            resultRecordCount: String(pageSize),
        };

        await Promise.allSettled(
            OVERLAY_LAYERS.map(async (cfg) => {
                const visible = layerVisibilityRef.current[cfg.id] ?? cfg.defaultOn;
                if (!visible) return;

                const geoLayer = overlayLayersRef.current.get(cfg.id);
                if (!geoLayer) return;

                if (!featureCacheRef.current.has(cfg.id)) {
                    featureCacheRef.current.set(cfg.id, new Map());
                }
                const layerCache = featureCacheRef.current.get(cfg.id)!;

                let offset = 0;
                let pagesDone = 0;
                let hasMore = true;

                while (hasMore && pagesDone < MAX_PAGES) {
                    if (signal.aborted) return;

                    const params = new URLSearchParams({
                        ...baseParams,
                        resultOffset: String(offset),
                    });

                    try {
                        const res = await fetch(
                            `${resolveLayerUrl(cfg.url)}/query?${params}`,
                            { signal },
                        );
                        if (!res.ok) return;

                        const data = await res.json() as {
                            features?: FeatureRecord[];
                            exceededTransferLimit?: boolean;
                        };
                        if (!Array.isArray(data.features) || data.features.length === 0) return;

                        const newFeatures = data.features.filter((feat) => {
                            const props = feat["properties"] as Record<string, unknown> | null;
                            const key = (props?.["PIN"] ?? props?.["OBJECTID"] ?? props?.["PACKEDPIN"]) as string | undefined;
                            if (!key) return true;
                            if (layerCache.has(key)) return false;
                            layerCache.set(key, feat);
                            return true;
                        });

                        if (layerCache.size > MAX_CACHE_PER_LAYER) {
                            const toDelete = layerCache.size - MAX_CACHE_PER_LAYER;
                            let deleted = 0;
                            for (const k of layerCache.keys()) {
                                layerCache.delete(k);
                                if (++deleted >= toDelete) break;
                            }
                        }

                        if (newFeatures.length > 0) {
                            geoLayer.addData({
                                type: "FeatureCollection",
                                features: newFeatures,
                            } as Parameters<typeof geoLayer.addData>[0]);
                        }

                        hasMore = data.exceededTransferLimit === true;
                        offset += data.features.length;
                        pagesDone++;

                        if (newFeatures.length === 0 && !hasMore) return;
                    } catch (err) {
                        if ((err as Error).name !== "AbortError") {
                            console.warn(`[overlay] fetch failed for ${cfg.id}:`, err);
                        }
                        return;
                    }
                }
            }),
        );
    }, []);

    // ── Helper: add both basemap tile layers in correct z-order ──────────────
    const addBasemapLayers = useCallback((map: LeafletMap, t: Theme): void => {
        const bm = BASEMAPS[t];

        baseTileRef.current = L.tileLayer(bm.base, {
            attribution: bm.attribution,
            subdomains: "abcd",
            maxZoom: 20,
            zIndex: 1,
        }).addTo(map);
        baseTileRef.current.bringToBack();

        labelTileRef.current = L.tileLayer(bm.labels, {
            subdomains: "abcd",
            maxZoom: 20,
            zIndex: 650,
            opacity: 1,
            pane: "shadowPane",
        }).addTo(map);

        selectionLayerRef.current?.bringToFront();
    }, []);

    // ── Remove both basemap tile layers cleanly ───────────────────────────────
    const removeBasemapLayers = useCallback((map: LeafletMap): void => {
        if (baseTileRef.current) { map.removeLayer(baseTileRef.current); baseTileRef.current = null; }
        if (labelTileRef.current) { map.removeLayer(labelTileRef.current); labelTileRef.current = null; }
    }, []);

    // ── Init map ──────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current as HTMLDivElement & { _leaflet_id?: number };
        if (container._leaflet_id) delete container._leaflet_id;

        const map = L.map(container, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            minZoom: 12,
            maxZoom: 20,
            maxBounds: ANN_ARBOR_BOUNDS,
            maxBoundsViscosity: 1.0,
            zoomControl: false,
            attributionControl: true,
        });

        const bm = BASEMAPS[themeRef.current];
        baseTileRef.current = L.tileLayer(bm.base, {
            attribution: bm.attribution,
            subdomains: "abcd",
            maxZoom: 20,
            zIndex: 1,
        }).addTo(map);
        baseTileRef.current.bringToBack();

        overlayLayersRef.current.clear();
        OVERLAY_LAYERS.forEach((cfg) => {
            const layer = L.geoJSON(undefined, {
                style: () => ({
                    color: cfg.color,
                    weight: cfg.weight,
                    opacity: 0.85,
                    fillColor: cfg.fillColor,
                    fillOpacity: cfg.fillOpacity,
                    dashArray: cfg.dashArray,
                }),
                onEachFeature: (feature, l) => {
                    const p = feature.properties as Record<string, unknown>;
                    const label = (p["PRPACOM"] ?? p["PIN"] ?? "") as string;
                    if (label) {
                        (l as L.Layer & { bindTooltip: (c: string, o: object) => void })
                            .bindTooltip(label, { sticky: true, className: "gis-tooltip" });
                    }
                },
            });
            overlayLayersRef.current.set(cfg.id, layer);
            if (cfg.defaultOn) layer.addTo(map);
        });

        labelTileRef.current = L.tileLayer(bm.labels, {
            subdomains: "abcd",
            maxZoom: 20,
            zIndex: 650,
            pane: "shadowPane",
        }).addTo(map);

        selectionLayerRef.current = L.geoJSON<RawParcelProperties>(undefined, {
            style: () => selectedStyle,
        }).addTo(map);

        map.on("click", (e: LeafletMouseEvent) =>
            onParcelClickRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }),
        );

        let overlayDebounce: ReturnType<typeof setTimeout> | null = null;
        const handleViewChange = (): void => {
            if (overlayDebounce) clearTimeout(overlayDebounce);
            overlayDebounce = setTimeout(() => { void fetchOverlays(map); }, 400);
        };
        map.on("moveend", handleViewChange);
        map.on("zoomend", handleViewChange);

        mapRef.current = map;
        onMapReady(map);
        void fetchOverlays(map);

        return () => {
            if (overlayDebounce) clearTimeout(overlayDebounce);
            fetchAbortRef.current?.abort();
            featureCacheRef.current.clear();
            map.remove();
            mapRef.current = null;
            baseTileRef.current = null;
            labelTileRef.current = null;
            selectionLayerRef.current = null;
            lastRenderedIdRef.current = null;
            overlayLayersRef.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Swap basemap on theme change ──────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        removeBasemapLayers(map);
        addBasemapLayers(map, theme);
    }, [theme, addBasemapLayers, removeBasemapLayers]);

    // ── Sync overlay visibility ──────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        OVERLAY_LAYERS.forEach((cfg) => {
            const layer = overlayLayersRef.current.get(cfg.id);
            if (!layer) return;
            const visible = layerVisibility[cfg.id] ?? cfg.defaultOn;
            const inMap = map.hasLayer(layer);

            if (visible && !inMap) {
                layer.addTo(map);
                void fetchOverlays(map);
            } else if (!visible && inMap) {
                map.removeLayer(layer);
                featureCacheRef.current.delete(cfg.id);
            }

            labelTileRef.current?.bringToFront();
            selectionLayerRef.current?.bringToFront();
        });
    }, [layerVisibility, fetchOverlays]);

    // ── Sync selected parcel highlight ────────────────────────────────────────
    useEffect(() => {
        const layer = selectionLayerRef.current;
        if (!layer) return;

        const incomingId = (
            selectedFeature?.features[0]?.properties?.PIN ??
            selectedFeature?.features[0]?.properties?.PACKEDPIN ??
            selectedFeature?.features[0]?.properties?.PARCELID ??
            null
        ) as string | null;

        if (incomingId !== null && incomingId === lastRenderedIdRef.current) return;
        lastRenderedIdRef.current = incomingId;

        layer.clearLayers();
        if (!selectedFeature) return;

        layer.addData(selectedFeature);

        layer.eachLayer((l) => {
            const gl = l as L.Path & { feature?: Feature<Geometry, RawParcelProperties> };
            const props = gl.feature?.properties;
            const addr = props?.PRPACOM ?? "";
            if (addr) {
                (l as L.Layer & { bindTooltip: (c: string, o: object) => void })
                    .bindTooltip(addr, { sticky: true, className: "gis-tooltip" });
            }
        });

        layer.bringToFront();

        try {
            const bounds = layer.getBounds();
            if (bounds.isValid()) {
                mapRef.current?.fitBounds(bounds, {
                    padding: [60, 60], maxZoom: 18, animate: true,
                });
            }
        } catch { /* no-op */ }
    }, [selectedFeature]);

    return (
        <div
            ref={containerRef}
            style={{ position: "absolute", inset: 0, zIndex: 0 }}
        />
    );
}
