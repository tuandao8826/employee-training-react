import { apiRequest } from './apiClient';

export const healthApi = {
  check: () => apiRequest('/Tests/Health'),
};