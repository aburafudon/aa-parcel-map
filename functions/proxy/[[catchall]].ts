const ARCGIS_REFERER = "https://experience.arcgis.com";

const UTILITY_SERVICE_IDS = [
    "2aabce451f2e4ac090b4fbad5108a506", // TaxParcels/MapServer
    "99c75a4f7bdd4ec0a17c2babb2ccb997", // TaxParcelsTypes/FeatureServer/2
    "f67d6c1eeb2b44f5976a686e6d1e3714", // TaxParcelsTypes/FeatureServer/1
    "6111651f9dec4d12b762f344c7d898d1", // TaxParcelsTypes/FeatureServer/55
    "e07bf23f947f439fac270cc2fede57d3", // CityOwnedLand/MapServer
];

export async function onRequest(context: any) {
    const request = context.request;
    const url = new URL(request.url);
    const path = url.pathname;

    let targetHost = "";
    let targetPath = path;
    let injectArcGisHeaders = false;

    // ── Route Matching & Rewriting ───────────────────────────────────────

    if (path.startsWith("/proxy/utility/")) {
        const id = path.split("/")[3];
        if (UTILITY_SERVICE_IDS.includes(id)) {
            targetHost = "https://utility.arcgis.com";
            targetPath = path.replace(`/proxy/utility/${id}`, `/usrsvcs/servers/${id}`);
            injectArcGisHeaders = true;
        } else {
            return new Response("Unauthorized Service ID", { status: 403 });
        }
    }
    else if (path.startsWith("/proxy/washtenaw")) {
        targetHost = "https://utility.arcgis.com";
        targetPath = path.replace(
            "/proxy/washtenaw",
            "/usrsvcs/servers/2aabce451f2e4ac090b4fbad5108a506/rest/services/TaxParcels/MapServer/0/"
        );
        injectArcGisHeaders = true;
    }
    else if (path.startsWith("/proxy/geocode")) {
        targetHost = "https://geocode.arcgis.com";
        targetPath = path.replace(
            "/proxy/geocode",
            "/arcgis/rest/services/World/GeocodeServer/findAddressCandidates"
        );
    }
    else {
        return new Response("Proxy Route Not Found", { status: 404 });
    }

    // ── Construct the outgoing request ───────────────────────────────────

    const targetUrl = targetHost + targetPath + url.search;
    const proxyHeaders = new Headers(request.headers);

    proxyHeaders.delete("Host");

    if (injectArcGisHeaders) {
        proxyHeaders.set("Referer", ARCGIS_REFERER);
        proxyHeaders.set("Origin", ARCGIS_REFERER);
    }

    const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: proxyHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
        redirect: "follow",
    });

    // ── Fetch and Return ─────────────────────────────────────────────────
    try {
        const response = await fetch(proxyRequest);

        // We don't need CORS headers here because the function runs on the same origin as the frontend
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers, // Pass back ArcGIS headers (like content-type)
        });
    } catch (error) {
        return new Response(`Proxy Error: ${(error as Error).message}`, { status: 500 });
    }
}