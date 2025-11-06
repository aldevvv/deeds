const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi(endpoint: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, error.message || 'An error occurred');
  }

  return response.json();
}

export const api = {
  auth: {
    register: (data: {
      email: string;
      password: string;
      fullName: string;
    }) => fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    login: (data: {
      email: string;
      password: string;
    }) => fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

    getCurrentUser: (token: string) => fetchApi('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  },
};
