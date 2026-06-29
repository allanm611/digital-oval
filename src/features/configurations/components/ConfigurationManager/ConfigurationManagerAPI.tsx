import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Eye, LucideIcon } from "lucide-react";
import { Table, useTable, type TableColumn } from "../../../../shared/components/Table";
import { ColumnPickerModal } from "../../../../shared/components/ColumnPickerModal";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import Pagination, { DEFAULT_PAGE_SIZE, getInitialPageSize } from "../../../../shared/components/ui/Pagination";
import ActivateDeactivateButton from "../../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../../shared/utils/utils";
import { useToast } from "../../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../../contexts/LanguageContext";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../../shared/components/ui/BackButton";
import FeatureActionButton from "../../../../shared/components/FeatureActionButton";
import { useBackendConfigurationData } from "../../../../shared/hooks/useBackendConfigurationData";
import ConfigurationModal from "./ConfigurationModal";
import { ConfigurationPageConfig, ConfigurationItem, MetadataField } from "./ConfigurationManager";

type BackendConfigType =
  | "campaignTypes"
  | "offerTypes"
  | "segmentTypes"
  | "productTypes"
  | "rewardTypes"
  | "senderIds"
  | "languages"
  | "characterSets"
  | "creativeTemplates"
  | "smsRoutes"
  | "emailRoutes"
  | "comboTypes"
  | "notificationTypes"
  | "vipLists"
  | "controlGroups"
  | "offerCreatives"
  | "communicationChannels"
  | "dndTypes"
  | "timezones"
  | "resourceTypes"
  | "utilities"
  | "kpiCategories"
  | "notificationCategories";

export interface APIConfigurationPageConfig
  extends Omit<ConfigurationPageConfig, "initialData"> {
  configType: BackendConfigType;
  disableCreate?: boolean;
  disableDelete?: boolean;
  enableActivateDeactivate?: boolean;
  createEditPath?: string;
  detailsPath?: string;
}

interface ConfigurationTableRow {
  id: number | string;
  name: string;
  description: string;
  status: string;
  isActive: boolean;
  _full?: ConfigurationItem;
}

interface ConfigurationManagerAPIProps {
  config: APIConfigurationPageConfig;
  onRowClick?: (itemName: string) => void;
}

