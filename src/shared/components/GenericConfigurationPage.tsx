import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";
import { color, tw } from "../utils/utils";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../contexts/LanguageContext";
import {
  configurationDataService,
  type ConfigurationType,
} from "../services/configurationDataService";
import LoadingSpinner from "./ui/LoadingSpinner";

export interface ConfigurationItem {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  isActive?: boolean;
  metadataValue?: number | string;
}

export interface ConfigurationPageConfig {
  // Page configuration
  title: string;
  subtitle: string;
  entityName: string; // "objective", "department", etc.
  entityNamePlural: string; // "objectives", "departments", etc.
  configType?: ConfigurationType;

  // Navigation
  backPath: string;

  // UI
  icon: LucideIcon;
  searchPlaceholder: string;

  // Data
  initialData: ConfigurationItem[];

  // Labels
  createButtonText: string;
  modalTitle: {
    create: string;
    edit: string;
  };
  nameLabel: string;
  nameRequired: boolean;
  descriptionLabel: string;
  descriptionRequired: boolean;

  // Validation
  nameMaxLength: number;
  descriptionMaxLength: number;

  // Messages
  deleteConfirmTitle: string;
  deleteConfirmMessage: (name: string) => string;
  deleteSuccessMessage: (name: string) => string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteErrorMessage: string;
  saveErrorMessage: string;
}

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ConfigurationItem;
  onSave: (item: { name: string; description?: string }) => Promise<void>;
  isSaving?: boolean;
  config: ConfigurationPageConfig;
}

export function ConfigurationModal({
  isOpen,
  onClose,
  item,
  onSave,
  isSaving = false,
  config,
}: ConfigurationModalProps) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
    setError("");
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (config.nameRequired && !formData.name.trim()) {
      setError(t.genericConfig.isRequired.replace("{field}", config.nameLabel));
      return;
    }

    if (formData.name.length > config.nameMaxLength) {
      setError(
        t.genericConfig.mustBeCharactersOrLess
          .replace("{field}", config.nameLabel)
          .replace("{maxLength}", config.nameMaxLength.toString())
      );
      return;
    }

    if (config.descriptionRequired && !formData.description.trim()) {
      setError(
        t.genericConfig.isRequired.replace("{field}", config.descriptionLabel)
      );
      return;
    }

    if (
      formData.description &&
      formData.description.length > config.descriptionMaxLength
    ) {
      setError(
        t.genericConfig.mustBeCharactersOrLess
          .replace("{field}", config.descriptionLabel)
          .replace("{maxLength}", config.descriptionMaxLength.toString())
      );
      return;
    }

    setError("");

    const itemData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    };

    await onSave(itemData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10050] p-4">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? config.modalTitle.edit : config.modalTitle.create}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.nameLabel} {config.nameRequired && "*"}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t.genericConfig.enter.replace(
                  "{field}",
                  config.nameLabel.toLowerCase()
                )}
                maxLength={config.nameMaxLength}
                required={config.nameRequired}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.descriptionLabel} {config.descriptionRequired && "*"}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={t.genericConfig.enter.replace(
                  "{field}",
                  config.descriptionLabel.toLowerCase()
                )}
                rows={3}
                maxLength={config.descriptionMaxLength}
                required={config.descriptionRequired}
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              {t.genericConfig.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving
                ? t.genericConfig.saving
                : item
                ? t.genericConfig.update.replace(
                    "{entityName}",
                    config.entityName
                  )
                : t.genericConfig.create.replace(
                    "{entityName}",
                    config.entityName
                  )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface GenericConfigurationPageProps {
  config: ConfigurationPageConfig;
}

export default function GenericConfigurationPage({
  config,
}: GenericConfigurationPageProps) {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const [items, setItems] = useState<ConfigurationItem[]>(config.initialData);
  const [loading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    ConfigurationItem | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);

  // Utiliser le service de données si configType est défini
  useEffect(() => {
    if (config.configType) {
      // Initialiser les données du service avec les données de config
      configurationDataService.setData(config.configType, config.initialData);

      // S'abonner aux changements
      const unsubscribe = configurationDataService.subscribe(
        config.configType,
        setItems
      );
      return unsubscribe;
    }
  }, [config.configType, config.initialData]);

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
      if (config.configType) {
        // Utiliser le service de données
        configurationDataService.deleteItem(config.configType, item.id);
      } else {
        // Fallback pour les configurations sans configType
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
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

  const handleItemSaved = async (itemData: {
    name: string;
    description?: string;
  }) => {
    try {
      setIsSaving(true);
      if (editingItem) {
        // Update existing item
        if (config.configType) {
          configurationDataService.updateItem(
            config.configType,
            editingItem.id,
            itemData
          );
        } else {
          setItems((prev) =>
            prev.map((item) =>
              item.id === editingItem.id
                ? { ...item, ...itemData, updated_at: new Date().toISOString() }
                : item
            )
          );
        }
        showToast(config.updateSuccessMessage);
      } else {
        // Create new item
        if (config.configType) {
          configurationDataService.addItem(config.configType, itemData);
        } else {
          const newItem: ConfigurationItem = {
            id: Math.max(...items.map((i) => i.id)) + 1,
            ...itemData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setItems((prev) => [...prev, newItem]);
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
    } finally {
      setIsSaving(false);
    }
  };

  const filteredItems = (items || []).filter(
    (item) =>
      item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item?.description &&
        item.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const IconComponent = config.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate(config.backPath)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
              {config.title}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {config.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-auto">
          <button
            onClick={handleCreateItem}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm text-white w-auto"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            {config.createButtonText}
          </button>
        </div>
      </div>

      <div className={` my-5`}>
        <div className="relative w-full">
          <Search
            className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[${color.text.muted}]`}
          />
          <input
            type="text"
            placeholder={config.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 text-sm border border-[${color.border.default}] rounded-md focus:outline-none`}
          />
        </div>
      </div>

      <div
        className={` rounded-md border border-[${color.border.default}] overflow-hidden`}
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
              <button
                onClick={handleCreateItem}
                className="px-4 py-2 rounded-md font-semibold flex items-center gap-2 mx-auto text-sm text-white"
                style={{ backgroundColor: color.primary.action }}
              >
                <Plus className="w-4 h-4" />
                {config.createButtonText}
              </button>
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="transition-colors">
                    <td
                      className="px-6 py-4"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopLeftRadius: "0.375rem",
                        borderBottomLeftRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center">
                        <div>
                          <div
                            className={`text-base font-semibold ${tw.textPrimary}`}
                          >
                            {item.name}
                          </div>
                          <div className={`text-sm ${tw.textMuted}`}>
                            ID: {item.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* DESCRIPTION */}
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
                          className="p-2 rounded-md transition-colors"
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
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
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
