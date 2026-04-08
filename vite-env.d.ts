/// <reference types="vite/client" />

// ─── Environment variables ────────────────────────────────────────────────────
// Add your .env variables here so TypeScript knows about them.
// All Vite env vars must be prefixed with VITE_ to be exposed to the client.

interface ImportMetaEnv {
    /**
     * Optional ArcGIS API token for authenticated FeatureServer requests.
     * Add to .env: VITE_ARCGIS_TOKEN=your_token_here
     */
    readonly VITE_ARCGIS_TOKEN?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}