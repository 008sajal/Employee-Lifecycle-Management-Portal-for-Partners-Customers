export function apiBaseUrl() {
  // Use env if provided; otherwise default to local API.
  // This prevents calls to /undefined/... when .env.local is missing.
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
}

export function apiUrl(path) {
  const base = apiBaseUrl().replace(/\/$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function authHeaders(extra) {
  const token = getAccessToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}
