import React, { useState } from 'react';
import { EditDocModal, DocData } from '../components/EditDocModal';

export default function TestEditPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const testDoc: DocData = {
    id: 'test-doc-1',
    slug: 'test-doc',
    title: 'Test Document',
    content: '# Test Document\n\nThis is a test document for the edit modal.',
    version: 1,
  };

  const handleSave = async (updatedDoc: DocData) => {
    try {
      setMessage('Saving...');

      // In real scenario, this would save to the backend
      console.log('Saving doc:', updatedDoc);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage('✅ Document saved successfully!');
      setIsModalOpen(false);

      // Reset message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Edit Modal Test Page</h1>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Open Edit Modal
        </button>
      </div>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('❌') ? '#f8d7da' : '#e2e3e5',
          color: message.includes('✅') ? '#155724' : message.includes('❌') ? '#721c24' : '#383d41',
          borderRadius: '4px',
          border: '1px solid',
          borderColor: message.includes('✅') ? '#c3e6cb' : message.includes('❌') ? '#f5c6cb' : '#d6d8db',
        }}>
          {message}
        </div>
      )}

      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '20px',
        borderRadius: '4px',
        marginBottom: '20px',
      }}>
        <h3>Test Document</h3>
        <pre style={{
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '4px',
          overflow: 'auto',
        }}>
{`ID: ${testDoc.id}
Slug: ${testDoc.slug}
Title: ${testDoc.title}
Version: ${testDoc.version}

Content:
${testDoc.content}`}
        </pre>
      </div>

      <div style={{
        backgroundColor: '#e3f2fd',
        padding: '15px',
        borderRadius: '4px',
        marginBottom: '20px',
      }}>
        <h4>How to Test:</h4>
        <ol>
          <li>Click "Open Edit Modal" to open the modal</li>
          <li>Edit the title or content in the form</li>
          <li>Click "Save Changes" to test the save functionality</li>
          <li>Click "Cancel" or click outside the modal to test the cancel button</li>
        </ol>
      </div>

      <EditDocModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        docData={testDoc}
        onSave={handleSave}
      />
    </div>
  );
}
