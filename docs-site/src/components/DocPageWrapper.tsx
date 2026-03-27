import React, { useState } from 'react';
import { DocsAuthGuard, DocsEditButton } from './DocsAuthGuard';
import { EditDocModal, DocData } from './EditDocModal';
import { PermissionGate } from '@site/../src/features/auth/components/PermissionGate';
import { docsApiService } from '@site/src/services/docsApiService';

interface DocPageWrapperProps {
  docId: string;
  docSlug: string;
  title: string;
  initialContent?: string;
  children: React.ReactNode;
}

export function DocPageWrapper({
  docId,
  docSlug,
  title,
  initialContent = '',
  children,
}: DocPageWrapperProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [docData, setDocData] = useState<DocData>({
    id: docId,
    slug: docSlug,
    title,
    content: initialContent,
  });
  const [successMessage, setSuccessMessage] = useState('');

  const handleSave = async (updated: DocData) => {
    try {
      await docsApiService.saveDoc(docId, {
        title: updated.title,
        content: updated.content,
      });
      setDocData(updated);
      setIsEditOpen(false);
      setSuccessMessage('✓ Document saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      throw error;
    }
  };

  return (
    <DocsAuthGuard>
      {/* Success message */}
      {successMessage && (
        <div
          style={{
            padding: '12px',
            marginBottom: '20px',
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '4px',
            color: '#155724',
            fontSize: '14px',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Edit button with permission check */}
      <div style={{ marginBottom: '20px' }}>
        <PermissionGate permission="docs:edit">
          <DocsEditButton onEdit={() => setIsEditOpen(true)} />
        </PermissionGate>
      </div>

      {/* Doc content */}
      {children}

      {/* Edit modal */}
      <EditDocModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        docData={docData}
        onSave={handleSave}
      />
    </DocsAuthGuard>
  );
}
