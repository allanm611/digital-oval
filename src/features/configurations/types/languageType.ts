export interface Language {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  language_code: string;
  country?: string;
  character_set?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateLanguageRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  language_code: string;
  country?: string;
  character_set?: string;
}

export interface UpdateLanguageRequest extends Partial<CreateLanguageRequest> {}
