// Client-side fetch helper.
// Next.js does NOT automatically prepend `basePath` to `fetch()` calls
// (unlike next/link and next/router), so API requests from the browser
// must include it explicitly. Keep this in sync with `basePath` in
// next.config.mjs — this is the single source of truth for client code.
export const BASE_PATH = "/appfund";

// Prefix an app-relative path (e.g. "/api/stats") with the basePath.
export const api = (path) => `${BASE_PATH}${path}`;

// Fetch a basePath-relative endpoint and parse the JSON response.
// For requests where you need to inspect res.ok/status, call fetch(api(path)) directly.
export const apiJson = async (path, options) => {
  const res = await fetch(api(path), options);
  return res.json();
};
