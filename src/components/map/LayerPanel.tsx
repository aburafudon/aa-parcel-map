// =============================================================================
// components/map/LayerPanel.tsx — layer visibility controls
// =============================================================================

import type { FC } from "react";
import { X } from "lucide-react";
import type { LayerVisibility } from "../../types";
import { OVERLAY_LAYERS } from "../../config/layers.config";

interface Props {
    visibility: LayerVisibility;
    onChange:   (id: string, visible: boolean) => void;
    onClose:    () => void;
}

/**
 * Polygon swatch — renders a small filled rectangle with the layer's stroke
 * style so the legend exactly matches what's drawn on the map.
 */
const PolygonSwatch: FC<{
    color:       string;
    fillColor:   string;
    fillOpacity: number;
    dashArray?:  string;
    weight:      number;
    on:          boolean;
}> = ({ color, fillColor, fillOpacity, dashArray, weight, on }) => {
    const alpha  = on ? 1 : 0.3;
    const svgDash = dashArray ? dashArray.replace(/,/g, " ") : undefined;

    return (
        <svg
            width="32" height="22"
            viewBox="0 0 32 22"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
        >
            <rect x="2" y="2" width="28" height="18" rx="3"
                  fill={fillColor} fillOpacity={fillOpacity * alpha} />
            <rect x="2" y="2" width="28" height="18" rx="3"
                  fill="none"
                  stroke={color}
                  strokeWidth={Math.min(weight, 2.5)}
                  strokeDasharray={svgDash}
                  opacity={alpha} />
        </svg>
    );
};

const LayerPanel: FC<Props> = ({ visibility, onChange, onClose }) => (
    <div className="layer-panel" role="dialog" aria-modal="true" aria-label="Layer visibility controls">
        <div className="layer-panel-header">
            <span className="layer-panel-title">Layers</span>
            <button className="layer-panel-close" onClick={onClose} aria-label="Close layers panel">
                <X size={13} aria-hidden="true" />
            </button>
        </div>

        <ul className="layer-list" role="list">
            {OVERLAY_LAYERS.map((layer) => {
                const on = visibility[layer.id] ?? layer.defaultOn;
                return (
                    <li key={layer.id} className="layer-item" role="listitem">
                        <div className="layer-label">
                            <button
                                role="switch"
                                aria-checked={on}
                                aria-label={`${on ? "Hide" : "Show"} ${layer.title}`}
                                className={`layer-toggle${on ? " layer-toggle--on" : ""}`}
                                onClick={() => onChange(layer.id, !on)}
                            />
                            <PolygonSwatch
                                color={layer.color}
                                fillColor={layer.fillColor}
                                fillOpacity={layer.fillOpacity}
                                dashArray={layer.dashArray}
                                weight={layer.weight}
                                on={on}
                            />
                            <span className={`layer-name${on ? "" : " layer-name--off"}`}>
                                {layer.title}
                            </span>
                        </div>
                    </li>
                );
            })}
        </ul>

        <p className="layer-panel-hint">Geometry layers load at zoom ≥ 13</p>
    </div>
);

export default LayerPanel;
