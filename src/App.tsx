// =============================================================================
// App.tsx — root component, wires everything together
// =============================================================================

import { useState, useRef, useCallback } from "react";
import type { Map } from "leaflet";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import { LeafletMap, MapControls, LayerPanel } from "./components/map";
import { Sidebar } from "./components/sidebar";
import type {
    NormalisedParcel, RawParcelProperties,
    LatLng, LayerVisibility, Theme, ParcelSearchResult,
} from "./types";
import { OVERLAY_LAYERS } from "./config/layers.config";
import { queryParcelByPoint, queryParcelByPin } from "./services/parcel.service";
import { normaliseParcel } from "./services/normalise.service";
import { systemTheme } from "./utils/theme.utils";
import { computeScale } from "./utils/scale.utils";
import "./styles/index.scss";

function defaultVisibility(): LayerVisibility {
    return Object.fromEntries(OVERLAY_LAYERS.map((l) => [l.id, l.defaultOn]));
}

export default function App() {
    const mapRef = useRef<Map | null>(null);

    const [zoom,            setZoom]            = useState<number>(15);
    const [rawLat,          setRawLat]          = useState<number>(42.2965);
    const [lat,             setLat]             = useState<string>("42.2965° N");
    const [lng,             setLng]             = useState<string>("83.7144° W");
    const [selectedFeature, setSelectedFeature] =
        useState<FeatureCollection<Geometry, RawParcelProperties> | null>(null);
    const [property,        setProperty]        = useState<NormalisedParcel | null>(null);
    const [loading,         setLoading]         = useState<boolean>(false);
    const [layerPanelOpen,  setLayerPanelOpen]  = useState<boolean>(false);
    const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>(defaultVisibility);
    const [theme,           setTheme]           = useState<Theme>(systemTheme);

    const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

    // ── Map ready ─────────────────────────────────────────────────────────────
    const handleMapReady = useCallback((map: Map): void => {
        mapRef.current = map;
        map.on("zoomend", () => setZoom(map.getZoom()));
        map.on("moveend", () => {
            const c = map.getCenter();
            setRawLat(c.lat);
            setLat(`${Math.abs(c.lat).toFixed(4)}° ${c.lat >= 0 ? "N" : "S"}`);
            setLng(`${Math.abs(c.lng).toFixed(4)}° ${c.lng >= 0 ? "E" : "W"}`);
        });
    }, []);

    // ── Apply found feature ───────────────────────────────────────────────────
    const applyFeature = useCallback(
        (feature: Feature<Geometry, RawParcelProperties>): void => {
            setSelectedFeature({ type: "FeatureCollection", features: [feature] });
            setProperty(normaliseParcel(feature.properties));
        },
        [],
    );

    // ── Map click ─────────────────────────────────────────────────────────────
    const handleParcelClick = useCallback(async ({ lat, lng }: LatLng): Promise<void> => {
        setLoading(true);
        try {
            const feature = await queryParcelByPoint({ lat, lng });
            if (feature) applyFeature(feature);
        } catch (err) {
            console.warn("Point query failed:", err);
        } finally {
            setLoading(false);
        }
    }, [applyFeature]);

    // ── Search result selected ────────────────────────────────────────────────
    const handlePinSelect = useCallback(async (result: ParcelSearchResult): Promise<void> => {
        const map = mapRef.current;
        setLoading(true);

        const hasCenter = result.DDLat && result.DDLon;
        if (hasCenter && map) {
            map.flyTo([result.DDLat!, result.DDLon!], 18, { duration: 0.8 });
        }

        try {
            let feature: Feature<Geometry, RawParcelProperties> | null = null;

            if (hasCenter) {
                feature = await queryParcelByPoint({ lat: result.DDLat!, lng: result.DDLon! });
            }
            if (!feature) {
                feature = await queryParcelByPin(result.PIN);
            }
            if (feature) applyFeature(feature);
        } catch (err) {
            console.warn("Pin select failed:", err);
        } finally {
            setLoading(false);
        }
    }, [applyFeature]);

    const handleLayerChange = useCallback((id: string, visible: boolean): void => {
        setLayerVisibility((prev) => ({ ...prev, [id]: visible }));
    }, []);

    const scale = computeScale(zoom, rawLat);

    return (
        <div className="app" data-theme={theme}>
            <LeafletMap
                onParcelClick={handleParcelClick}
                selectedFeature={selectedFeature}
                layerVisibility={layerVisibility}
                theme={theme}
                onMapReady={handleMapReady}
            />

            <Sidebar
                property={property}
                loading={loading}
                onPinSelect={handlePinSelect}
            />

            <MapControls
                mapRef={mapRef}
                zoom={zoom}
                lat={lat}
                lng={lng}
                scaleLabel={scale.label}
                scalePx={scale.px}
                onLayerToggle={() => setLayerPanelOpen((o) => !o)}
                layerPanelOpen={layerPanelOpen}
                theme={theme}
                onThemeToggle={toggleTheme}
            />

            {layerPanelOpen && (
                <LayerPanel
                    visibility={layerVisibility}
                    onChange={handleLayerChange}
                    onClose={() => setLayerPanelOpen(false)}
                />
            )}
        </div>
    );
}