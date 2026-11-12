
const API_BASE_URL = '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    const error = new Error(`API Error: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;

  return response.json();
}
