import { apiRequest } from "./apiClient";

const request = (endpoint, options = {}) => apiRequest(endpoint, {
  ...options, baseUrl: "/api", requiresSession: true,
  csrf: Boolean(options.method && options.method !== "GET"),
});

export const flightSchedulesApi = {
  async statistics({ dateFrom, dateTo, signal } = {}) {
    const params = new URLSearchParams();
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    const suffix = params.size ? `?${params}` : "";
    const { data } = await request(`/FlightSchedules/Statistics${suffix}`, { signal });
    return data;
  },
  async search({ page = 1, pageSize = 8, dateFrom, dateTo, searchType = "flight", searchTerm = "", signal }) {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (searchTerm.trim()) {
      const parameter = searchType === "stand" ? "stand" : searchType === "registration" ? "registrationNumber" : "flightNumber";
      params.set(parameter, searchTerm.trim());
    }
    const { data } = await request(`/FlightSchedules?${params}`, { signal });
    return data;
  },
  async detail(id) {
    const { data } = await request(`/FlightSchedules/${id}`);
    return data;
  },
  save(data) {
    return request(data.id ? `/FlightSchedules/${data.id}` : "/FlightSchedules", {
      method: data.id ? "PUT" : "POST", body: JSON.stringify(data),
    });
  },
  remove(id) { return request(`/FlightSchedules/${id}`, { method: "DELETE" }); },
  importPreview(file) {
    const body = new FormData(); body.append("file", file);
    return request("/FlightSchedules/Import/Preview", { method: "POST", body });
  },
  import(file) {
    const body = new FormData(); body.append("file", file);
    return request("/FlightSchedules/Import", { method: "POST", body });
  },
};
