export type DataAccessLevel =
  | "public"
  | "internal"
  | "confidential"
  | "restricted"
  | string;

export type Role = {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  parent_role_id?: number | null;
  role_level: number;
  is_system_role: boolean;
  is_active: boolean;
  is_default: boolean;
  data_access_level: DataAccessLevel;
  max_users?: number | null;
  current_user_count: number;
  metadata?: Record<string, any> | null;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  created_by: number;
};

export type CreateRoleRequest = {
  name: string;
  code: string;
  description?: string;
  parent_role_id?: number;
  role_level?: number;
  is_system_role?: boolean;
  data_access_level?: DataAccessLevel;
  max_users?: number;
  is_default?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  userId: number;
};

export type UpdateRoleRequest = {
  name?: string;
  description?: string;
  parent_role_id?: number;
  role_level?: number;
  data_access_level?: DataAccessLevel;
  max_users?: number;
  is_default?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  userId: number;
};

export type CloneRoleRequest = {
  newCode: string;
  newName?: string;
  userId: number;
};

export type RoleListMeta = {
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  isCachedResponse?: boolean;
  cacheDurationSec?: number;
  [key: string]: unknown;
};

export type RoleListResult = {
  roles: Role[];
  meta?: RoleListMeta;
};

export type ListRolesQuery = {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
  skipCache?: boolean;
};

export type RoleSearchQuery = {
  searchTerm?: string;
  q?: string;
  limit?: number;
  offset?: number;
  activeOnly?: boolean;
  includeDeleted?: boolean;
  skipCache?: boolean;
};

export type UserLimitCheckResponse = {
  role_id: number;
  max_users: number | null;
  current_user_count: number;
  limit_reached: boolean;
};

// Permission types
export type Permission = {
  id: number;
  name: string;
  code: string;
  description?: string;
  action: string;
  resource_id?: number | null;
  resource_type_id?: number | null;
  is_active: boolean;
  is_deprecated: boolean;
  replacement_permission_id?: number | null;
  is_sensitive: boolean;
  requires_mfa: boolean;
  requires_justification: boolean;
  is_system_permission: boolean;
  created_at: string;
  updated_at: string;
  created_by: number;
};

export type CreatePermissionRequest = {
  name: string;
  code: string;
  description?: string;
  action: string;
  resource_id?: number;
  resource_type_id?: number;
  is_sensitive?: boolean;
  requires_mfa?: boolean;
  requires_justification?: boolean;
};

export type UpdatePermissionRequest = {
  description?: string;
  action?: string;
  is_sensitive?: boolean;
  requires_mfa?: boolean;
  requires_justification?: boolean;
};

export type PermissionListResult = {
  permissions: Permission[];
  meta?: RoleListMeta;
};

// Role-Permission types
export type RolePermission = {
  id: number;
  role_id: number;
  permission_id: number;
  is_active: boolean;
  created_at: string;
  created_by: number;
};

export type AssignPermissionRequest = {
  permissionId?: number;
  permissionIds?: number[];
  createdBy?: number;
};

export type SyncPermissionsRequest = {
  permissionIds: number[];
  createdBy?: number;
};

export type RemovePermissionRequest = {
  permissionIds?: number[];
  removeAll?: boolean;
};

export type RolePermissionListResult = {
  rolePermissions: RolePermission[];
  meta?: RoleListMeta;
};

export type PermissionCountResponse = {
  role_id: number;
  total_permissions: number;
  active_permissions: number;
  sensitive_permissions: number;
  mfa_required_permissions: number;
};

export type RolePermissionCheckResponse = {
  role_id: number;
  permission_id: number;
  has_permission: boolean;
};

export type RolePermissionCheckAnyResponse = {
  role_id: number;
  has_any_permission: boolean;
  matching_permissions: number[];
};

export type RolePermissionCheckAllResponse = {
  role_id: number;
  has_all_permissions: boolean;
  total_required: number;
  found: number;
  missing_permissions: number[];
};

export type PermissionCountByRoleResponse = {
  permission_id: number;
  total_roles: number;
  active_roles: number;
};
