// =============================================================================
// types/arcgis.types.ts — ArcGIS REST response shapes + raw parcel properties
// =============================================================================

export interface GeocodeCandidate {
    location:   { x: number; y: number };
    attributes: { Match_addr: string; Addr_type: string };
    score:      number;
}

export interface GeocodeResponse {
    candidates?: GeocodeCandidate[];
}

export interface GeocodeResult {
    lat:   number;
    lng:   number;
    label: string;
}

/**
 * Raw parcel feature `.properties` from the Ann Arbor TaxParcels MapServer.
 * Field names are taken directly from real API responses.
 */
export interface RawParcelProperties {
    // ── Identity ────────────────────────────────────────────────────────────────
    PIN?:              string | null;    // "09-09-21-104-044"
    PACKEDPIN?:        string | null;    // "090921104044"
    OBJECTID?:         number | null;
    PARCELID?:         string | null;    // Washtenaw FeatureServer fallback
    CITY?:             string | null;    // city code "09"
    TWP?:              string | null;
    SECT?:             string | null;
    BLOCK?:            string | null;
    PARCEL?:           string | null;

    // ── Property address ────────────────────────────────────────────────────────
    PRPACOM?:          string | null;    // "1750 PLYMOUTH RD"  ← primary address
    PRPANUMB?:         number | null;    // street number
    PRPASTRT?:         string | null;    // street name
    PRPADIR?:          string | null;    // direction prefix/suffix
    PRPAAPT?:          string | null;    // apt/unit
    PRPACITY?:         string | null;    // "ANN ARBOR"
    PRPASTATE?:        string | null;    // "MI"
    PRPAZIP?:          string | null;    // "48105"
    ZIP?:              string | null;

    // ── Owner ───────────────────────────────────────────────────────────────────
    OWNNAME1?:         string | null;    // "NAVARRE CROSSINGS, LLC"
    OWNNAME2?:         string | null;
    OWNSTADDR?:        string | null;
    OWNCITY?:          string | null;
    OWNSTATE?:         string | null;
    OWNZIP?:           string | null;
    OWNCNTRY?:         string | null;

    // ── Classification ──────────────────────────────────────────────────────────
    propclass?:        string | null;    // "201"
    propstatus?:       string | null;    // "Active"
    zoning?:           string | null;    // "TC1"
    ZONING_csGIS?:     string | null;    // "TC1" (same, from GIS layer)
    LANDUSE?:          string | null;    // "General and Mixed Retail"
    isExempt?:         string | null;    // "No" / "Yes"
    isVacant?:         string | null;    // "Improved" / "Vacant"
    Condo?:            string | null;    // "N" / "Y"
    APARTMENT?:        string | null;    // "NO" / "YES"

    // ── Area & land ─────────────────────────────────────────────────────────────
    totalacres?:       number | null;
    landAcres?:        number | null;
    frontFootage?:     number | null;
    SiteArea?:         number | null;    // sq ft
    "Shape.STArea()"?: number | null;
    "Shape.STLength()"?: number | null;

    // ── Building ────────────────────────────────────────────────────────────────
    yearbuilt?:        number | null;
    floorArea?:        number | null;
    groundArea?:       number | null;
    residentialArea?:  number | null;
    commercialArea?:   number | null;
    unitCount?:        number | null;
    resStyle?:         string | null;
    heatfueltype?:     string | null;
    hasductlessac?:    string | null;

    // ── Financials ──────────────────────────────────────────────────────────────
    taxableValue?:     number | null;    // current year
    landvalue?:        number | null;
    lastsaleprice?:    number | null;
    lastsaledate?:     number | null;    // Unix ms timestamp
    MayPRE?:           number | null;    // homestead exemption %

    // taxyear_ variants (prior year / locked assessment)
    taxyear_taxableValue?: number | null;
    taxyear_landvalue?:    number | null;
    taxyear_landAcres?:    number | null;
    taxyear_frontFootage?: number | null;
    taxyear_propclass?:    string | null;
    taxyear_propstatus?:   string | null;
    taxyear_ecfnhd?:       string | null;
    taxyear_ecftype?:      string | null;  // "Commercial" / "Residential"

    // ── Location & admin ────────────────────────────────────────────────────────
    inCity?:           string | null;    // "Yes" / "No"
    inFloodplain?:     string | null;    // "Yes" / "No"
    NEIGHBORHOOD?:     string | null;    // "BROADWAY-RIVERSIDE"
    PDIST?:            string | null;    // planning district
    WARDS?:            string | null;    // "1"
    GEOID?:            string | null;
    DDLat?:            number | null;    // centroid latitude
    DDLon?:            number | null;    // centroid longitude

    // ── Records ─────────────────────────────────────────────────────────────────
    legalDescription?: string | null;
    HistoricPIN?:      string | null;
    HDC?:              string | null;    // historic district code
    StreetView?:       string | null;    // HTML anchor tag

    [key: string]: unknown;
}
