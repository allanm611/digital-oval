import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";

export interface SenderId {
  id: number;
  name: string;
  description?: string;
  gateway_key: 'INTERNAL' | 'EXTERNAL_PROVIDER_A' | 'EXTERNAL_PROVIDER_B' | 'MOCANA' | 'SMSGW_HUB';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateSenderIdRequest {
  name: string;
  description?: string;
  gateway_key: 'INTERNAL' | 'EXTERNAL_PROVIDER_A' | 'EXTERNAL_PROVIDER_B' | 'MOCANA' | 'SMSGW_HUB';
  is_active?: boolean;
}

export interface UpdateSenderIdRequest extends Partial<CreateSenderIdRequest> {}

const BASE_URL = buildApiUrl("/sender");

class SenderIdService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getSenderIds(): Promise<SenderId[]> {
    return this.request<SenderId[]>("");
  }

  async getSenderIdById(id: number): Promise<SenderId> {
    return this.request<SenderId>(`/${id}`);
  }

  async createSenderId(data: CreateSenderIdRequest): Promise<SenderId> {
    return this.request<SenderId>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateSenderId(id: number, data: UpdateSenderIdRequest): Promise<SenderId> {
    return this.request<SenderId>(`/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteSenderId(id: number): Promise<void> {
    return this.request<void>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const senderIdService = new SenderIdService();
