export interface DocDocument {
  id: number;
  category_id: number;
  title: string;
  slug: string;
  doc_type: string;
  summary: string;
  markdown_content: string;
  sections?: Record<string, any>;
  metadata?: Record<string, any>;
  version: number;
  footer?: string;
  created_at: string;
  updated_at: string;
}

export interface DocCategory {
  category_id: number;
  parent_category_id: number | null;
  name: string;
  code: string;
  label: string;
  description: string;
  level: number;
  display_order: number;
  icon: string;
  section: string;
  path: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocVersion {
  version: number;
  created_at: string;
  created_by?: string;
  summary?: string;
}

export interface DocSearchResult {
  doc_id: number;
  title: string;
  slug: string;
  summary: string;
  doc_type: string;
  match_score: number;
}

export interface CreateDocPayload {
  category_id: number;
  title: string;
  slug: string;
  doc_type: string;
  summary: string;
  markdown_content: string;
  sections?: Record<string, any>;
  metadata?: Record<string, any>;
  version?: number;
  footer?: string;
}

export interface CreateCategoryPayload {
  name: string;
  code: string;
  label: string;
  description?: string;
  parent_category_id?: number | null;
  section?: string;
  icon?: string;
  display_order?: number;
}

export interface DocumentsListResponse {
  documents: DocDocument[];
  total_count: number;
}

export interface VersionsListResponse {
  slug: string;
  versions: DocVersion[];
  total_versions: number;
}


export interface CreateDocumentResponse {
  success: boolean;
  id: number;
  slug: string;
  title: string;
  message: string;
}

export interface CreateCategoryResponse {
  success: boolean;
  id: number;
  name: string;
  code: string;
  message: string;
}

export interface RollbackResponse {
  success: boolean;
  message: string;
  current_version: number;
}

export interface UploadImageResponse {
  success: boolean;
  image_id: number;
  image_url: string;
  key?: string;
}
