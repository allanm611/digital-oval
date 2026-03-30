import React from 'react';

interface EditButtonProps {
  docSlug: string;
  docTitle: string;
  docId?: string;
  canEdit?: boolean;
  isEmpty?: boolean;
}

export function EditButton({
  docSlug,
  docTitle,
  docId,
  canEdit = true,
  isEmpty = false
}: EditButtonProps) {
  if (!canEdit) return null;

  const buttonText = isEmpty ? 'Add content to this page' : 'Edit this page';

  return (
    <div style={{
      marginTop: '40px',
      paddingTop: '20px',
    }}>
      <a
        href={`/docs/edit?slug=${docSlug}`}
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
        {buttonText}
      </a>
    </div>
  );
}
