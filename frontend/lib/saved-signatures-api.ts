import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type SignatureType = "WRITE" | "UPLOAD" | "TYPE";

export interface SavedSignature {
  id: string;
  userId: string;
  name: string;
  type: SignatureType;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export const savedSignaturesApi = {
  async create(name: string, type: SignatureType, imageData: string): Promise<SavedSignature> {
    const token = getToken();
    const response = await fetch(`${API_URL}/saved-signatures`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, type, imageData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save signature");
    }

    return response.json();
  },

  async getAll(): Promise<SavedSignature[]> {
    const token = getToken();
    const response = await fetch(`${API_URL}/saved-signatures`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch signatures");
    }

    return response.json();
  },

  async delete(id: string): Promise<void> {
    const token = getToken();
    const response = await fetch(`${API_URL}/saved-signatures/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to delete signature");
    }
  },
};
