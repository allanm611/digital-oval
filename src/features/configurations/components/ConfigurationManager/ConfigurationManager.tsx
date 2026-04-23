import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, X, LucideIcon } from "lucide-react";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import Pagination from "../../../../shared/components/ui/Pagination";
import { color, tw } from "../../../../shared/utils/utils";
import { useConfirm } from "../../../../contexts/ConfirmContext";
import { useToast } from "../../../../contexts/ToastContext";
import { useLanguage } from "../../../../contexts/LanguageContext";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../../shared/components/ui/BackButton";
import CreateButton from "../../../../shared/components/ui/CreateButton";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import ConfigurationModal from "./ConfigurationModal";

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
  type: "text" | "select" | "toggle" | "textarea" | "date";
  required?: boolean;
  options?: { value: string | number | boolean; label: string }[];
  placeholder?: string;
  condition?: (values: Record<string, any>) => boolean;
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
}

export default function ConfigurationManager({
  config,
}: ConfigurationManagerProps) {
  const { confirm } = useConfirm();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [items, setItems] = useState<ConfigurationItem[]>(config.initialData);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigurationItem | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  const handleCreateItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: ConfigurationItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: ConfigurationItem) => {
    const confirmed = await confirm({
      title: config.deleteConfirmTitle,
      message: config.deleteConfirmMessage(item.name),
      type: "danger",
      confirmText: t.genericConfig.delete,
      cancelText: t.genericConfig.cancel,
    });

    if (!confirmed) return;

    try {
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      showToast(
        config.deleteConfirmTitle,
        config.deleteSuccessMessage(item.name)
      );
    } catch (err) {
      console.error(`Error deleting ${config.entityName}:`, err);
      showError(
        t.genericConfig.error,
        err instanceof Error ? err.message : config.deleteErrorMessage
      );
    }
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
      console.error(`Failed to save ${config.entityName}:`, err);
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
          <CreateButton onClick={handleCreateItem} />
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
            {!searchTerm && (
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
                      borderTopRightRadius: "0.375rem",
                    }}
                  >
                    {t.genericConfig.actions}
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className={`${tw.tableFirstColumn} ${tw.textPrimary}`}>
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
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEditItem(item)}
                          className={`p-2 ${tw.rounded} transition-colors`}
                          style={{
                            color: color.primary.action,
                            backgroundColor: "transparent",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteItem(item)}
                          className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
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
    </div>
  );
}
