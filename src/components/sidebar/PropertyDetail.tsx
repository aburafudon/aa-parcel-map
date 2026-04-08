// =============================================================================
// components/sidebar/PropertyDetail.tsx — full property detail panel
// =============================================================================

import { useState, type FC } from "react";
import { ExternalLink, Heart, BookOpen, Download } from "lucide-react";
import type { NormalisedParcel, AccordionItem as AccordionItemType, Field } from "../../types";
import AccordionItem from "../ui/AccordionItem";
import ParcelThumbnail from "./ParcelThumbnail";
import QuickStatsPanel from "./QuickStatsPanel";
import { exportParcel } from "../../utils/export.utils";
import { DEFAULT_ACCORDION_ITEMS } from "../../config/defaults";

// ─── Field tooltip definitions ────────────────────────────────────────────────

const FIELD_TIPS: Record<string, string> = {
    "PIN":              "Parcel Identification Number — the unique county-assigned ID for this lot",
    "PACKEDPIN":        "Packed PIN — PIN without dashes, used in some county systems",
    "Status":           "Assessor record status: Active = on the tax roll, Exempt = not taxed",
    "Property Class":   "State-assigned use classification (e.g. 201 = Residential, 401 = Commercial)",
    "Zoning":           "City zoning designation (e.g. R1A = Single-Family, TC1 = Town Center)",
    "ECF Type":         "Economic Condition Factor type — adjusts assessed value for market conditions",
    "MayPRE":           "Principal Residence Exemption — % of value exempt from school operating tax (max 100%)",
    "Homestead %":      "Principal Residence Exemption — % of value exempt from school operating tax (max 100%)",
    "Taxable Value":    "Assessed value used to calculate the annual property tax bill",
    "Land Value":       "Assessed value of the land only, not including structures",
    "Prior Taxable Value": "Taxable value from the prior assessment year",
    "Front Footage":    "Width of the lot along the street frontage in feet",
    "Site Area":        "Total site area in square feet",
    "Floor Area":       "Gross floor area of all structures in square feet",
    "Ground Area":      "Footprint area of the main structure at ground level in square feet",
    "HDC":              "Historic District Code — indicates if the parcel is in a local historic district",
    "Historic PIN":     "Previous PIN if this parcel was re-parcelled or re-numbered",
    "Legal Desc.":      "Official legal description of the parcel boundaries from the deed",
    "Planning Dist.":   "City planning district — used for zoning reviews and planning studies",
    "In Floodplain":    "FEMA flood hazard area status — affects insurance and development rules",
    "Exempt":           "Whether this parcel is fully exempt from property taxes (e.g. government, non-profit)",
    "Vacant":           "Whether the parcel has improvements (Improved) or is undeveloped (Vacant)",
    "Condo":            "Whether this parcel is a condominium unit",
    "Apartment":        "Whether classified as an apartment building",
    "Heat Fuel":        "Primary heating fuel type (e.g. Natural Gas, Electric, Oil)",
    "Ductless AC":      "Whether the property has a ductless air-conditioning (mini-split) system",
    "PDIST":            "Planning district code assigned by the city",
    "GEOID":            "US Census block group geographic identifier",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAccordions(property: NormalisedParcel | null): AccordionItemType[] {
    if (!property) return DEFAULT_ACCORDION_ITEMS;
    const { sections: s } = property;
    const infraFields: Field[] = [
        { label: "Water",    value: "Municipal" },
        { label: "Sewer",    value: "Municipal" },
        { label: "Electric", value: "DTE Energy", span: 2 },
    ];
    const demoFields: Field[] = [
        { label: "Ward",          value: property.rawProps?.WARDS as string ?? "—" },
        { label: "Neighborhood",  value: property.rawProps?.NEIGHBORHOOD as string ?? "—", span: 2 },
        { label: "In City",       value: property.rawProps?.inCity as string ?? "—" },
        { label: "In Floodplain", value: property.rawProps?.inFloodplain as string ?? "—" },
    ];
    return [
        { icon: "info"     as const, label: "Property Info",     sections: [{ title: "Basic Info", fields: s.propertyInfo }, { title: "Financials", fields: s.financials }] },
        { icon: "map"      as const, label: "Zoning & Land Use", sections: [{ title: "Area & Land", fields: s.areaLand }] },
        { icon: "settings" as const, label: "Infrastructure",    sections: [{ title: "Utilities", fields: infraFields }] },
        { icon: "users"    as const, label: "Demographics",      sections: [{ title: "Area Stats", fields: demoFields }] },
        { icon: "file"     as const, label: "Reports",           sections: [{ title: "Records", fields: s.reports }] },
    ];
}

function extractStreetViewUrl(property: NormalisedParcel): string | null {
    const sv = property.rawProps?.StreetView as string | undefined;
    if (!sv) return null;
    const m = sv.match(/href="([^"]+)"/);
    return m ? m[1].replace(/&amp;/g, "&") : null;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
    property:          NormalisedParcel;
    isFavorited:       boolean;
    onToggleFavorite:  () => void;
    openIndex:         number | null;
    onAccordionToggle: (i: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

const PropertyDetail: FC<Props> = ({
    property,
    isFavorited,
    onToggleFavorite,
    openIndex,
    onAccordionToggle,
}) => {
    const [justSaved, setJustSaved] = useState(false);

    const handleToggleFavorite = (): void => {
        if (!isFavorited) {
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 500);
        }
        onToggleFavorite();
    };

    const currentLat    = property.rawProps?.DDLat as number | null | undefined ?? null;
    const currentLng    = property.rawProps?.DDLon as number | null | undefined ?? null;
    const streetViewUrl = extractStreetViewUrl(property);
    const accordions    = buildAccordions(property);
    const pin           = property.rawProps?.PIN as string | undefined;
    const bsaUrl        = pin
        ? `https://bsaonline.com/SiteSearch/PropertyDetails?uid=283&ReferenceKey=${encodeURIComponent(pin)}&ReferenceType=0`
        : null;
    const exempt = property.rawProps?.isExempt as string | undefined;
    const propStatus = property.rawProps?.propstatus as string | undefined;
    const statusActive = propStatus?.toLowerCase() === "active";

    return (
        <div className="detail-panel" role="tabpanel" id="panel-search" aria-label="Property details">
            <div className="detail-scroll gis-scroll">
                <div className="property-header">
                    {/* Thumbnail + Street View */}
                    <div className="parcel-thumb-wrap">
                        <ParcelThumbnail lat={currentLat} lng={currentLng} />
                        {streetViewUrl && (
                            <a href={streetViewUrl} target="_blank" rel="noopener noreferrer"
                               className="streetview-btn"
                               aria-label="Open Google Street View for this parcel"
                               title="Google Street View">
                                <ExternalLink size={13} aria-hidden="true" />
                            </a>
                        )}
                    </div>

                    {/* Title row */}
                    <div className="property-title-row">
                        <div className="property-title-text">
                            <div className="property-address-row">
                                <h1 className="property-address">{property.address}</h1>
                                {exempt === "Yes" && (
                                    <span
                                        className="exempt-chip"
                                        aria-label="This parcel is tax exempt"
                                        title="Tax exempt — not on the property tax roll"
                                    >
                                        EXEMPT
                                    </span>
                                )}
                            </div>
                            {property.city && (
                                <p className="property-city" aria-label={`City: ${property.city}`}>
                                    {property.city}
                                </p>
                            )}
                            {propStatus && (
                                <span
                                    className={`propstatus-badge${statusActive ? " propstatus-badge--active" : " propstatus-badge--inactive"}`}
                                    aria-label={`Assessor record status: ${propStatus}`}
                                    title="Assessor record status on the county tax roll"
                                >
                                    <span className="propstatus-dot" aria-hidden="true" />
                                    {propStatus}
                                </span>
                            )}
                        </div>
                        <button
                            className={`save-btn${isFavorited ? " save-btn--saved" : ""}${justSaved ? " save-btn--just-saved" : ""}`}
                            onClick={handleToggleFavorite}
                            aria-label={isFavorited ? "Remove this parcel from your saved list" : "Save this parcel to your list"}
                            aria-pressed={isFavorited}
                            title={isFavorited ? "Remove from saved" : "Save parcel"}
                        >
                            <Heart size={18} fill={isFavorited ? "currentColor" : "none"} aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <QuickStatsPanel stats={property.quickStats} />

                <div className="accordion-list" aria-label="Detailed property sections">
                    {accordions.map((item, i) => (
                        <AccordionItem
                            key={item.label}
                            item={item}
                            isOpen={openIndex === i}
                            onToggle={() => onAccordionToggle(i)}
                            fieldTips={FIELD_TIPS}
                        />
                    ))}
                </div>
            </div>

            {/* Sticky footer */}
            <div className="detail-footer" role="toolbar" aria-label="Property actions">
                {bsaUrl && (
                    <a href={bsaUrl} target="_blank" rel="noopener noreferrer"
                       className="footer-btn footer-btn--primary"
                       aria-label="View full property record on BS&A Online (opens in new tab)">
                        <BookOpen size={14} aria-hidden="true" />
                        View on BS&amp;A
                    </a>
                )}
                <button
                    className="footer-btn footer-btn--secondary"
                    onClick={() => exportParcel(property)}
                    aria-label="Export property data as a JSON file download"
                    title="Download all parcel data as JSON"
                >
                    <Download size={14} aria-hidden="true" />
                    Export
                </button>
            </div>
        </div>
    );
};

export default PropertyDetail;
