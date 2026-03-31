/**
 * Hook: useDocsPermission
 * Check if user has specific documentation permissions
 * Permissions: docs.read, docs.create, docs.update, docs.delete
 */

import { useEffect, useState } from 'react';
import { docsAuthService } from '../services/docsAuthService';

export interface UseDocsPermissionReturn {
  hasPermission: (permission: string) => boolean;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  isLoading: boolean;
}

/**
 * Hook to check user's documentation permissions
 */
export function useDocsPermission(): UseDocsPermissionReturn {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get permissions from localStorage (set by main app during auth)
    const storedPerms = docsAuthService.getStoredPermissions();
    setPermissions(storedPerms);
    setIsLoading(false);
  }, []);

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  return {
    hasPermission,
    canRead: hasPermission('docs.read'),
    canCreate: hasPermission('docs.create'),
    canUpdate: hasPermission('docs.update'),
    canDelete: hasPermission('docs.delete'),
    isLoading,
  };
}
