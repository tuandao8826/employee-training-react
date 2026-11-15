import { apiRequest } from "./apiClient";

export const dashboardApi = {
  async statistics(signal) {
    const { data } = await apiRequest("/Dashboard/Statistics", {
      baseUrl: "/api",
      requiresSession: true,
      signal,
    });
    return data;
  },
};
