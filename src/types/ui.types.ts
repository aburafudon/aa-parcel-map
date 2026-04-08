// =============================================================================
// types/ui.types.ts — UI / component-level types
// =============================================================================

export interface Field {
    label: string;
    value: string;
    span?: 1 | 2;
}

export interface Section {
    title: string;
    fields: Field[];
}

/** Icon key — matches a key in AccordionItem's ICON_MAP */
export type AccordionIconKey = "info" | "map" | "settings" | "users" | "file";

export interface AccordionItem {
    icon:     AccordionIconKey;
    label:    string;
    sections: Section[];
}

export interface QuickStat {
    label: string;
    value: string;
}
