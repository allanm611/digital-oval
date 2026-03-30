// ============ Metadata Types ============
export interface DocumentMetadata {
  created_by: number;
  created_at: string;
  updated_by: number;
  updated_at: string;
  version_history?: VersionHistory[];
  tags?: string[];
}

export interface VersionHistory {
  version: number;
  changed_by: number;
  changed_at: string;
  change_summary?: string;
}

// ============ Sections Types ============
export interface DocumentSection {
  id: string;
  title: string;
  level: number; // 1 for h1, 2 for h2, etc.
  order: number;
}

// ============ Sidebar Types ============
export interface SidebarItem {
  type: 'doc' | 'category';
  id?: string;
  label?: string;
  items?: SidebarItem[];
}

export interface SidebarCategory {
  type: 'category';
  label: string;
  items: SidebarItem[];
}

export interface SidebarDoc {
  type: 'doc';
  id: string;
  label?: string;
}

export interface SidebarsConfig {
  [key: string]: (string | SidebarItem)[];
}

// ============ Document Category Types ============
export interface DocCategory {
  category_id: number;
  parent_category_id?: number | null;
  name: string;
  code: string;
  label?: string;
  description?: string;
  level: number;
  path: string;
  section: string;
  icon?: string;
  display_order: number;
  is_active: boolean;
}

// ============ Main Document Types ============
export interface DocDocument {
  doc_id: number;
  category_id: number;
  title: string;
  slug: string;
  doc_type: 'table' | 'enum' | 'overview' | 'guide' | 'erd' | 'api';
  version: number;
  status: string;
  summary?: string;
  markdown_content: string;
  sections?: DocumentSection[];
  footer?: string;
  last_modified: string;
  modified_by?: number;
  metadata?: DocumentMetadata;
  is_active: boolean;
}

// ============ Table Column Types ============
export interface DocTableColumn {
  column_id: number;
  doc_id: number;
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  default_value?: string;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_key_reference?: string;
  constraints: string[];
  description: string;
  business_rules?: string;
  allowed_values?: string[];
  sample_data?: string;
  display_order: number;
}

// ============ Search Result Types ============
export interface DocumentationSearchResult {
  doc_id: number;
  title: string;
  slug: string;
  doc_type: string;
  summary?: string;
  match_score: number;
}

// ============ Request Types ============
export interface CreateDocumentRequest {
  category_id: number;
  title: string;
  slug?: string;
  doc_type: 'table' | 'enum' | 'overview' | 'guide' | 'erd' | 'api';
  summary?: string;
  markdown_content: string;
  sections?: DocumentSection[];
  metadata?: DocumentMetadata;
  version?: number;
  footer?: string;
}

export type UpdateDocumentRequest = Partial<CreateDocumentRequest>;

export interface GetAllDocumentsQuery {
  limit?: number;
  offset?: number;
  category_id?: number;
  doc_type?: 'table' | 'enum' | 'overview' | 'guide' | 'erd' | 'api';
  q?: string;
  sort_by?: 'title' | 'created_at' | 'last_modified';
  sort_order?: 'asc' | 'desc';
}

// ============ Response Types ============
export interface DocumentListResponse {
  documents: DocDocument[];
  total_count: number;
  category?: Partial<DocCategory>;
  pagination: {
    limit: number;
    offset: number;
  };
}

export interface DocumentsListResponse {
  documents: DocDocument[];
  total_count: number;
  pagination: {
    limit: number;
    offset: number;
    has_more: boolean;
  };
  filters?: {
    category_id?: number;
    doc_type?: string;
    search?: string;
  };
}

export interface TableDocumentationResponse extends DocDocument {
  columns: DocTableColumn[];
  relationships: Record<string, unknown>[];
}

export interface DocumentResponse extends DocDocument {
  category?: DocCategory;
}
