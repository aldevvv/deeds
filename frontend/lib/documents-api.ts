import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type DocumentStatus = 'DRAFT' | 'PENDING' | 'SIGNED' | 'REJECTED' | 'COMPLETED';

export interface Document {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  status: DocumentStatus;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
    email: string;
  };
  signatures: Signature[];
  createdAt: string;
  updatedAt: string;
}

export interface Signature {
  id: string;
  documentId: string;
  userId: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role?: string;
    adminTitle?: string;
  };
  signedAt?: string;
  status: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStats {
  total: number;
  pending: number;
  signed: number;
  completed: number;
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

export interface CreateDocumentDto {
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  signatories?: Array<{ userId: string; order: number }>;
}

export interface UserOption {
  id: string;
  fullName: string;
  email: string;
  role: string;
  adminTitle?: string;
}

export const documentsApi = {
  getUserDocuments: (token: string, status?: DocumentStatus): Promise<Document[]> => {
    const queryParams = status ? `?status=${status}` : '';
    return fetchApi(`/documents${queryParams}`, token);
  },

  getDocumentById: (token: string, documentId: string): Promise<Document> =>
    fetchApi(`/documents/${documentId}`, token),

  getDocumentStats: (token: string): Promise<DocumentStats> =>
    fetchApi('/documents/stats', token),

  getGlobalStats: (token: string): Promise<{ total: number; pending: number; signed: number; rejected: number; completed: number }> =>
    fetchApi('/documents/stats/global', token),

  createDocument: (token: string, data: CreateDocumentDto): Promise<Document> =>
    fetchApi('/documents', token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAllUsers: (token: string): Promise<UserOption[]> =>
    fetchApi('/documents/users/all', token),

  getPendingSignatures: (token: string): Promise<Document[]> =>
    fetchApi('/documents/pending-signatures', token),

  signDocument: (token: string, signatureId: string): Promise<{ message: string }> =>
    fetchApi(`/documents/sign/${signatureId}`, token, {
      method: 'POST',
    }),

  signDocumentWithSignature: async (
    signatureId: string,
    signatureImage: string,
    position: { x: number; y: number; width: number; height: number; page: number }
  ): Promise<{ message: string }> => {
    const token = getToken();
    if (!token) throw new Error('No authentication token');
    
    return fetchApi(`/documents/sign/${signatureId}/with-signature`, token, {
      method: 'POST',
      body: JSON.stringify({
        signatureImage: signatureImage,
        position,
      }),
    });
  },

  rejectDocument: (token: string, signatureId: string, reason?: string): Promise<{ message: string }> =>
    fetchApi(`/documents/reject/${signatureId}`, token, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  uploadFile: async (token: string, file: File): Promise<{ filePath: string; fileName: string; fileSize: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    return response.json();
  },

  getViewUrl: (token: string, documentId: string): Promise<{ url: string }> =>
    fetchApi(`/documents/view/${documentId}`, token),

  downloadDocument: async (token: string, documentId: string): Promise<Blob> => {
    console.log('API: Downloading document', documentId);
    const response = await fetch(`${API_URL}/documents/download/${documentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('API: Response status', response.status, response.statusText);
    console.log('API: Response headers', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorMessage = 'Download failed';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        errorMessage = `Download failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    console.log('API: Blob size', blob.size, 'type', blob.type);
    return blob;
  },
};
