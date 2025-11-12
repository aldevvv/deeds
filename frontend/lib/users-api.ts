import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface PendingUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  adminTitle?: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
  adminTitle?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface UpdateUserRolePayload {
  role: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
  adminTitle?: string;
}

async function fetchApi(endpoint: string, token: string, options?: RequestInit) {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'An error occurred');
  }

  return response.json();
}

export const usersApi = {
  getPendingUsers: (token: string): Promise<PendingUser[]> =>
    fetchApi('/users/pending', token),

  getAllUsers: (token: string): Promise<User[]> =>
    fetchApi('/users', token),

  updateUserRole: (token: string, userId: string, payload: UpdateUserRolePayload): Promise<{ message: string; user: User }> =>
    fetchApi(`/users/${userId}/role`, token, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  approveUser: (token: string, userId: string): Promise<{ message: string }> =>
    fetchApi(`/users/${userId}/approve`, token, {
      method: 'POST',
    }),

  rejectUser: (token: string, userId: string): Promise<{ message: string }> =>
    fetchApi(`/users/${userId}/reject`, token, {
      method: 'POST',
    }),
};
