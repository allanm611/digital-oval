import React from 'react';
import BackButton from '../../../shared/components/ui/BackButton';
import styles from './ManageSidebarPage.module.css';

/**
 * ManageSidebarPage - API Integration Pending
 * Category management requires backend API support
 * Will be enabled when API integration is complete
 */
export default function ManageSidebarPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <BackButton label="Documentation" />
          <h1 className={styles.title}>Manage Sidebar</h1>
        </div>
      </div>

      <div className={styles.treeContainer}>
        <div className={styles.empty}>
          <p style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            📋 Sidebar Management
          </p>
          <p style={{ color: '#999', lineHeight: '1.6' }}>
            Category management requires backend API integration.
            <br />
            <br />
            This feature will be available once the documentation API is deployed.
            Currently, the sidebar is loaded from hardcoded configuration.
          </p>
        </div>
      </div>
    </div>
  );
}

/*
COMMENTED OUT - API INTEGRATION PENDING
Full version with create/edit/delete category functionality:

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Folder, Edit2, Trash2, Plus, ChevronDown, X, FileText } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  getCategories,
  updateCategory,
  deleteCategory,
  createCategory,
} from '../services/sidebarService';
import { DocCategory, CreateCategoryPayload } from '../types/documentation';
import { PermissionGate } from '../../auth/components/PermissionGate';
import DeleteConfirmModal from '../../../shared/components/ui/DeleteConfirmModal';
import Input from '../../../shared/components/ui/Input';
import BackButton from '../../../shared/components/ui/BackButton';
import { zIndex } from '../../../shared/utils/utils';
import styles from './ManageSidebarPage.module.css';
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

[Full implementation commented - restore when API is ready]
*/
