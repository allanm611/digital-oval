// Channel validation
export type CreativeChannel =
  | "SMS"
  | "Email"
  | "Push"
  | "InApp"
  | "Web"
  | "IVR"
  | "USSD"
  | "WhatsApp";

export const VALID_CHANNELS: CreativeChannel[] = [
  "SMS",
  "Email",
  "Push",
  "InApp",
  "Web",
  "IVR",
  "USSD",
  "WhatsApp",
];

export type Locale = string;

// System-wide locales - matches SettingsPage languages
export const COMMON_LOCALES: Locale[] = [
  "en", // English
  "en-US", // English - United States
  "en-GB", // English - United Kingdom
  "fr", // French
  "fr-CA", // French - Canada
  "fr-FR", // French - France
  "es", // Spanish
  "es-ES", // Spanish - Spain
  "es-MX", // Spanish - Mexico
  "sw", // Swahili
  "sw-UG", // Swahili - Uganda
  "sw-KE", // Swahili - Kenya
];

// Main creative data structure - matches backend response exactly
export interface OfferCreative {
  id: number;
  offer_id: number;
  template_type_id?: number;
  channel: CreativeChannel; // One of: "SMS", "Email", "Push", "InApp", "Web", "IVR", "USSD", "WhatsApp"
  locale: Locale; // Pattern: ^[a-z]{2}(-[A-Z]{2})?$ (e.g., "en", "en-US", "fr", "fr-CA")
  name?: string;
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, string | number | boolean>; // Key-value pairs for template variables
  default_values?: Record<string, string | number | boolean>; // Default values for variables
  required_variables?: string[]; // List of variable names that must be provided when rendering
  version?: number;
  is_active?: boolean;
  is_latest?: boolean;
  /** When true on create, backend also copies this creative into offer_creatives_template. */
  save_as_template?: boolean;
  created_at?: string; // ISO timestamp
  updated_at?: string; // ISO timestamp
  created_by?: number; // User ID
  updated_by?: number; // User ID
}

// Create creative request - matches backend requirements
export interface CreateOfferCreativeRequest {
  // Required fields
  offer_id: number; // Must be positive integer, offer must exist
  channel: CreativeChannel; // Must be one of VALID_CHANNELS (case-sensitive)
  locale: Locale; // Must match pattern ^[a-z]{2}(-[A-Z]{2})?$, defaults to "en" if not provided
  name: string; // Required: name for the creative

  // Optional fields
  title?: string; // Trimmed if provided, at least one of title/text_body/html_body should be provided
  text_body?: string; // Trimmed if provided
  html_body?: string; // Trimmed if provided
  template_type_id?: number; // Must be positive integer if provided, template must exist
  variables?: Record<string, string | number | boolean>; // Key-value pairs for template variables
  default_values?: Record<string, string | number | boolean>; // Default values for variables
  required_variables?: string[]; // List of variable names that must be provided when rendering
  version?: number; // Must be positive integer if provided, backend auto-assigns if not provided
  is_active?: boolean; // Default: true
  created_by?: number; // Must be positive integer if provided
  /**
   * When true, the backend also inserts a reusable row into
   * cvm.offer_creatives_template (no offer_id) so other offers can reuse it.
   * Create-only; ignored on update.
   */
  save_as_template?: boolean;
}

/** Collect {{placeholder}} keys from creative content for template variables. */
export function collectPlaceholderVariables(
  ...contents: Array<string | undefined | null>
): Record<string, string> {
  const keys = new Set<string>();
  const pattern = /\{\{\s*([^{}]+?)\s*\}\}/g;
  for (const content of contents) {
    if (!content) continue;
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content))) {
      const key = match[1].trim();
      if (key) keys.add(key);
    }
  }
  const variables: Record<string, string> = {};
  keys.forEach((key) => {
    variables[key] = "";
  });
  return variables;
}

// Update creative request
export interface UpdateOfferCreativeRequest {
  template_type_id?: number;
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, string | number | boolean>;
  updated_by?: number;
}

// Update content only
export interface UpdateContentRequest {
  title?: string;
  text_body?: string;
  html_body?: string;
  updated_by?: number;
}

// Update variables only
export interface UpdateVariablesRequest {
  variables: Record<string, string | number | boolean>;
  updated_by?: number;
}

// Clone request
export interface CloneCreativeRequest {
  newLocale?: string; // Required for clone-locale
  newChannel?: CreativeChannel; // Required for clone-channel
  created_by?: number;
}

// Create new version request
export interface CreateVersionRequest {
  created_by?: number;
}

// Render request
export interface RenderCreativeRequest {
  variableOverrides?: Record<string, string | number | boolean>;
}

// Render response
export interface RenderCreativeResponse {
  rendered_title?: string;
  rendered_text_body?: string;
  rendered_html_body?: string;
}

// Search params
export interface SearchCreativeParams {
  searchTerm: string; // Required - backend expects searchTerm (not query or q)
  offer_id?: number;
  channel?: CreativeChannel;
  locale?: string;
  template_type_id?: number;
  is_active?: boolean;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

// Super search params (advanced)
export interface SuperSearchCreativeParams {
  searchTerm?: string; // Changed from query to searchTerm to match backend
  offer_id?: number;
  channel?: CreativeChannel;
  locale?: string;
  template_type_id?: number;
  is_active?: boolean;
  version?: number;
  created_by?: number;
  updated_by?: number;
  created_from?: string;
  created_to?: string;
  limit?: number;
  offset?: number;
  skipCache?: boolean;
}

// Rollback request
export interface RollbackCreativeRequest {
  offerId: number; // Required
  channel: CreativeChannel; // Required
  locale: string; // Required
  version: number; // Required - version to rollback to
  updated_by?: number; // Optional
}

// Stats response
export interface CreativeStats {
  total_creatives: number;
  active_creatives: number;
  by_channel: Record<CreativeChannel, number>;
  by_locale: Record<string, number>;
  total_versions: number;
}

// Channel coverage stats
export interface ChannelCoverageStats {
  offer_id: number;
  total_channels: number;
  channels: CreativeChannel[];
  coverage_percentage: number;
  missing_channels: CreativeChannel[];
}

// Base response structure
export interface BaseResponse<T> {
  success: boolean;
  data: T;
  source?: "cache" | "database" | "database-forced";
}

// Paginated response
export interface PaginatedResponse<T> extends BaseResponse<T[]> {
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

// Response types
export interface OfferCreativeResponse extends BaseResponse<OfferCreative> {
  insertId?: number;
  /** Present when create was called with save_as_template: true */
  template?: Record<string, unknown> | null;
}

export type OfferCreativesResponse = PaginatedResponse<OfferCreative>;
export type CreativeStatsResponse = BaseResponse<CreativeStats>;
export type ChannelCoverageResponse = BaseResponse<ChannelCoverageStats>;
export type RenderCreativeResponseType = BaseResponse<RenderCreativeResponse>;
