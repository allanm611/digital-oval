export interface CharacterSet {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  message_type: 'SMS' | 'FLASH_SMS' | 'UNICODE' | 'BINARY' | 'USSD';
  character_set_type: 'GSM7' | 'UCS2' | 'UTF8' | 'ISO-8859-1';
  character_set_size: number;
  standard_chars: string;
  double_chars?: string;
  triple_chars?: string;
  quad_chars?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateCharacterSetRequest {
  name: string;
  description?: string;
  is_active?: boolean;
  message_type: 'SMS' | 'FLASH_SMS' | 'UNICODE' | 'BINARY' | 'USSD';
  character_set_type: 'GSM7' | 'UCS2' | 'UTF8' | 'ISO-8859-1';
  character_set_size: number;
  standard_chars: string;
  double_chars?: string;
  triple_chars?: string;
  quad_chars?: string;
}

export interface UpdateCharacterSetRequest extends Partial<CreateCharacterSetRequest> {}
