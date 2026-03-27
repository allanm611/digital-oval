import React from 'react';

interface EditButtonProps {
  docSlug: string;
  docTitle: string;
  docId?: string;
  canEdit?: boolean;
}

export function EditButton({
  docSlug,
  docTitle,
  docId,
  canEdit = true
}: EditButtonProps) {
  if (!canEdit) return null;

  return (
    <div style={{
      marginTop: '40px',
      paddingTop: '20px',
    }}>
      <a
        href={`/edit?slug=${docSlug}`}
        style={{
          background: 'none',
          border: 'none',
          color: '#0066cc',
          cursor: 'pointer',
          textDecoration: 'underline',
          fontSize: '18px',
          padding: 0,
          display: 'inline-block',
        }}
      >
        Edit this page
      </a>
    </div>
  );
}
