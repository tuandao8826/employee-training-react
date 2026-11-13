import { currentSessionVersion, expireSession } from "./authSession";

const API_BASE_URL = "/api/v1";

export async function apiRequest(
  endpoint,
  {
    baseUrl = API_BASE_URL,
    csrf = false,
    requiresSession = false,
    includeHeaders = false,
    ...options
  } = {},
) {
  const version = currentSessionVersion();
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (csrf) {
    const { token } = await apiRequest("/Users/Session/Csrf", {
      baseUrl: "/api",
      signal: options.signal,
    });
    if (!token) throw new Error("API returned no CSRF token.");
    headers.set("X-CSRF-Token", token);
  }

  if (requiresSession && version !== currentSessionVersion()) {
    throw new Error("The session changed before the request was sent.");
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    credentials: "same-origin",
    ...(requiresSession ? { cache: "no-store" } : {}),
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  // Some backend errors use a response envelope even when HTTP returns 200.
  const status = response.ok
    ? (data?.statusCode ?? data?.StatusCode ?? response.status)
    : response.status;
  if (status >= 400) {
    if (status === 401 && requiresSession) expireSession(version);
    const error = new Error(
      data?.message ?? data?.Message ?? `API Error: ${status}`,
    );
    error.status = status;
    throw error;
  }

  if (data === null) throw new Error("API returned an invalid JSON response.");
  return includeHeaders ? { body: data, headers: response.headers } : data;
}
