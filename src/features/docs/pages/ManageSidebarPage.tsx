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

interface ManagedItem extends DocCategory {
  _id: string;
}

interface ModalState {
  open: boolean;
  mode: 'add-page' | 'add-category' | 'edit' | 'add-child' | null;
  item?: ManagedItem;
  parentId?: string;
  placement?: 'root' | 'nested';
}

export default function ManageSidebarPage() {
  const [sidebarItems, setSidebarItems] = useState<ManagedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [modalState, setModalState] = useState<ModalState>({ open: false, mode: null });
  const [deleteTarget, setDeleteTarget] = useState<ManagedItem | null>(null);
  const [formData, setFormData] = useState({ label: '', name: '', code: '' });
  const [placement, setPlacement] = useState<'root' | 'nested'>('root');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [childItemType, setChildItemType] = useState<'category' | 'page'>('category');

  useEffect(() => {
    loadCategories();
  }, []);

  const buildCategoryTree = (categories: ManagedItem[], parentId: number | null = null): ManagedItem[] => {
    return categories
      .filter((cat) => cat.parent_category_id === parentId)
      .sort((a, b) => a.display_order - b.display_order)
      .map((cat) => ({
        ...cat,
        subcategories: buildCategoryTree(categories, cat.category_id),
      })) as ManagedItem[];
  };

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const categories = await getCategories();
      const managed: ManagedItem[] = (categories || []).map(cat => ({
        ...cat,
        _id: `cat-${cat.category_id}`,
        subcategories: [] as ManagedItem[],
      }));
      const tree = buildCategoryTree(managed);
      setSidebarItems(tree);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    setFormData({ label: '', name: '', code: '' });
    setPlacement('root');
    setSelectedParentId(null);
    setChildItemType('category');
  }, []);

  const openAddRoot = useCallback((type?: string) => {
    setFormData({ label: '', name: '', code: '' });
    setPlacement('root');
    setSelectedParentId(null);
    setModalState({
      open: true,
      mode: type === 'page' ? 'add-page' : 'add-category'
    });
  }, []);

  const openAddChild = useCallback((parentId: string) => {
    const parentIdNum = parseInt(parentId.replace('cat-', ''), 10);
    setFormData({ label: '', name: '', code: '' });
    setSelectedParentId(parentIdNum);
    setPlacement('nested');
    setModalState({ open: true, mode: 'add-child', parentId });
  }, []);

  const openEdit = useCallback((item: ManagedItem) => {
    setFormData({ label: item.label, name: item.name, code: item.code });
    setModalState({ open: true, mode: 'edit', item });
  }, []);

  async function handleSaveItem() {
    if (!formData.label.trim() || !formData.name.trim() || !formData.code.trim()) return;
    if (placement === 'nested' && !selectedParentId) return;

    setIsSaving(true);
    try {
      const payload: CreateCategoryPayload = {
        name: formData.name,
        label: formData.label,
        code: formData.code,
        parent_category_id: placement === 'nested' ? selectedParentId : undefined,
      };

      if (modalState.mode === 'add-category' || modalState.mode === 'add-child') {
        await createCategory(payload);
      } else if (modalState.mode === 'edit' && modalState.item) {
        await updateCategory(modalState.item.category_id, payload);
      }

      closeModal();
      await loadCategories();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await deleteCategory(deleteTarget.category_id);
      setDeleteTarget(null);
      await loadCategories();
    } finally {
      setIsSaving(false);
    }
  }

  function TreeNode({ item, depth = 0 }: { item: ManagedItem; depth?: number }) {
    const isExpanded = expandedIds.has(item._id);
    const isCategory = true;

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

        {isCategory && isExpanded && item.subcategories && item.subcategories.length > 0 && (
          <div className={styles.children}>
            {item.subcategories.map(child => (
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
      : modalState.mode === 'add-child'
        ? 'Add Category to Parent'
        : 'Edit Category';

  const getAllCategories = useCallback((items: ManagedItem[]): ManagedItem[] => {
    const categories: ManagedItem[] = [];
    items.forEach(item => {
      categories.push(item);
      if (item.subcategories && item.subcategories.length > 0) {
        categories.push(...getAllCategories(item.subcategories));
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
            </PermissionGate>
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
                  {modalState.mode === 'add-child' && 'Add a child category'}
                  {modalState.mode === 'edit' && 'Update category details'}
                </p>
              </div>
              <button onClick={closeModal} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className={styles.modalContent}>
              {modalState.mode === 'add-category' && (
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
                          setSelectedParentId(null);
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

              {placement === 'nested' && modalState.mode === 'add-category' && (
                <div className={styles.formGroup}>
                  <label htmlFor="parent">Parent Category *</label>
                  <select
                    id="parent"
                    value={selectedParentId || ''}
                    onChange={e => setSelectedParentId(e.target.value ? parseInt(e.target.value, 10) : null)}
                    className={styles.select}
                    disabled={isSaving}
                  >
                    <option value="">Select a category...</option>
                    {availableCategories.map(cat => (
                      <option key={cat._id} value={cat.category_id.toString()}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
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

              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <Input
                  id="name"
                  placeholder="e.g., campaigns-management"
                  value={formData.name}
                  onChange={v => setFormData({ ...formData, name: v })}
                  disabled={isSaving}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="code">Code *</label>
                <Input
                  id="code"
                  placeholder="e.g., campaigns"
                  value={formData.code}
                  onChange={v => setFormData({ ...formData, code: v })}
                  disabled={isSaving}
                />
              </div>
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
