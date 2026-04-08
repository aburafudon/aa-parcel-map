// =============================================================================
// components/map/MapControls.tsx — zoom, layer, theme, and reset buttons
// =============================================================================

import type { FC, MutableRefObject } from "react";
import type { Map } from "leaflet";
import {Plus, Minus, Layers, Sun, Moon, RotateCcw, Github} from "lucide-react";
import type { Theme } from "../../types";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../../config/map.config";

interface Props {
    mapRef:          MutableRefObject<Map | null>;
    zoom:            number;
    lat:             string;
    lng:             string;
    /** Label shown beside the scale line, e.g. "200 FT" or "0.25 MI" */
    scaleLabel:      string;
    /** Pixel width to render the scale line at */
    scalePx:         number;
    onLayerToggle:   () => void;
    layerPanelOpen:  boolean;
    theme:           Theme;
    onThemeToggle:   () => void;
}

const MapControls: FC<Props> = ({
    mapRef, zoom, lat, lng,
    scaleLabel, scalePx,
    onLayerToggle, layerPanelOpen,
    theme, onThemeToggle,
}) => (
    <>
        <div className="map-controls">
            {/* Zoom */}
            <div className="zoom-cluster">
                <button className="zoom-btn zoom-btn--top"    onClick={() => mapRef.current?.zoomIn()}  aria-label="Zoom in"><Plus  size={16} /></button>
                <button className="zoom-btn zoom-btn--bottom" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={16} /></button>
            </div>

            {/* Layers */}
            <button
                className={`map-icon-btn${layerPanelOpen ? " map-icon-btn--active" : ""}`}
                onClick={onLayerToggle}
                aria-label={layerPanelOpen ? "Close layer panel" : "Open layer panel"}
                aria-expanded={layerPanelOpen}
                title="Layers"
            >
                <Layers size={16} />
            </button>

            {/* Theme toggle */}
            <button
                className="map-icon-btn"
                onClick={onThemeToggle}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Reset view */}
            <button
                className="map-icon-btn"
                onClick={() => mapRef.current?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 })}
                aria-label="Reset map to Ann Arbor city center"
                title="Reset view"
            >
                <RotateCcw size={15} />
            </button>

            <button
                className="map-icon-btn"
                onClick={() => window.open('https://github.com/aburafudon/aa-parcel-map', "_blank", "noreferrer")}
                aria-label="Go to the GitHub repository of this project"
                title="GitHub Repo"
            >
                <Github size={15} />
            </button>
        </div>

        <div className="coords-bar" role="status" aria-label="Map position and scale">
            <span className="coords-scale" aria-label={`Scale: ${scaleLabel}`}>
                <span
                    className="coords-scale-line"
                    style={{ width: `${scalePx}px` }}
                    aria-hidden="true"
                />
                <span aria-hidden="true">{scaleLabel}</span>
            </span>
            <span className="coords-sep" aria-hidden="true">|</span>
            <span>LAT {lat}</span>
            <span className="coords-sep" aria-hidden="true">|</span>
            <span>LNG {lng}</span>
            <span className="coords-sep" aria-hidden="true">|</span>
            <span className="coords-zoom">ZOOM {zoom}</span>
        </div>
    </>
);

export default MapControls;
