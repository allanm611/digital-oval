export interface CreativeTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  channel: 'SMS' | 'Email' | 'Push' | 'InApp' | 'Web' | 'IVR' | 'USSD' | 'WhatsApp';
  locale: string;
  title?: string;
  body_text?: string;
  body_html?: string;
  variables?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateCreativeTemplateRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  primaryChannel: 'SMS' | 'Email' | 'Push' | 'InApp' | 'Web' | 'IVR' | 'USSD' | 'WhatsApp';
  locale?: string;
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, any>;
}

export interface UpdateCreativeTemplateRequest extends Partial<CreateCreativeTemplateRequest> {}
