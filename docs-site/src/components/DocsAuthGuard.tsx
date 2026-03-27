/**
 * Wraps doc pages to check authentication
 * Shows loading state while validating token
 * Redirects to login if not authenticated
 */

import React, { ReactNode } from 'react';
import { useDocsAuth } from '../hooks/useDocsAuth';

interface DocsAuthGuardProps {
  children: ReactNode;
}

/**
 * Guard component for protecting docs pages
 * Checks if user is authenticated (token is valid)

 */
export function DocsAuthGuard({ children }: DocsAuthGuardProps): JSX.Element {
  const { isAuthenticated, isLoading } = useDocsAuth();

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '16px',
          color: '#666',
        }}
      >
        <div>Loading documentation...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          fontSize: '16px',
          color: '#d32f2f',
        }}
      >
        <div>Please log in to access the documentation</div>
      </div>
    );
  }

  return <>{children}</>;
}


interface DocsEditButtonProps {
  onEdit: () => void;
}

export function DocsEditButton({ onEdit }: DocsEditButtonProps): JSX.Element {
  return (
    <button
      onClick={onEdit}
      style={{
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
      }}
    >
      ✏️ Edit this page
    </button>
  );
}
