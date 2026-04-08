// =============================================================================
// utils/theme.utils.ts — theme detection helpers
// =============================================================================

import type { Theme } from "../types";

/** Detect the OS-level preferred colour scheme. */
export function systemTheme(): Theme {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}
