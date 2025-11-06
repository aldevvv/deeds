export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | 'ADMINISTRATOR';
  adminTitle?: 'SENIOR_MANAGER' | 'MANAGER_SUB_BIDANG' | 'ASISTEN_MANAGER';
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}
