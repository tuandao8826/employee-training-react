import { apiRequest } from "./apiClient";

const request = (endpoint, options = {}) =>
  apiRequest(endpoint, { ...options, baseUrl: "/api", requiresSession: true });

export const courseParticipantsApi = {
  async list(courseId, page = 1, pageSize = 8, signal, keyword = "") {
    const search = keyword
      ? `&Search.Keyword=${encodeURIComponent(keyword)}`
      : "";
    const { data } = await request(
      `/CourseParticipants?courseId=${encodeURIComponent(courseId)}&page=${page}&pageSize=${pageSize}${search}`,
      { signal },
    );
    return data;
  },

  async listAll(courseId) {
    const participants = [];
    let page = 1;
    let hasNext;
    do {
      const result = await this.list(courseId, page, 100);
      participants.push(...result.pageItems);
      hasNext = result.pageInfo.hasNext;
      page += 1;
    } while (hasNext);
    return participants;
  },
};
