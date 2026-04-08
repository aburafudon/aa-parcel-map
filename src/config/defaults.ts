// =============================================================================
// config/defaults.ts — placeholder / default data shown before a parcel loads
// =============================================================================

import type { AccordionItem, AccordionIconKey, QuickStat, NormalisedParcel } from "../types";

// ─── Parcel thumbnail ─────────────────────────────────────────────────────────

export const PARCEL_IMG =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDGwyT3GkDhVU-LMFlpf4Ii1DHLBC-cy-PcspYCPU79p3m-OZeEP8QvXniVhr_9u5mKIpaqH3CFNKwC_mzK_0KDZ0P_OxesHFrP3fDEnUAMD4Oe8oDMfZWTwWN5Xl7tGNMZIhl9t2iHgJkqYHbuhugjAPZL9pTibuWNO4pJyFYtYV_EOntLtqo3Sf85Q_9tzFsVLCqfHpHwfD4gXI9Pia-5XUExi3AEU_azgC-yZU2ZVD4uHL69PoPVhP5MpVbwD9GkEjpy4Tk4pKyW";

// ─── Default / placeholder property (shown before any parcel is clicked) ─────

export const DEFAULT_PROPERTY: Pick<NormalisedParcel, "address" | "city" | "status"> = {
    address: "2901 HUBBARD ST",
    city:    "ANN ARBOR, MI 48105",
    status:  "Active GIS Record",
};

/** Alias kept for import compatibility. Prefer DEFAULT_PROPERTY. */
export const PROPERTY = DEFAULT_PROPERTY;

export const DEFAULT_QUICK_STATS: QuickStat[] = [
    { label: "Lot Area",  value: "46.64 Acres" },
    { label: "Built",     value: "—" },
    { label: "Zone",      value: "PL" },
    { label: "Tax Value", value: "$0" },
];

/** Alias kept for import compatibility. Prefer DEFAULT_QUICK_STATS. */
export const QUICK_STATS = DEFAULT_QUICK_STATS;

export const DEFAULT_ACCORDION_ITEMS: AccordionItem[] = [
    {
        icon: "info" as AccordionIconKey,
        label: "Property Info",
        sections: [
            {
                title: "Basic Info",
                fields: [
                    { label: "Property Class", value: "201" },
                    { label: "Zoning",         value: "PL" },
                    { label: "Land Use",       value: "Education", span: 2 },
                ],
            },
            {
                title: "Financials",
                fields: [
                    { label: "Taxable Value",       value: "$0" },
                    { label: "Exempt",              value: "Yes" },
                    { label: "Homestead Exemption", value: "0.00%", span: 2 },
                    { label: "Sale Price",          value: "$0",    span: 2 },
                ],
            },
        ],
    },
    {
        icon: "map" as AccordionIconKey,
        label: "Zoning & Land Use",
        sections: [
            {
                title: "Zoning",
                fields: [
                    { label: "Zone Code",      value: "PL" },
                    { label: "Classification", value: "Public Land" },
                    { label: "Land Use",       value: "Education", span: 2 },
                ],
            },
        ],
    },
    {
        icon: "settings" as AccordionIconKey,
        label: "Infrastructure",
        sections: [
            {
                title: "Utilities",
                fields: [
                    { label: "Water",    value: "Municipal" },
                    { label: "Sewer",    value: "Municipal" },
                    { label: "Electric", value: "DTE Energy", span: 2 },
                ],
            },
        ],
    },
    {
        icon: "users" as AccordionIconKey,
        label: "Demographics",
        sections: [
            {
                title: "Area Stats",
                fields: [
                    { label: "Ward",               value: "2" },
                    { label: "Neighborhood",       value: "Northwood V" },
                    { label: "Population Density", value: "3,412 / sq mi", span: 2 },
                    { label: "In City",            value: "Yes" },
                    { label: "In Floodplain",      value: "No" },
                ],
            },
        ],
    },
    {
        icon: "file" as AccordionIconKey,
        label: "Reports",
        sections: [
            {
                title: "Available Reports",
                fields: [
                    { label: "Last Assessment", value: "2024" },
                    { label: "Permit History",  value: "3 on file" },
                    { label: "Total Acres",     value: "46.64" },
                    { label: "Front Footage",   value: "0.00" },
                    {
                        label: "Legal Description",
                        value: "PT OF SECS 14, 21, 22, 23 & 27, T2S, R6E, ANN ARBOR CITY…",
                        span: 2,
                    },
                ],
            },
        ],
    },
];

/** Alias kept for import compatibility. Prefer DEFAULT_ACCORDION_ITEMS. */
export const ACCORDION_ITEMS = DEFAULT_ACCORDION_ITEMS;
