// =============================================================================
// services/normalise.service.ts — map raw ArcGIS parcel properties to a
// clean NormalisedParcel shape used throughout the UI
// =============================================================================

import type { NormalisedParcel, RawParcelProperties, Field } from "../types";

// ─── Private format helpers ───────────────────────────────────────────────────

const fmt = (v: unknown): string =>
    v == null || v === "" ? "—" : String(v);

const currency = (v: unknown): string => {
    const n = Number(v);
    return v != null && !isNaN(n) && n !== 0
        ? `$${n.toLocaleString("en-US")}`
        : "—";
};

const acres = (v: unknown): string => {
    const n = Number(v);
    return v != null && !isNaN(n) && n > 0 ? `${n.toFixed(3)} ac` : "—";
};

const sqft = (v: unknown): string => {
    const n = Number(v);
    return v != null && !isNaN(n) && n > 0
        ? `${Math.round(n).toLocaleString("en-US")} sq ft`
        : "—";
};

const date = (v: unknown): string => {
    const n = Number(v);
    if (v == null || isNaN(n) || n === 0) return "—";
    return new Date(n).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const f = (label: string, value: string, span?: 1 | 2): Field =>
    span ? { label, value, span } : { label, value };

// ─── Use-type normaliser ──────────────────────────────────────────────────────

function normaliseUseType(raw: string): string {
    const s = raw.toLowerCase();
    if (s.includes("residential") || s.includes("single family") || s.includes("family")) return "Residential";
    if (s.includes("commercial") || s.includes("retail") || s.includes("office"))         return "Commercial";
    if (s.includes("industrial") || s.includes("warehouse"))                               return "Industrial";
    if (s.includes("multiple") || s.includes("multi") || s.includes("apartment"))         return "Multi-Family";
    if (s.includes("condo"))                                                               return "Condo";
    if (s.includes("vacant") || s === "—")                                                 return "Vacant";
    if (s.includes("education") || s.includes("school"))                                   return "Education";
    if (s.includes("exempt") || s.includes("government") || s.includes("public"))         return "Public/Exempt";
    if (s.includes("park") || s.includes("recreation"))                                    return "Park/Rec";
    if (s.includes("mixed"))                                                               return "Mixed Use";
    return raw !== "—" ? raw : "—";
}

// ─── Main normaliser ──────────────────────────────────────────────────────────

export function normaliseParcel(props: RawParcelProperties): NormalisedParcel {
    // ── Address & status ─────────────────────────────────────────────────────────

    const address = fmt(props.PRPACOM);
    const city    = [props.PRPACITY, props.PRPASTATE, props.PRPAZIP]
        .filter(Boolean).join(", ") || "ANN ARBOR, MI";
    const status  = props.propstatus ?? "Active GIS Record";

    // ── Quick stats (shown as colored cards) ─────────────────────────────────────

    const landuse    = fmt(props.LANDUSE);
    const ecfType    = props.taxyear_ecftype ?? "";
    const useTypeRaw = landuse !== "—" ? landuse : ecfType !== "" ? ecfType : fmt(props.propclass);
    const useType    = normaliseUseType(useTypeRaw);

    const taxVal    = props.taxableValue ?? props.taxyear_taxableValue ?? 0;
    const floorSqft = props.floorArea ? Math.round(Number(props.floorArea)).toLocaleString("en-US") + " sq ft" : "—";
    const units     = props.unitCount != null && Number(props.unitCount) > 0 ? String(props.unitCount) : "—";
    const yearVal   = props.yearbuilt ?? 0;

    const quickStats = [
        // Row 1 — identity
        { label: "Use Type",   value: useType },
        { label: "Zone",       value: fmt(props.zoning ?? props.ZONING_csGIS) },
        // Row 2 — size
        { label: "Lot Area",   value: acres(props.totalacres ?? props.landAcres) },
        { label: "Floor Area", value: floorSqft },
        // Row 3 — time & units
        { label: "Built",      value: props.yearbuilt ? String(props.yearbuilt) : "—" },
        { label: "Units",      value: units },
        // Row 4 — value
        { label: "Tax Value",  value: currency(taxVal) },
        { label: "Last Sale",  value: props.lastsaleprice ? currency(props.lastsaleprice) : "—" },
        // Hidden meta fields used by QuickStatsPanel badges (not rendered as cards)
        { label: "_taxVal",    value: String(taxVal) },
        { label: "_yearVal",   value: String(yearVal) },
        { label: "_acres",     value: String(props.totalacres ?? props.landAcres ?? 0) },
        { label: "_useType",   value: useType },
    ];

    // ── Owner mailing address ────────────────────────────────────────────────────

    const ownerAddr = [
        props.OWNSTADDR,
        props.OWNCITY,
        props.OWNSTATE,
        props.OWNZIP,
    ].filter(Boolean).join(", ") || "—";

    // ── Section fields ───────────────────────────────────────────────────────────

    return {
        address,
        city,
        status,
        quickStats,
        rawProps: props as Record<string, unknown>,

        sections: {
            propertyInfo: [
                f("PIN",            fmt(props.PIN)),
                f("Status",         fmt(props.propstatus)),
                f("Property Class", fmt(props.propclass)),
                f("Zoning",         fmt(props.zoning ?? props.ZONING_csGIS)),
                f("Land Use",       fmt(props.LANDUSE), 2),
                f("Owner",          fmt(props.OWNNAME1), 2),
                ...(props.OWNNAME2 ? [f("Owner 2", fmt(props.OWNNAME2), 2)] : []),
                f("Owner Address",  ownerAddr, 2),
                f("Condo",          fmt(props.Condo)),
                f("Apartment",      fmt(props.APARTMENT)),
                f("Vacant",         fmt(props.isVacant)),
                f("Exempt",         fmt(props.isExempt)),
            ],

            financials: [
                f("Taxable Value",       currency(props.taxableValue)),
                f("Land Value",          currency(props.landvalue)),
                f("Homestead %",         props.MayPRE != null ? `${props.MayPRE}%` : "—"),
                f("Last Sale Price",     currency(props.lastsaleprice), 2),
                f("Last Sale Date",      date(props.lastsaledate), 2),
                f("Prior Taxable Value", currency(props.taxyear_taxableValue), 2),
                f("ECF Type",            fmt(props.taxyear_ecftype), 2),
            ],

            areaLand: [
                f("Total Acres",    acres(props.totalacres)),
                f("Land Acres",     acres(props.landAcres)),
                f("Front Footage",  props.frontFootage ? `${props.frontFootage} ft` : "—"),
                f("Site Area",      sqft(props.SiteArea)),
                f("Floor Area",     sqft(props.floorArea)),
                f("Ground Area",    sqft(props.groundArea)),
                f("Residential",    sqft(props.residentialArea)),
                f("Commercial",     sqft(props.commercialArea)),
                f("Units",          props.unitCount != null && props.unitCount > 0 ? String(props.unitCount) : "—"),
                f("Year Built",     props.yearbuilt ? String(props.yearbuilt) : "—"),
                f("Heat Fuel",      fmt(props.heatfueltype)),
                f("Ductless AC",    fmt(props.hasductlessac)),
            ],

            reports: [
                f("Neighborhood",   fmt(props.NEIGHBORHOOD), 2),
                f("Ward",           fmt(props.WARDS)),
                f("In City",        fmt(props.inCity)),
                f("In Floodplain",  fmt(props.inFloodplain)),
                f("ZIP",            fmt(props.PRPAZIP ?? props.ZIP)),
                f("Planning Dist.", fmt(props.PDIST)),
                f("Historic PIN",   fmt(props.HistoricPIN)),
                f("HDC",            fmt(props.HDC)),
                f("Legal Desc.",    fmt(props.legalDescription), 2),
            ],
        },
    };
}
