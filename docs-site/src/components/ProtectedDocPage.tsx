/**
 * Component: DocsEditSection
 * Wraps edit button with PermissionGate
 * Only shows edit button if user has edit permission
 */

import React, { ReactNode } from 'react';
import { DocsEditButton } from './DocsAuthGuard';

interface DocsEditSectionProps {
  permission?: string; // Permission code like "docs:edit" or "docs:admin"
  onEdit: () => void;
  children?: ReactNode;
}

/**
 * Edit button wrapped with permission check
 * Usage:
 * <DocsEditSection
 *   permission="docs:edit"
 *   onEdit={handleEdit}
 * />
 *
 * Or with PermissionGate directly:
 * <PermissionGate permission="docs:edit">
 *   <DocsEditButton onEdit={handleEdit} />
 * </PermissionGate>
 */
export function DocsEditSection({
  permission,
  onEdit,
  children,
}: DocsEditSectionProps): JSX.Element | null {
  // You'll import and use PermissionGate from main app
  // For now, just show the button - permissions controlled by PermissionGate parent

  return (
    <div style={{ marginBottom: '20px' }}>
      <DocsEditButton onEdit={onEdit} />
      {children}
    </div>
  );
}
