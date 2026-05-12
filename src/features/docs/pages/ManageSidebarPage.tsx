import { useState, useMemo, useCallback } from 'react';
import { Folder, FileText, Edit2, Trash2, Plus, ChevronDown, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  getSidebar,
  createCategory,
  createPage,
  updateItem,
  deleteItem,
} from '../services/sidebarService';
import { PermissionGate } from '../../auth/components/PermissionGate';
import DeleteConfirmModal from '../../../shared/components/ui/DeleteConfirmModal';
import Input from '../../../shared/components/ui/Input';
import BackButton from '../../../shared/components/ui/BackButton';
import { zIndex } from '../../../shared/utils/utils';
import styles from './ManageSidebarPage.module.css';

interface ManagedItem {
  _id: string;
  type: 'doc' | 'category';
  label: string;
  path?: string;
  items?: ManagedItem[];
}

interface ModalState {
  open: boolean;
  mode: 'add-page' | 'add-category' | 'edit' | 'add-child' | null;
  item?: ManagedItem;
  parentId?: string;
  placement?: 'root' | 'nested';
}

export default function ManageSidebarPage() {
  const [version, setVersion] = useState<'v1.0' | 'v1.1'>('v1.1');
  const [sidebarItems, setSidebarItems] = useState<ManagedItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<ModalState>({ open: false, mode: null });
  const [deleteTarget, setDeleteTarget] = useState<ManagedItem | null>(null);
  const [formData, setFormData] = useState({ label: '', path: '' });
  const [placement, setPlacement] = useState<'root' | 'nested'>('root');
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [childItemType, setChildItemType] = useState<'category' | 'page'>('category');
  const [isSaving, setIsSaving] = useState(false);

  let idCounter = 0;

  const normalizeSidebar = useCallback((items: any[]): ManagedItem[] => {
    idCounter = 0;
    const traverse = (items: any[]): ManagedItem[] => {
      return items.map(item => {
        const _id = `item-${idCounter++}`;
        if (typeof item === 'string') {
          return {
            _id,
            type: 'doc' as const,
            label: item.split('/').pop() || item,
            path: item,
          };
        }
        if (item.type === 'category') {
          return {
            _id,
            type: 'category' as const,
            label: item.label || 'Untitled',
            items: item.items ? traverse(item.items) : [],
          };
        }
        if (item.type === 'doc') {
          return {
            _id,
            type: 'doc' as const,
            label: item.label || (item.id || '').split('/').pop() || 'Untitled',
            path: item.id,
          };
        }
        return {
          _id,
          type: 'doc' as const,
          label: 'Unknown',
          path: '',
        };
      });
    };
    return traverse(items);
  }, []);

  useMemo(() => {
    const config = getSidebar(version);
    const normalized = normalizeSidebar(config);
    setSidebarItems(normalized);
  }, [version, normalizeSidebar]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ open: false, mode: null });
    setFormData({ label: '', path: '' });
    setPlacement('root');
    setSelectedParentId('');
    setChildItemType('category');
  }, []);

  const openAddRoot = useCallback((type: 'page' | 'category') => {
    setFormData({ label: '', path: '' });
    setPlacement('root');
    setSelectedParentId('');
    setModalState({
      open: true,
      mode: type === 'page' ? 'add-page' : 'add-category'
    });
  }, []);

  const openAddChild = useCallback((parentId: string) => {
    setFormData({ label: '', path: '' });
    setChildItemType('category');
    setModalState({ open: true, mode: 'add-child', parentId });
  }, []);

  const openEdit = useCallback((item: ManagedItem) => {
    setFormData({ label: item.label, path: item.path || '' });
    setModalState({ open: true, mode: 'edit', item });
  }, []);

  async function handleSaveItem() {
    if (!formData.label.trim()) return;
    if (placement === 'nested' && !selectedParentId) return;

    setIsSaving(true);
    try {
      if (modalState.mode === 'add-category') {
        await createCategory(version, {
          label: formData.label,
          parentId: placement === 'nested' ? selectedParentId : undefined,
        });
      } else if (modalState.mode === 'add-page') {
        await createPage(version, {
          label: formData.label,
          path: formData.path,
          parentId: placement === 'nested' ? selectedParentId : undefined,
        });
      } else if (modalState.mode === 'add-child' && modalState.parentId) {
        if (childItemType === 'page') {
          await createPage(version, {
            label: formData.label,
            path: formData.path,
            parentId: modalState.parentId,
          });
        } else {
          await createCategory(version, {
            label: formData.label,
            parentId: modalState.parentId,
          });
        }
      } else if (modalState.mode === 'edit' && modalState.item) {
        await updateItem(version, modalState.item._id, {
          label: formData.label,
          path: formData.path,
        });
      }
      closeModal();
      const config = getSidebar(version);
      setSidebarItems(normalizeSidebar(config));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await deleteItem(version, deleteTarget._id);
      setDeleteTarget(null);
      const config = getSidebar(version);
      setSidebarItems(normalizeSidebar(config));
    } finally {
      setIsSaving(false);
    }
  }

  function TreeNode({ item, depth = 0 }: { item: ManagedItem; depth?: number }) {
    const isExpanded = expandedIds.has(item._id);
    const isCategory = item.type === 'category';

    return (
      <div key={item._id} className={styles.treeNode}>
        <div className={styles.nodeRow} style={{ paddingLeft: `${depth * 1.5}rem` }}>
          <div className={styles.nodeContent}>
            {isCategory ? (
              <button
                className={styles.expandBtn}
                onClick={() => toggleExpand(item._id)}
                aria-label="Toggle expand"
              >
                <ChevronDown size={18} className={isExpanded ? '' : styles.collapsed} />
              </button>
            ) : (
              <div className={styles.spacer} />
            )}

            <div className={styles.icon}>
              {isCategory ? <Folder size={16} /> : <FileText size={16} />}
            </div>

            <div className={styles.info}>
              <div className={styles.label}>{item.label}</div>
              {item.path && <div className={styles.path}>{item.path}</div>}
            </div>
          </div>

          <PermissionGate permission="docs.update">
            <div className={styles.actions}>
              {isCategory && (
                <button
                  className={styles.actionBtn}
                  onClick={() => openAddChild(item._id)}
                  title="Add child"
                >
                  <Plus size={14} />
                </button>
              )}
              <button
                className={styles.actionBtn}
                onClick={() => openEdit(item)}
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                className={styles.actionBtn}
                onClick={() => setDeleteTarget(item)}
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </PermissionGate>
        </div>

        {isCategory && isExpanded && item.items && item.items.length > 0 && (
          <div className={styles.children}>
            {item.items.map(child => (
              <TreeNode key={child._id} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const modalTitle =
    modalState.mode === 'add-category'
      ? 'Add Category'
      : modalState.mode === 'add-page'
        ? 'Add Page'
        : modalState.mode === 'add-child'
          ? `Add ${childItemType === 'page' ? 'Page' : 'Category'} to Category`
          : 'Edit Item';

  const showPathField = modalState.mode === 'add-page' || modalState.mode === 'edit' ||
                        (modalState.mode === 'add-child' && childItemType === 'page');

  const getAllCategories = useCallback((items: ManagedItem[]): ManagedItem[] => {
    const categories: ManagedItem[] = [];
    items.forEach(item => {
      if (item.type === 'category') {
        categories.push(item);
        if (item.items) {
          categories.push(...getAllCategories(item.items));
        }
      }
    });
    return categories;
  }, []);

  const availableCategories = useMemo(() => {
    return getAllCategories(sidebarItems);
  }, [sidebarItems, getAllCategories]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <BackButton label="Documentation" />
          <h1 className={styles.title}>Manage Sidebar</h1>
          <div className={styles.headerActions}>
            <PermissionGate permission="docs.update">
              <button onClick={() => openAddRoot('category')} className={styles.headerBtn}>
                <Plus size={16} /> Category
              </button>
              <button onClick={() => openAddRoot('page')} className={styles.headerBtn}>
                <Plus size={16} /> Page
              </button>
            </PermissionGate>
            <div className={styles.versionSelector}>
              <label htmlFor="version-select">Version:</label>
              <select
                id="version-select"
                value={version}
                onChange={e => setVersion(e.target.value as 'v1.0' | 'v1.1')}
                className={styles.select}
              >
                <option value="v1.0">v1.0</option>
                <option value="v1.1">v1.1</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.treeContainer}>
        {sidebarItems.length > 0 ? (
          sidebarItems.map(item => <TreeNode key={item._id} item={item} />)
        ) : (
          <div className={styles.empty}>No sidebar items found</div>
        )}
      </div>

      {/* Form Modal */}
      {modalState.open && createPortal(
        <div className={styles.modalBackdrop} onClick={closeModal} style={{ zIndex: zIndex.modal }}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className={styles.modalHeader}>
              <div>
                <h2 className={styles.modalTitle}>{modalTitle}</h2>
                <p className={styles.modalSubtitle}>
                  {modalState.mode === 'add-category' && 'Create a new category'}
                  {modalState.mode === 'add-page' && 'Create a new page'}
                  {modalState.mode === 'add-child' && 'Add item to category'}
                  {modalState.mode === 'edit' && 'Update item details'}
                </p>
              </div>
              <button onClick={closeModal} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className={styles.modalContent}>
              {(modalState.mode === 'add-category' || modalState.mode === 'add-page') && (
                <div className={styles.formGroup}>
                  <label>Placement *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="root"
                        checked={placement === 'root'}
                        onChange={() => {
                          setPlacement('root');
                          setSelectedParentId('');
                        }}
                        disabled={isSaving}
                      />
                      <span>Alone (root level)</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="nested"
                        checked={placement === 'nested'}
                        onChange={() => setPlacement('nested')}
                        disabled={isSaving}
                      />
                      <span>Inside an existing category</span>
                    </label>
                  </div>
                </div>
              )}

              {placement === 'nested' && (modalState.mode === 'add-category' || modalState.mode === 'add-page') && (
                <div className={styles.formGroup}>
                  <label htmlFor="parent">Parent Category *</label>
                  <select
                    id="parent"
                    value={selectedParentId}
                    onChange={e => setSelectedParentId(e.target.value)}
                    className={styles.select}
                    disabled={isSaving}
                  >
                    <option value="">Select a category...</option>
                    {availableCategories.map(cat => (
                      <option key={cat._id} value={cat._id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {modalState.mode === 'add-child' && (
                <div className={styles.formGroup}>
                  <label>Item Type *</label>
                  <div className={styles.radioGroup}>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="category"
                        checked={childItemType === 'category'}
                        onChange={() => setChildItemType('category')}
                        disabled={isSaving}
                      />
                      <span>Category</span>
                    </label>
                    <label className={styles.radioLabel}>
                      <input
                        type="radio"
                        value="page"
                        checked={childItemType === 'page'}
                        onChange={() => setChildItemType('page')}
                        disabled={isSaving}
                      />
                      <span>Page</span>
                    </label>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label htmlFor="label">Label *</label>
                <Input
                  id="label"
                  placeholder="e.g., Campaign Management"
                  value={formData.label}
                  onChange={v => setFormData({ ...formData, label: v })}
                  disabled={isSaving}
                />
              </div>

              {showPathField && (
                <div className={styles.formGroup}>
                  <label htmlFor="path">Path/ID</label>
                  <Input
                    id="path"
                    placeholder="e.g., campaigns/overview"
                    value={formData.path}
                    onChange={v => setFormData({ ...formData, path: v })}
                    disabled={isSaving}
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={styles.modalFooter}>
              <button onClick={closeModal} className={styles.cancelBtn} disabled={isSaving}>
                Cancel
              </button>
              <button
                onClick={handleSaveItem}
                disabled={isSaving || !formData.label.trim()}
                className={styles.saveBtn}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        description={`Are you sure you want to delete "${deleteTarget?.label}"?`}
        isLoading={isSaving}
      />
    </div>
  );
}