export default function ConfigurationManagerAPI({
  config,
  onRowClick,
}: ConfigurationManagerAPIProps) {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const backendConfig = useBackendConfigurationData(config.configType);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigurationItem | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ConfigurationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayData, setDisplayData] = useState<ConfigurationItem[]>([]);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // If hook returns null (shouldn't happen), show error
  if (!backendConfig) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className={tw.textSecondary}>
          Configuration type not supported
        </p>
      </div>
    );
  }

  const { data, loading, error, refresh, create, update, delete: deleteItem } =
    backendConfig;

  // Sync displayData with backend data
  useEffect(() => {
    if (data) {
      setDisplayData(data);
    }
  }, [data]);

  // Show error toast if one occurs
  useEffect(() => {
    if (error) {
      showError(t.genericConfig.error, error);
    }
  }, [error, showError, t]);

  const handleCreateItem = () => {
    if (config.createEditPath) {
      navigate(`${config.createEditPath}/create`);
    } else {
      setEditingItem(undefined);
      setIsModalOpen(true);
    }
  };

  const handleEditItem = (item: ConfigurationItem) => {
    if (config.createEditPath) {
      navigate(`${config.createEditPath}/${item.id}/edit`);
    } else {
      setEditingItem(item);
      setIsModalOpen(true);
    }
  };

  const handleDeleteItem = (item: ConfigurationItem) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    setIsDeleting(true);
    const previousData = displayData;

    // Optimistic update: remove from display immediately
    setDisplayData((prev) => prev.filter((i) => i.id !== itemToDelete.id));

    try {
      await deleteItem(itemToDelete.id as number);
      showToast(
        config.deleteConfirmTitle,
        config.deleteSuccessMessage(itemToDelete.name)
      );
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : config.deleteErrorMessage;
      showError(t.genericConfig.error, errorMsg);
      // Revert optimistic update on error
      setDisplayData(previousData);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: ConfigurationItem) => {
    const newActive = !((item.is_active ?? item.isActive) ?? true);
    setTogglingItemId(item.id as number);
    const previousData = displayData;

    // Optimistic update: toggle active state immediately (update both is_active and isActive)
    setDisplayData((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isActive: newActive, is_active: newActive } : i
      )
    );

    try {
      await update(item.id as number, { isActive: newActive });

      showToast(
        newActive ? "Activated" : "Deactivated",
        newActive
          ? `${item.name} has been activated`
          : `${item.name} has been deactivated`
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : config.saveErrorMessage;
      showError(t.genericConfig.error, errorMsg);
      // Revert optimistic update on error
      setDisplayData(previousData);
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleItemSaved = async (itemData: Record<string, any>) => {
    try {
      setIsSaving(true);
      if (editingItem) {
        // Update existing item - optimistically update display
        const updatedItem = await update(editingItem.id as number, itemData);
        setDisplayData((prev) =>
          prev.map((i) =>
            i.id === editingItem.id
              ? { ...i, ...updatedItem }
              : i
          )
        );
        showToast(config.updateSuccessMessage);
      } else {
        // Create new item - optimistically add to display
        const newItem = await create(itemData);
        if (newItem && newItem.id) {
          setDisplayData((prev) => [newItem, ...prev]);
        }
        showToast(config.createSuccessMessage);
      }
      setIsModalOpen(false);
      setEditingItem(undefined);
    } catch (err) {
      showError(
        t.genericConfig.failedToSave.replace("{entityName}", config.entityName),
        config.saveErrorMessage
      );
      // Refresh to sync with backend on error
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  // Table columns definition (after handlers are defined)
  const defaultColumns: TableColumn<ConfigurationTableRow>[] = useMemo(() => [
    { id: "name", label: config.entityName, width: "200px", visible: true, sortable: true, filterConfig: { type: "text" }, render: (_, row) => (
      <div className="cursor-pointer" onClick={() => onRowClick?.(row.name)}>
        {row.name}
      </div>
    ) },
    { id: "description", label: t.genericConfig.description, width: "300px", visible: true, filterConfig: { type: "text" }, render: (_, row) => (
      <div className="max-w-md">
        {row.description || t.genericConfig.noDescription}
      </div>
    ) },
    { id: "status", label: config.statusLabel || t.genericConfig.status, width: "120px", visible: true, filterConfig: { type: "multiselect", options: ["Active", "Inactive"] }, render: (_, row) => row.status },
    {
      id: "actions",
      label: t.genericConfig.actions,
      width: "150px",
      visible: true,
      sortable: false,
      isActionColumn: true,
      render: (_, row: any) => {
        const item = row._full;
        if (!item) return null;
        return (
          <div className="flex items-center justify-center space-x-2">
            {config.enableActivateDeactivate && item && (
              <ActivateDeactivateButton
                isActive={(item.is_active ?? item.isActive) ?? true}
                onToggle={() => handleToggleActive(item)}
                disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                isLoading={togglingItemId === item.id}
                title={
                  (item.is_active ?? item.isActive)
                    ? `Deactivate ${item.name}`
                    : `Activate ${item.name}`
                }
              />
            )}

            {config.detailsPath && item && (
              <button
                onClick={() => navigate(`${config.detailsPath}/${item.id}`)}
                disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                className={`p-0 icon-edit ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`View details for ${item.name}`}
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {item && (
              <button
                onClick={() => handleEditItem(item)}
                disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                className={`p-0 icon-edit ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`Edit ${item.name}`}
              >
                <Edit className="w-4 h-4" />
              </button>
            )}

            {!config.disableDelete && item && (
              <button
                onClick={() => handleDeleteItem(item)}
                disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                className={`p-0 icon-delete ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={`Delete ${item.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ], [config, t, displayData, togglingItemId, itemToDelete, isDeleting, onRowClick, tw, handleToggleActive, handleEditItem, handleDeleteItem]);

  const {
    columns,
    toggleColumn,
    reorderColumns,
    resetToDefaults,
  } = useTable({
    tableId: `configuration-${config.configType}-table`,
    defaultColumns,
    defaultPageSize: DEFAULT_PAGE_SIZE,
    persistToLocalStorage: true,
  });

  const filteredItems = useMemo(
    () =>
      (displayData || []).filter(
        (item) =>
          item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item?.description &&
            item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      ),
    [displayData, searchTerm]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const IconComponent = config.icon;

  const pagesInSidebar = [
    "/dashboard/campaign-catalogs",
    "/dashboard/campaign-objectives",
    "/dashboard/programs",
    "/dashboard/offer-catalogs",
    "/dashboard/products/catalogs",
    "/dashboard/segment-catalogs",
    "/campaign-types",
    "/segment-types",
    "/offer-types",
    "/product-types",
  ];

  const showBackButton = !pagesInSidebar.some((path) =>
    window.location.pathname.includes(path)
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {showBackButton && (
        <div className="flex items-center justify-between">
          <BackButton

            showBreadcrumb={true}
            parentLabel={(config as any).parentLabel}
            currentLabel={config.title}
          />
          {!config.disableCreate && <FeatureActionButton featureId="configuration" action="create" onClick={handleCreateItem} />}
        </div>
      )}
      {!showBackButton && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              {config.title}
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-2`}>{config.subtitle}</p>
          </div>
          {!config.disableCreate && (
            <div className="flex gap-3">
              <FeatureActionButton featureId="configuration" action="create" onClick={handleCreateItem} />
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="mt-12 mb-5">
        <SearchInput
          placeholder={config.searchPlaceholder}
          value={searchTerm}
          onChange={(value) => setSearchTerm(value)}
        />
      </div>

      {/* Table */}
      <div
        className={`${tw.rounded} overflow-hidden`}
      >
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
            {!searchTerm && !config.disableCreate && (
              <FeatureActionButton featureId="configuration" action="create" onClick={handleCreateItem} className="mx-auto" />
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table<ConfigurationTableRow>
                columns={columns}
                data={paginatedItems.map((item) => ({
                  id: item.id,
                  name: item.name,
                  description: item.description || "",
                  status: (item.is_active ?? item.isActive ?? true) ? t.genericConfig.active || 'Active' : t.genericConfig.inactive || 'Inactive',
                  isActive: item.is_active ?? item.isActive ?? true,
                  _full: item,
                }))}
                onHideColumn={toggleColumn}
                onManageColumnsClick={() => setShowColumnPicker(true)}
                rowSpacing="0 8px"
              />
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredItems.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}

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
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDeleteItem}
        title={config.deleteConfirmTitle}
        description={config.deleteConfirmMessage(itemToDelete?.name || "")}
        itemName={itemToDelete?.name || ""}
        isLoading={isDeleting}
        confirmText={t.genericConfig.delete}
        cancelText={t.genericConfig.cancel}
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
