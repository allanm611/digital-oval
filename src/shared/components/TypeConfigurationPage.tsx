import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  LucideIcon,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { color, tw } from "../utils/utils";
import { useConfirm } from "../../contexts/ConfirmContext";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { configurationDataService } from "../services/configurationDataService";
import type { ConfigurationType } from "../services/configurationDataService";
import type { ConfigurationItem } from "./GenericConfigurationPage";
import HeadlessSelect from "./ui/HeadlessSelect";

export interface TypeConfigurationItem extends ConfigurationItem {
  isActive?: boolean;
  metadataValue?: number | string;
  // Template content fields (for Creative Templates)
  title?: string;
  text_body?: string;
  html_body?: string;
  variables?: Record<string, string | number | boolean>;
  // Locale for templates (matches language metadataValue)
  locale?: string;
}

interface MetadataFieldConfig {
  label: string;
  type: "text" | "number";
  placeholder?: string;
}

export interface TypeConfigurationPageConfig {
  title: string;
  subtitle: string;
  entityName: string;
  entityNamePlural: string;
  configType: ConfigurationType;
  icon: LucideIcon;
  backPath: string;
  searchPlaceholder: string;
  initialData: TypeConfigurationItem[];
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
  statusLabel?: string;
  metadataField?: MetadataFieldConfig;
  deleteConfirmTitle: string;
  deleteConfirmMessage: (name: string) => string;
  deleteSuccessMessage: (name: string) => string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteErrorMessage: string;
  saveErrorMessage: string;
}

interface TypeConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: TypeConfigurationItem;
  onSave: (item: {
    name: string;
    description?: string;
    isActive: boolean;
    metadataValue?: number | string;
    // Template content fields (for Creative Templates)
    title?: string;
    text_body?: string;
    html_body?: string;
    variables?: Record<string, string | number | boolean>;
    locale?: string;
  }) => Promise<void>;
  isSaving: boolean;
  config: TypeConfigurationPageConfig;
}

