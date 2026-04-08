import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const ARCGIS_REFERER = "https://experience.arcgis.com";

const UTILITY_SERVICE_IDS = [
  "2aabce451f2e4ac090b4fbad5108a506",  // TaxParcels/MapServer        (search + click)
  "99c75a4f7bdd4ec0a17c2babb2ccb997",  // TaxParcelsTypes/FeatureServer/2  (community parcels)
  "f67d6c1eeb2b44f5976a686e6d1e3714",  // TaxParcelsTypes/FeatureServer/1  (common parcels)
  "6111651f9dec4d12b762f344c7d898d1",  // TaxParcelsTypes/FeatureServer/55 (tax exempt)
  "e07bf23f947f439fac270cc2fede57d3",  // CityOwnedLand/MapServer          (city land)
];

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // ── utility.arcgis.com (per-service proxy rules) ──────────────────────
      //
      // Pattern:  /proxy/utility/<serviceId>/rest/services/...
      // Rewrites: /usrsvcs/servers/<serviceId>/rest/services/...
      // Injects:  Referer: https://experience.arcgis.com
      //
      // Example:
      //   Client:  GET /proxy/utility/2aabce.../rest/services/TaxParcels/MapServer/0/query?...
      //   Proxied: GET https://utility.arcgis.com/usrsvcs/servers/2aabce.../rest/services/...
      //            + Referer: https://experience.arcgis.com

      ...Object.fromEntries(
          UTILITY_SERVICE_IDS.map((id) => [
            `/proxy/utility/${id}`,
            {
              target: "https://utility.arcgis.com",
              changeOrigin: true,
              rewrite: (path: string) =>
                  path.replace(
                      `/proxy/utility/${id}`,
                      `/usrsvcs/servers/${id}`,
                  ),
              headers: {
                Referer: ARCGIS_REFERER,
                Origin: ARCGIS_REFERER,
              },
            },
          ]),
      ),

      // ── Washtenaw County public FeatureServer (no Referer needed, but ─────
      // proxying avoids any future CORS issues in dev)
      "/proxy/washtenaw": {
        target: "https://utility.arcgis.com",
        changeOrigin: true,
        rewrite: (path: string) =>
            path.replace("/proxy/washtenaw", "/usrsvcs/servers/2aabce451f2e4ac090b4fbad5108a506/rest/services/TaxParcels/MapServer/0/"),
        headers: {
          Referer: ARCGIS_REFERER,
          Origin: ARCGIS_REFERER,
        },
      },

      // ── Esri World Geocoder (no Referer needed) ───────────────────────────
      "/proxy/geocode": {
        target: "https://geocode.arcgis.com",
        changeOrigin: true,
        rewrite: (path: string) =>
            path.replace(
                "/proxy/geocode",
                "/arcgis/rest/services/World/GeocodeServer/findAddressCandidates",
            ),
      },
    },
  }
})