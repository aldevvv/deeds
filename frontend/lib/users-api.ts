const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
  adminTitle?: 'SENIOR_MANAGER' | 'MANAGER_SUB_BIDANG' | 'ASISTEN_MANAGER';
  createdAt: string;
  updatedAt: string;
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
  getAllUsers: (token: string): Promise<User[]> =>
    fetchApi('/users', token),

  getUserById: (token: string, userId: string): Promise<User> =>
    fetchApi(`/users/${userId}`, token),

  updateUserRole: (
    token: string,
    userId: string,
    data: {
      role: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
      adminTitle?: 'SENIOR_MANAGER' | 'MANAGER_SUB_BIDANG' | 'ASISTEN_MANAGER';
    }
  ): Promise<User> =>
    fetchApi(`/users/${userId}/role`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteUser: (token: string, userId: string): Promise<{ message: string }> =>
    fetchApi(`/users/${userId}`, token, {
      method: 'DELETE',
    }),
};