function TypeConfigurationModal({
  isOpen,
  onClose,
  item,
  onSave,
  isSaving,
  config,
}: TypeConfigurationModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [metadataValue, setMetadataValue] = useState<string>("");
  // Template content fields (for Creative Templates)
  const [title, setTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [variablesText, setVariablesText] = useState("");
  const [locale, setLocale] = useState<string>("");
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const isCreativeTemplate = config.configType === "creativeTemplates";

  // Load languages for template locale selection
  const languages = isCreativeTemplate
    ? configurationDataService.getData("languages")
    : [];

  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || "");
      setIsActive(item.isActive ?? true);
      setMetadataValue(
        item.metadataValue !== undefined ? String(item.metadataValue) : ""
      );
      if (isCreativeTemplate) {
        setTitle(item.title || "");
        setTextBody(item.text_body || "");
        setHtmlBody(item.html_body || "");
        setVariablesText(
          item.variables ? JSON.stringify(item.variables, null, 2) : ""
        );
        setLocale(item.locale || "");
      }
    } else {
      setName("");
      setDescription("");
      setIsActive(true);
      setMetadataValue("");
      if (isCreativeTemplate) {
        setTitle("");
        setTextBody("");
        setHtmlBody("");
        setVariablesText("");
        setLocale("");
      }
    }
    setError("");
  }, [item, isOpen, isCreativeTemplate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (config.nameRequired && !name.trim()) {
      setError(t.genericConfig.isRequired.replace("{field}", config.nameLabel));
      return;
    }

    if (name.length > config.nameMaxLength) {
      setError(
        t.genericConfig.mustBeCharactersOrLess
          .replace("{field}", config.nameLabel)
          .replace("{maxLength}", config.nameMaxLength.toString())
      );
      return;
    }

    if (config.descriptionRequired && !description.trim()) {
      setError(
        t.genericConfig.isRequired.replace("{field}", config.descriptionLabel)
      );
      return;
    }

    if (description && description.length > config.descriptionMaxLength) {
      setError(
        t.genericConfig.mustBeCharactersOrLess
          .replace("{field}", config.descriptionLabel)
          .replace("{maxLength}", config.descriptionMaxLength.toString())
      );
      return;
    }

    setError("");

    // Validate variables JSON if provided
    let parsedVariables: Record<string, string | number | boolean> | undefined;
    if (isCreativeTemplate && variablesText.trim()) {
      try {
        const parsed = JSON.parse(variablesText);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          parsedVariables = parsed;
        } else {
          setError(t.genericConfig.mustBeValidJsonObject);
          return;
        }
      } catch {
        setError(t.genericConfig.invalidJson);
        return;
      }
    }

    const payload: {
      name: string;
      description?: string;
      isActive: boolean;
      metadataValue?: number | string;
      title?: string;
      text_body?: string;
      html_body?: string;
      variables?: Record<string, string | number | boolean>;
    } = {
      name: name.trim(),
      description: description.trim() || undefined,
      isActive,
      metadataValue:
        config.metadataField && metadataValue !== ""
          ? config.metadataField.type === "number"
            ? Number(metadataValue)
            : metadataValue
          : undefined,
    };

    // Add template content fields for Creative Templates
    if (isCreativeTemplate) {
      payload.title = title.trim() || undefined;
      payload.text_body = textBody.trim() || undefined;
      payload.html_body = htmlBody.trim() || undefined;
      payload.variables = parsedVariables;
      payload.locale = locale.trim() || undefined;
    }

    if (
      config.metadataField?.type === "number" &&
      metadataValue !== "" &&
      Number.isNaN(payload.metadataValue)
    ) {
      setError(
        t.genericConfig.mustBeValidNumber.replace(
          "{field}",
          config.metadataField.label
        )
      );
      return;
    }

    await onSave(payload);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div
        className={`rounded-md shadow-2xl w-full bg-white ${
          isCreativeTemplate
            ? "max-w-4xl max-h-[90vh] flex flex-col"
            : "max-w-md"
        }`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b border-gray-200 ${
            isCreativeTemplate ? "flex-shrink-0" : ""
          }`}
        >
          <h2 className="text-xl font-bold text-gray-900">
            {item ? config.modalTitle.edit : config.modalTitle.create}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className={`p-6 space-y-4 ${
            isCreativeTemplate ? "flex-1 overflow-y-auto" : ""
          }`}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.nameLabel} {config.nameRequired && "*"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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

          {config.metadataField && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.metadataField.label}
              </label>
              <input
                type={config.metadataField.type}
                value={metadataValue}
                onChange={(e) => setMetadataValue(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder={config.metadataField.placeholder}
              />
            </div>
          )}

          {/* Template Content Fields (for Creative Templates only) */}
          {isCreativeTemplate && (
            <>
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {t.genericConfig.templateContent}
                </h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.genericConfig.languageOptional}
                </label>
                <HeadlessSelect
                  value={locale}
                  onChange={(value) => setLocale(value || "")}
                  options={[
                    {
                      value: "",
                      label: t.genericConfig.selectLanguageOptional,
                    },
                    ...(languages as TypeConfigurationItem[])
                      .filter((lang) => lang.isActive)
                      .map((lang) => ({
                        value: lang.metadataValue as string,
                        label: lang.name,
                      })),
                  ]}
                  placeholder={t.genericConfig.selectLanguageOptional}
                  openUpward={true}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t.genericConfig.selectLanguageForTemplate}{" "}
                  {t.genericConfig.templatesWithoutLanguage}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.genericConfig.titleOptional}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t.genericConfig.enterTemplateTitle}
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {title.length}/160 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.genericConfig.textBodyOptional}
                </label>
                <textarea
                  value={textBody}
                  onChange={(e) => setTextBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  placeholder={t.genericConfig.enterTextContent}
                  rows={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.genericConfig.htmlBodyOptional}
                </label>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  placeholder={t.genericConfig.enterHtmlContent}
                  rows={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.genericConfig.variablesJsonFormat}
                </label>
                <textarea
                  value={variablesText}
                  onChange={(e) => setVariablesText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  placeholder='{"variable_name": "default_value"}'
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t.genericConfig.defineDefaultVariables}
                </p>
                {variablesText.trim() &&
                  (() => {
                    try {
                      JSON.parse(variablesText);
                      return (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Valid JSON
                        </p>
                      );
                    } catch {
                      return (
                        <p className="text-xs text-red-600 mt-1">
                          ⚠ {t.genericConfig.invalidJsonWarning}
                        </p>
                      );
                    }
                  })()}
              </div>
            </>
          )}

          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div
            className={`flex items-center justify-end space-x-3 pt-4 border-t border-gray-100 ${
              isCreativeTemplate ? "flex-shrink-0" : ""
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-white rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving ? "Saving..." : item ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

interface TypeConfigurationPageProps {
  config: TypeConfigurationPageConfig;
}

export default function TypeConfigurationPage({
  config,
}: TypeConfigurationPageProps) {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const normalizeItems = (data: TypeConfigurationItem[]) =>
    (data || []).map((item) => ({
      ...item,
      isActive: item.isActive ?? true,
    }));

  const [items, setItems] = useState<TypeConfigurationItem[]>(
    normalizeItems(config.initialData)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<
    TypeConfigurationItem | undefined
  >();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config.configType) {
      configurationDataService.setData(
        config.configType,
        normalizeItems(config.initialData)
      );

      const unsubscribe = configurationDataService.subscribe(
        config.configType,
        (data) => {
          setItems(normalizeItems(data as TypeConfigurationItem[]));
        }
      );

      return unsubscribe;
    }
    return undefined;
  }, [config.configType, config.initialData]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return (items || []).filter(
      (item) =>
        item.name.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
    );
  }, [items, searchTerm]);

  const IconComponent = config.icon;

  const handleCreateItem = () => {
    setEditingItem(undefined);
    setIsModalOpen(true);
  };

  const handleEditItem = (item: TypeConfigurationItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteItem = async (item: TypeConfigurationItem) => {
    const confirmed = await confirm({
      title: config.deleteConfirmTitle,
      message: config.deleteConfirmMessage(item.name),
      type: "danger",
      confirmText: t.genericConfig.delete,
      cancelText: t.genericConfig.cancel,
    });

    if (!confirmed) return;

    try {
      configurationDataService.deleteItem(config.configType, item.id);
      showToast(
        config.deleteConfirmTitle,
        config.deleteSuccessMessage(item.name)
      );
    } catch (err) {
      console.error(`Error deleting ${config.entityName}:`, err);
      showError(
        "Error",
        err instanceof Error ? err.message : config.deleteErrorMessage
      );
    }
  };

  const handleItemSaved = async (itemData: {
    name: string;
    description?: string;
    isActive: boolean;
    metadataValue?: number | string;
  }) => {
    try {
      setIsSaving(true);
      if (editingItem) {
        configurationDataService.updateItem(
          config.configType,
          editingItem.id,
          itemData
        );
        showToast(config.updateSuccessMessage);
      } else {
        configurationDataService.addItem(config.configType, itemData);
        showToast(config.createSuccessMessage);
      }
      setIsModalOpen(false);
      setEditingItem(undefined);
    } catch (err) {
      console.error(`Failed to save ${config.entityName}:`, err);
      showError(`Failed to save ${config.entityName}`, config.saveErrorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={() => navigate(config.backPath)}
            className="p-2 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
            aria-label="Back"
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

      <div className="my-5">
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
        className={`rounded-md border border-[${color.border.default}] overflow-hidden`}
      >
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
              {searchTerm
                ? `No ${config.entityNamePlural} Found`
                : `No ${config.entityNamePlural}`}
            </h3>
            <p className={`${tw.textMuted} mb-6`}>
              {searchTerm
                ? "Try adjusting your search terms."
                : `Create your first ${config.entityName} to get started.`}
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
                    Description
                  </th>
                  {config.metadataField && (
                    <th
                      className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                      style={{
                        color: color.surface.tableHeaderText,
                        backgroundColor: color.surface.tableHeader,
                      }}
                    >
                      {config.metadataField.label}
                    </th>
                  )}
                  <th
                    className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                    style={{
                      color: color.surface.tableHeaderText,
                      backgroundColor: color.surface.tableHeader,
                    }}
                  >
                    {config.statusLabel || t.genericConfig.status}
                  </th>
                  <th
                    className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider"
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
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className={`text-sm ${tw.textSecondary} max-w-md`}>
                        {item.description || t.genericConfig.noDescription}
                      </div>
                    </td>
                    {config.metadataField && (
                      <td
                        className="px-6 py-4"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                        }}
                      >
                        <div className={`text-sm ${tw.textPrimary}`}>
                          {item.metadataValue ?? "—"}
                        </div>
                      </td>
                    )}
                    <td
                      className="px-6 py-4"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <span className={`text-sm ${tw.textPrimary}`}>
                        {item.isActive ?? true
                          ? t.genericConfig.active
                          : t.genericConfig.inactive}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-right"
                      style={{
                        backgroundColor: color.surface.tablebodybg,
                        borderTopRightRadius: "0.375rem",
                        borderBottomRightRadius: "0.375rem",
                      }}
                    >
                      <div className="flex items-center justify-end space-x-2">
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
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
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

      <TypeConfigurationModal
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

// View Modal Component for Creative Templates
