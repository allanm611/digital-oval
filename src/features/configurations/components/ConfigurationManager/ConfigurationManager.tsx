import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, X, LucideIcon } from "lucide-react";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../../shared/components/ui/Pagination";
import { color, tw } from "../../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../../contexts/ToastContext";
import { useLanguage } from "../../../../contexts/LanguageContext";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../../shared/components/ui/BackButton";
import FeatureActionButton from "../../../../shared/components/FeatureActionButton";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import ActivateDeactivateButton from "../../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../../shared/components/ui/DeleteConfirmModal";
import ConfigurationModal from "./ConfigurationModal";
import { useDeleteConfirm } from "../../../../shared/hooks/useDeleteConfirm";
import { Table, useTable, type TableColumn } from "../../../../shared/components/Table";
import { ColumnPickerModal } from "../../../../shared/components/ColumnPickerModal";

export interface ConfigurationItem {
  id: number | string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface MetadataField {
  label: string;
  key: string;
  type: "text" | "select" | "toggle" | "textarea" | "date" | "number";
  required?: boolean;
  options?: { value: string | number | boolean; label: string }[];
  loadOptions?: (formData?: Record<string, any>) => Promise<{ value: string | number; label: string }[]>;
  placeholder?: string;
  condition?: (values: Record<string, any>) => boolean;
  row?: number;
}

export interface ConfigurationPageConfig {
  title: string;
  subtitle: string;
  entityName: string;
  entityNamePlural: string;
  backPath: string;
  icon: LucideIcon;
  searchPlaceholder: string;
  initialData: ConfigurationItem[];
  createButtonText: string;
  modalTitle: {
    create: string;
    edit: string;
  };
  nameLabel: string;
  nameRequired: boolean;
  descriptionLabel: string;
  descriptionRequired: boolean;
  nameMaxLength: number;
  descriptionMaxLength: number;
  metadataFields?: MetadataField[];
  deleteConfirmTitle: string;
  deleteConfirmMessage: (name: string) => string;
  deleteSuccessMessage: (name: string) => string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteErrorMessage: string;
  saveErrorMessage: string;
}

interface ConfigurationManagerProps {
  config: ConfigurationPageConfig;
  loading?: boolean;
}

export default function ConfigurationManager({
  config,
  loading = false,
}: ConfigurationManagerProps) {
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [items, setItems] = useState<ConfigurationItem[]>(config.initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigurationItem | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<number | string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ConfigurationItem | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Sync items when initialData prop changes
  useEffect(() => {
    setItems(config.initialData);
  }, [config.initialData]);

  const { deleteConfirm, isDeleting, openDeleteConfirm, closeDeleteConfirm, handleDelete: confirmDeleteItem } = useDeleteConfirm({
    onDelete: async (id) => {
      const numId = typeof id === "string" ? parseInt(id) : id;
      setItems((prev) => prev.filter((i) => i.id !== numId));
      showToast(
        config.deleteConfirmTitle,
        config.deleteSuccessMessage(itemToDelete?.name || "")
      );
    },
    itemLabel: config.entityName,
  });

  const handleCreateItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ConfigurationItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: ConfigurationItem) => {
    setItemToDelete(item);
    openDeleteConfirm(item.id, item.name);
  };

  const handleToggleActive = (item: ConfigurationItem) => {
    const newActive = !(item.isActive ?? true);
    setTogglingItemId(item.id);
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isActive: newActive } : i
      )
    );
    setTimeout(() => setTogglingItemId(null), 300);
    showToast(
      newActive ? "Activated" : "Deactivated",
      newActive
        ? `${item.name} has been activated`
        : `${item.name} has been deactivated`
    );
  };

  const handleItemSaved = async (itemData: Record<string, any>) => {
    try {
      setIsSaving(true);
      if (editingItem) {
        // Update existing item
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingItem.id
              ? {
                  ...item,
                  ...itemData,
                  updated_at: new Date().toISOString(),
                }
              : item
          )
        );
        showToast(config.updateSuccessMessage);
      } else {
        // Create new item
        const newItem: ConfigurationItem = {
          id: Math.max(...items.map((i) => (i.id as number) || 0)) + 1,
          ...itemData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setItems((prev) => [...prev, newItem]);
        showToast(config.createSuccessMessage);
      }
      setIsModalOpen(false);
      setEditingItem(undefined);
    } catch (err) {
      showError(
        t.genericConfig.failedToSave.replace("{entityName}", config.entityName),
        config.saveErrorMessage
      );
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = useMemo(
    () =>
      (items || []).filter(
        (item) =>
          item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item?.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [items, searchTerm]
  );

  // Table columns definition
  const defaultColumns: TableColumn<ConfigurationItem>[] = [
    {
      id: "name",
      label: config.entityName,
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (value) => (
        <div className="truncate" title={value as string}>
          {value}
        </div>
      ),
    },
    {
      id: "description",
      label: t.genericConfig.description,
      visible: true,
      filterConfig: { type: 'text' },
      render: (value) => (
        <div className="truncate max-w-md" title={value ? String(value) : "-"}>
          {value || t.genericConfig.noDescription}
        </div>
      ),
    },
    {
      id: "isActive",
      label: t.genericConfig.status,
      visible: true,
      filterConfig: { type: 'select', options: ['active', 'inactive'] },
      render: (value) => (
        value !== false ? t.genericConfig.active || 'Active' : t.genericConfig.inactive || 'Inactive'
      ),
    },
    {
      id: "actions",
      label: t.genericConfig.actions,
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (value, item) => (
        <div className="flex items-center justify-center space-x-2">
          <ActivateDeactivateButton
            isActive={item.isActive ?? true}
            onToggle={() => handleToggleActive(item)}
            disabled={togglingItemId === item.id}
            isLoading={togglingItemId === item.id}
            title={
              item.isActive
                ? `Deactivate ${item.name}`
                : `Activate ${item.name}`
            }
          />
          <button
            onClick={() => handleEditItem(item)}
            className={`p-0 icon-edit ${tw.rounded} transition-colors`}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(item)}
            className={`p-0 icon-delete ${tw.rounded} transition-colors`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: "configuration-table",
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  // Handle pagination slicing
  const paginatedItems = filteredItems.slice(
    (tableCurrentPage - 1) * tablePageSize,
    tableCurrentPage * tablePageSize
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, tableHandlePageChange]);

  const IconComponent = config.icon;

  const pagesInSidebar = [
    "/dashboard/campaign-catalogs",
    "/dashboard/campaign-objectives",
    "/dashboard/programs",
    "/dashboard/offer-catalogs",
    "/dashboard/products/catalogs",
    "/dashboard/segment-catalogs",
  ];

  const showBackButton = !pagesInSidebar.some((path) =>
    window.location.pathname.includes(path)
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {showBackButton && (
        <BackButton
         
          showBreadcrumb={true}
          currentLabel={config.title}
        />
      )}
      {!showBackButton && (
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            {config.title}
          </h1>
        </div>
      )}

      {/* Description and Create Button */}
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm ${tw.textSecondary}`}>{config.subtitle}</p>
        <div className="flex items-center gap-3 w-auto ml-auto">
          <FeatureActionButton featureId="configuration" action="create" onClick={handleCreateItem} label={config.createButtonText} />
        </div>
      </div>

      {/* Search */}
      <div className="my-5">
        <SearchInput
          placeholder={config.searchPlaceholder}
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />
      </div>

      {/* Table */}
      <div className={`${tw.rounded} overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner
              variant="modern"
              size="lg"
              color="primary"
              className="mr-3"
            />
            <span className={`${tw.textSecondary}`}>
              {t.genericConfig.loading} {config.entityNamePlural}...
            </span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm
                ? `${t.genericConfig.noItemsFound}`
                : `${t.genericConfig.noItems}`}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? t.genericConfig.tryAdjustingSearch
                : `${t.genericConfig.createFirstItem}`}
            </p>
            {!searchTerm && (
              <FeatureActionButton featureId="configuration" action="create" onClick={handleCreateItem} className="mx-auto" label={config.createButtonText} />
            )}
          </div>
        ) : (
          <>
            {/* Table */}
            <Table<ConfigurationItem>
              columns={columns}
              data={paginatedItems}
              totalItems={filteredItems.length}
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              isLoading={loading}
              onPageChange={tableHandlePageChange}
              onSort={handleSort}
              sortConfigs={sortConfigs}
              onHideColumn={toggleColumn}
              onManageColumnsClick={() => setShowColumnPicker(true)}
              style={{
                headerBackground: color.surface.tableHeader,
                headerTextColor: color.surface.tableHeaderText,
                rowBackground: color.surface.tablebodybg,
                rowSpacing: "0 8px",
              }}
            />

            {/* Pagination */}
            {!loading && paginatedItems.length > 0 && filteredItems.length > 0 && (
              <Pagination
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                totalItems={filteredItems.length}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
              />
            )}
          </>
        )}
      </div>

      <ConfigurationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(undefined);
        }}
        item={editingItem}
        onSave={handleItemSaved}
        isSaving={isSaving}
        config={config}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={() => {
          closeDeleteConfirm();
          setItemToDelete(null);
        }}
        onConfirm={async () => {
          try {
            await confirmDeleteItem(deleteConfirm.id);
          } catch (err) {
            console.error(`Error deleting ${config.entityName}:`, err);
            showError(
              t.genericConfig.error,
              err instanceof Error ? err.message : config.deleteErrorMessage
            );
          }
        }}
        title={config.deleteConfirmTitle}
        description={itemToDelete ? config.deleteConfirmMessage(itemToDelete.name) : ""}
        itemName={deleteConfirm.itemName || ""}
        isLoading={isDeleting}
      />

      <ColumnPickerModal
        isOpen={showColumnPicker}
        columns={columns.map((col) => ({ id: col.id, label: col.label, visible: col.visible }))}
        onClose={() => setShowColumnPicker(false)}
        onToggleColumn={toggleColumn}
        onReorderColumns={(reorderedCols) => {
          const updatedColumns = reorderedCols.map((reordered) => {
            const original = columns.find((c) => c.id === reordered.id);
            return original ? { ...original, visible: reordered.visible } : reordered as any;
          });
          reorderColumns(updatedColumns);
        }}
        onResetToDefaults={resetToDefaults}
      />
    </div>
  );
}
