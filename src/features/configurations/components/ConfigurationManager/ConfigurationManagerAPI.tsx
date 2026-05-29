import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Eye, LucideIcon } from "lucide-react";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import Pagination from "../../../../shared/components/ui/Pagination";
import ActivateDeactivateButton from "../../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../../shared/components/ui/DeleteConfirmModal";
import { color, tw } from "../../../../shared/utils/utils";
import { useToast } from "../../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../../contexts/LanguageContext";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../../shared/components/ui/BackButton";
import CreateButton from "../../../../shared/components/ui/CreateButton";
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
  const [pageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigurationItem | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [togglingItemId, setTogglingItemId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<ConfigurationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayData, setDisplayData] = useState<ConfigurationItem[]>([]);

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
      console.error(`Error deleting ${config.entityName}:`, err);
      const errorMsg = err instanceof Error ? err.message : config.deleteErrorMessage;
      showError(t.genericConfig.error, errorMsg);
      // Revert optimistic update on error
      setDisplayData(previousData);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: ConfigurationItem) => {
    const newActive = !(item.isActive ?? true);
    setTogglingItemId(item.id as number);
    const previousData = displayData;

    // Optimistic update: toggle active state immediately
    setDisplayData((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, isActive: newActive } : i
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
      console.error(`Error updating ${config.entityName}:`, err);
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
      console.error(`Failed to save ${config.entityName}:`, err);
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
  ];

  const showBackButton = !pagesInSidebar.some((path) =>
    window.location.pathname.includes(path)
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      {showBackButton && (
        <BackButton
          fallbackTo={config.backPath}
          showBreadcrumb={true}
          parentLabel={(config as any).parentLabel}
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
          {!config.disableCreate && <CreateButton onClick={handleCreateItem} />}
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
      <div
        className={`${tw.rounded} border overflow-hidden`}
        style={{ borderColor: color.border.default }}
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
              <CreateButton onClick={handleCreateItem} className="mx-auto" />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[720px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopLeftRadius: "0.375rem",
                    }}
                  >
                    {config.entityName}
                  </th>
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    {t.genericConfig.description}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    {config.statusLabel || t.genericConfig.status}
                  </th>
                  <th
                    className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    {t.genericConfig.actions}
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="transition-colors" onClick={() => onRowClick?.(item.name)} style={{ cursor: onRowClick ? "pointer" : "default" }}>
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`text-sm ${tw.tableFirstColumn} ${tw.textPrimary}`}>
                        {item.name}
                      </div>
                    </td>

                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {item.description || t.genericConfig.noDescription}
                      </div>
                    </td>

                    <td
                      className="px-6 py-4 text-center"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm font-medium ${tw.textSecondary}`}>
                        {item.isActive ?? true ? t.genericConfig.active || 'Active' : t.genericConfig.inactive || 'Inactive'}
                      </span>
                    </td>

                    <td
                      className="px-6 py-4 text-center"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {config.enableActivateDeactivate && (
                          <ActivateDeactivateButton
                            isActive={item.isActive ?? true}
                            onToggle={() => handleToggleActive(item)}
                            disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                            isLoading={togglingItemId === item.id}
                            title={
                              item.isActive
                                ? `Deactivate ${item.name}`
                                : `Activate ${item.name}`
                            }
                          />
                        )}

                        {config.detailsPath && (
                          <button
                            onClick={() => navigate(`${config.detailsPath}/${item.id}`)}
                            disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                            className={`p-2 ${tw.rounded} transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={`View details for ${item.name}`}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>
                        )}

                        <button
                          onClick={() => handleEditItem(item)}
                          disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                          className={`p-2 ${tw.rounded} transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={`Edit ${item.name}`}
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>

                        {!config.disableDelete && (
                          <button
                            onClick={() => handleDeleteItem(item)}
                            disabled={togglingItemId === item.id || (itemToDelete?.id === item.id && isDeleting)}
                            className={`p-2 ${tw.rounded} transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={`Delete ${item.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredItems.length}
          onPageChange={setCurrentPage}
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
    </div>
  );
}
