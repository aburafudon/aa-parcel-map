// =============================================================================
// utils/export.utils.ts — export helpers
// =============================================================================

import type { NormalisedParcel } from "../types";

/**
 * Serialise a NormalisedParcel to JSON and trigger a browser file download.
 */
export function exportParcel(prop: NormalisedParcel): void {
    const blob = new Blob([JSON.stringify(prop, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), {
        href: url, download: `parcel-${prop.address.replace(/\s+/g, "_")}.json`,
    }).click();
    URL.revokeObjectURL(url);
}
