import { buildApiUrl, getAuthHeaders } from "../../../shared/services/api";
import { ApiResponse } from "../../../shared/types/api";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";

export enum ChannelEnum {
  SMS = 'SMS',
  Email = 'Email',
  Push = 'Push',
  InApp = 'InApp',
  Web = 'Web',
  IVR = 'IVR',
  USSD = 'USSD',
  WhatsApp = 'WhatsApp',
}

export const CHANNEL_OPTIONS = [
  { label: 'SMS', value: ChannelEnum.SMS },
  { label: 'Email', value: ChannelEnum.Email },
  { label: 'Push', value: ChannelEnum.Push },
  { label: 'InApp', value: ChannelEnum.InApp },
  { label: 'Web', value: ChannelEnum.Web },
  { label: 'IVR', value: ChannelEnum.IVR },
  { label: 'USSD', value: ChannelEnum.USSD },
  { label: 'WhatsApp', value: ChannelEnum.WhatsApp },
];

export async function getChannelOptionsFromAPI() {
  try {
    const channels = await communicationChannelService.getAll();
    return (channels || [])
      .filter((ch: any) => ch.is_active !== false)
      .map((ch: any) => ({
        label: ch.name,
        value: ch.code?.toUpperCase() || ch.name,
      }));
  } catch (error) {
    console.error("Failed to fetch channels from API, using defaults:", error);
    return CHANNEL_OPTIONS;
  }
}

export interface CreativeTemplate {
  id: number;
  name: string;
  code: string;
  description?: string;
  is_active: boolean;
  channel: ChannelEnum | string;
  locale: string;
  title?: string;
  /** Canonical body fields from cvm.offer_creatives_template */
  text_body?: string;
  html_body?: string;
  /** Legacy aliases (older template_types / UI) */
  body_text?: string;
  body_html?: string;
  variables?: Record<string, any>;
  template_type_id?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
  primaryChannel?: ChannelEnum | string;
}

export interface CreateCreativeTemplateRequest {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
  primaryChannel: ChannelEnum;
  locale?: string;
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, any>;
}

export interface UpdateCreativeTemplateRequest extends Partial<CreateCreativeTemplateRequest> {}

const BASE_URL = buildApiUrl("/creative-template");

export function creativeTemplateText(
  template: Pick<CreativeTemplate, "text_body" | "body_text"> | null | undefined,
): string {
  return template?.text_body || template?.body_text || "";
}

export function creativeTemplateHtml(
  template: Pick<CreativeTemplate, "html_body" | "body_html"> | null | undefined,
): string {
  return template?.html_body || template?.body_html || "";
}

/** Channel match for EMAIL vs Email vs "SMS Normal". */
export function matchesTemplateChannel(
  templateChannel?: string | null,
  creativeChannel?: string | null,
): boolean {
  if (!templateChannel || !creativeChannel) return true;
  const template = templateChannel.toUpperCase();
  const creative = creativeChannel.toUpperCase();
  return (
    template === creative ||
    template.includes(creative) ||
    creative.includes(template)
  );
}

export function normalizeCreativeTemplate(raw: unknown): CreativeTemplate {
  const item = (raw || {}) as Record<string, unknown>;
  const text =
    (typeof item.text_body === "string" && item.text_body) ||
    (typeof item.body_text === "string" && item.body_text) ||
    "";
  const html =
    (typeof item.html_body === "string" && item.html_body) ||
    (typeof item.body_html === "string" && item.body_html) ||
    "";
  const channel = String(item.channel || item.primaryChannel || "");

  return {
    id: Number(item.id) || 0,
    name: String(item.name || ""),
    code: item.code != null ? String(item.code) : "",
    description:
      item.description != null ? String(item.description) : undefined,
    is_active: item.is_active !== false,
    channel: channel as ChannelEnum,
    locale: String(item.locale || "en"),
    title: item.title != null ? String(item.title) : undefined,
    text_body: text || undefined,
    html_body: html || undefined,
    body_text: text || undefined,
    body_html: html || undefined,
    variables:
      item.variables && typeof item.variables === "object"
        ? (item.variables as Record<string, unknown>)
        : {},
    template_type_id:
      item.template_type_id != null ? Number(item.template_type_id) : undefined,
    created_at: item.created_at != null ? String(item.created_at) : undefined,
    updated_at: item.updated_at != null ? String(item.updated_at) : undefined,
    created_by: item.created_by != null ? Number(item.created_by) : undefined,
    updated_by: item.updated_by != null ? Number(item.updated_by) : undefined,
    primaryChannel: channel as ChannelEnum,
  };
}

class CreativeTemplateService {
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

    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.success === false) {
      throw new Error(
        payload?.error ||
          payload?.message ||
          `HTTP error! status: ${response.status}`,
      );
    }

    return payload as T;
  }

  /**
   * GET /creative-template
   * Lists reusable rows from cvm.offer_creatives_template (active only).
   * Optional ?channel=&locale= are case-insensitive on the backend.
   *
   * Note: POST/PUT/DELETE /creative-template currently still write cvm.templates
   * (legacy TemplateEntity). Templates created via offer_creative.save_as_template
   * land in offer_creatives_template and are what this GET returns.
   */
  async getCreativeTemplates(filters?: {
    channel?: string;
    locale?: string;
  }): Promise<ApiResponse<CreativeTemplate[]>> {
    const params = new URLSearchParams();
    if (filters?.channel) params.set("channel", filters.channel);
    if (filters?.locale) params.set("locale", filters.locale);
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await this.request<
      ApiResponse<CreativeTemplate[] | CreativeTemplate> & { total?: number }
    >(query);

    const rows = Array.isArray(response.data)
      ? response.data
      : response.data
        ? [response.data]
        : [];

    return {
      ...response,
      success: response.success !== false,
      data: rows.map(normalizeCreativeTemplate),
    };
  }

  /**
   * GET /creative-template/:id
   * Single reusable template. Accepts either a bare object or a one-item array.
   */
  async getCreativeTemplateById(id: number): Promise<CreativeTemplate> {
    const response = await this.request<{
      success: boolean;
      data?: unknown;
      error?: string;
    }>(`/${id}`);

    const raw = Array.isArray(response.data)
      ? response.data[0]
      : response.data;
    if (!raw) {
      throw new Error("Creative template not found");
    }
    return normalizeCreativeTemplate(raw);
  }

  async createCreativeTemplate(data: CreateCreativeTemplateRequest): Promise<CreativeTemplate> {
    const response = await this.request<{ success: boolean; data?: CreativeTemplate; error?: string }>("", {
      method: "POST",
      body: JSON.stringify(data),
    });

    if (!response.success) {
      throw new Error(response.error || "Failed to create template");
    }

    return normalizeCreativeTemplate(
      response.data || (response as unknown as CreativeTemplate),
    );
  }

  async createCreativeTemplates(data: CreateCreativeTemplateRequest[]): Promise<ApiResponse<CreativeTemplate[]>> {
    return this.request<ApiResponse<CreativeTemplate[]>>("", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateCreativeTemplate(id: number, data: UpdateCreativeTemplateRequest): Promise<ApiResponse<CreativeTemplate>> {
    const response = await this.request<{ success: boolean; data?: CreativeTemplate; error?: string }>(
      `/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    if (!response.success) {
      throw new Error(response.error || "Failed to update template");
    }

    return response as ApiResponse<CreativeTemplate>;
  }

  async deleteCreativeTemplate(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.request<ApiResponse<{ message: string }>>(`/${id}`, {
      method: "DELETE",
    });
  }
}

export const creativeTemplateService = new CreativeTemplateService();
