import { apiRequest } from "./apiClient";

const baseUrl = "/api";

export const authApi = {
  login(username, password) {
    return apiRequest("/Users/Session", {
      baseUrl,
      csrf: true,
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  async profile(signal) {
    const {
      body: { data },
      headers,
    } = await apiRequest("/Users/Me", {
      baseUrl,
      includeHeaders: true,
      signal,
    });
    if (!data?.id) throw new Error("API returned no user profile.");
    const expirySeconds = Number(headers.get("X-Session-Expires-At"));
    return {
      user: data,
      expiresAt: expirySeconds > 0 ? expirySeconds * 1000 : null,
    };
  },

  logout: () =>
    apiRequest("/Users/Session", { baseUrl, csrf: true, method: "DELETE" }),
};
