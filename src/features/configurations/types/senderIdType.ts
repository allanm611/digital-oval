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
