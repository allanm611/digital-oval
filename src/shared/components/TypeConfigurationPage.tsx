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
import { color, tw, button } from "../utils/utils";
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
  // Language-specific fields
  languageCode?: string;
  country?: string;
  characterSet?: string;
  whatsappLanguageCode?: string;
  // Character Set fields
  messageType?: string;
  characterSetType?: string;
  characterSetSize?: number;
  standardChars?: string;
  doubleChars?: string;
  tripleChars?: string;
  quadChars?: string;
  // Combo Type fields
  comboResources?: Array<{
    type: "data" | "voice" | "sms";
    value: number;
    unit: string;
    sharedValidity: boolean;
    sharedValidityHours: number;
  }>;
  sharedValidity?: boolean;
  validityHours?: number;
  price?: number; // Price for combo type
}

interface MetadataFieldConfig {
  label: string;
  type: "text" | "number" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

interface CustomFieldConfig {
  label: string;
  type: "text" | "select" | "number" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  fieldKey: string;
  dynamicOptions?: string; // Configuration type to load options from (e.g., "characterSets")
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
  customFields?: CustomFieldConfig[];
  deleteConfirmTitle: string;
  deleteConfirmMessage: (name: string) => string;
  deleteSuccessMessage: (name: string) => string;
  createSuccessMessage: string;
  updateSuccessMessage: string;
  deleteErrorMessage: string;
  saveErrorMessage: string;
  disableCreate?: boolean;
  disableDelete?: boolean;
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
    // Language-specific fields
    languageCode?: string;
    country?: string;
    characterSet?: string;
    whatsappLanguageCode?: string;
    // Generic custom fields
    [key: string]: unknown;
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
  const [metadataValue, setMetadataValue] = useState<string | number>("");
  // Template content fields (for Creative Templates)
  const [title, setTitle] = useState("");
  const [textBody, setTextBody] = useState("");
  const [htmlBody, setHtmlBody] = useState("");
  const [variablesText, setVariablesText] = useState("");
  const [locale, setLocale] = useState<string>("");
  const [error, setError] = useState("");
  const { t } = useLanguage();

  const isCreativeTemplate = config.configType === "creativeTemplates";
  const isLanguage = config.configType === "languages";
  const isCharacterSet = config.configType === "characterSets";
  const isComboType = config.configType === "comboTypes";

  // Custom fields state for languages and character sets
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  // Combo types fields
  const [comboResources, setComboResources] = useState<
    Array<{
      type: "data" | "voice" | "sms";
      value: number;
      unit: string;
      sharedValidity: boolean;
      sharedValidityHours: number;
    }>
  >([]);
  const [comboSharedValidity, setComboSharedValidity] = useState(true);
  const [comboValidityHours, setComboValidityHours] = useState<number>(720);
  const [comboPrice, setComboPrice] = useState<number | undefined>(undefined);

  // Load languages for template locale selection
  const languages = isCreativeTemplate
    ? configurationDataService.getData("languages")
    : [];

  // Load character sets dynamically for language configuration
  const getCharacterSetsOptions = () => {
    if (!isLanguage || !config.customFields) return [];
    const characterSetField = config.customFields.find(
      (f) =>
        f.fieldKey === "characterSet" && f.dynamicOptions === "characterSets"
    );
    if (characterSetField) {
      const characterSets = configurationDataService.getData("characterSets");
      return (characterSets as TypeConfigurationItem[])
        .filter((cs) => cs.isActive)
        .map((cs) => ({
          value: cs.name,
          label: cs.name,
        }));
    }
    return [];
  };

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
      if ((isLanguage || isCharacterSet) && config.customFields) {
        const fields: Record<string, string> = {};
        config.customFields.forEach((field) => {
          fields[field.fieldKey] =
            String(
              (item as TypeConfigurationItem)[
                field.fieldKey as keyof TypeConfigurationItem
              ]
            ) || "";
        });
        setCustomFields(fields);
      }
      if (isComboType) {
        setComboResources(item.comboResources || []);
        setComboSharedValidity(item.sharedValidity ?? true);
        setComboValidityHours(item.validityHours ?? 720);
        setComboPrice(item.price);
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
      if ((isLanguage || isCharacterSet) && config.customFields) {
        const fields: Record<string, string> = {};
        config.customFields.forEach((field) => {
          fields[field.fieldKey] = "";
        });
        setCustomFields(fields);
      }
      if (isComboType) {
        setComboResources([]);
        setComboSharedValidity(true);
        setComboValidityHours(720);
        setComboPrice(undefined);
      }
    }
    setError("");
  }, [
    item,
    isOpen,
    isCreativeTemplate,
    isLanguage,
    isCharacterSet,
    isComboType,
    config.customFields,
  ]);

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
      [key: string]: unknown;
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

    // Add custom fields for languages and character sets
    if ((isLanguage || isCharacterSet) && config.customFields) {
      for (const field of config.customFields) {
        const value = customFields[field.fieldKey]?.trim() || "";
        if (field.required && !value) {
          setError(t.genericConfig.isRequired.replace("{field}", field.label));
          return;
        }
        payload[field.fieldKey] = value || undefined;
      }
    }

    // Add combo type fields
    if (isComboType) {
      payload.comboResources = comboResources;
      payload.sharedValidity = comboSharedValidity;
      payload.validityHours = comboValidityHours;
      payload.price = comboPrice;
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
        className={`${tw.rounded} shadow-2xl w-full bg-white ${
          isCreativeTemplate
            ? "max-w-4xl max-h-[90vh] flex flex-col"
            : isLanguage
            ? "max-w-lg"
            : isComboType
            ? "max-w-2xl"
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
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
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
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
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
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder={t.genericConfig.enter.replace(
                "{field}",
                config.descriptionLabel?.toLowerCase() || "description"
              )}
              rows={3}
              maxLength={config.descriptionMaxLength}
              required={config.descriptionRequired}
            />
          </div>

          {/* Hide metadata field for combo types (Active Combos is just tracking) */}
          {config.metadataField && !isComboType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {config.metadataField.label}
              </label>
              {config.metadataField.type === "select" ? (
                <HeadlessSelect
                  value={String(metadataValue || "")}
                  onChange={(value: string | number) =>
                    setMetadataValue(value || "")
                  }
                  options={config.metadataField.options || []}
                  placeholder={config.metadataField.placeholder}
                />
              ) : (
                <input
                  type={config.metadataField.type}
                  value={String(metadataValue || "")}
                  onChange={(e) =>
                    setMetadataValue(
                      config.metadataField?.type === "number"
                        ? e.target.value
                          ? parseFloat(e.target.value)
                          : ""
                        : e.target.value
                    )
                  }
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  placeholder={config.metadataField.placeholder}
                />
              )}
            </div>
          )}

          {/* Custom Fields (for Languages and Character Sets) */}
          {(isLanguage || isCharacterSet) && config.customFields && (
            <>
              {config.customFields.map((field, index) => (
                <div
                  key={field.fieldKey}
                  style={{
                    position: "relative",
                    zIndex: config.customFields!.length - index,
                  }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label} {field.required && "*"}
                  </label>
                  {field.type === "select" ? (
                    <HeadlessSelect
                      value={String(customFields[field.fieldKey] || "")}
                      onChange={(value) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [field.fieldKey]: String(value || ""),
                        }))
                      }
                      options={
                        field.dynamicOptions === "characterSets"
                          ? getCharacterSetsOptions()
                          : field.options || []
                      }
                      placeholder={field.placeholder}
                      zIndex={
                        10020 + (config.customFields!.length - index) * 10
                      }
                    />
                  ) : field.type === "number" ? (
                    <input
                      type="number"
                      value={customFields[field.fieldKey] || ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [field.fieldKey]: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={customFields[field.fieldKey] || ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [field.fieldKey]: e.target.value,
                        }))
                      }
                      rows={3}
                      className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-vertical`}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type="text"
                      value={customFields[field.fieldKey] || ""}
                      onChange={(e) =>
                        setCustomFields((prev) => ({
                          ...prev,
                          [field.fieldKey]: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </>
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
                  value={String(locale || "")}
                  onChange={(value) => setLocale(String(value || ""))}
                  options={[
                    {
                      value: "",
                      label: t.genericConfig.selectLanguageOptional,
                    },
                    ...(languages as TypeConfigurationItem[])
                      .filter((lang) => lang.isActive)
                      .map((lang) => ({
                        value: String(lang.metadataValue || ""),
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
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
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
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono`}
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
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono`}
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
                  className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono`}
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

          {/* Combo Type Fields */}
          {isComboType && (
            <>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Resources
              </h3>

              {/* Combo Resources List - Compact Grid */}
              <div className="grid gap-2 ">
                {comboResources.map((resource, idx) => (
                  <div
                    key={idx}
                    className={`grid gap-2 items-center bg-gray-50 p-3 rounded border border-gray-200 ${
                      comboSharedValidity ? "grid-cols-3" : "grid-cols-4"
                    }`}
                  >
                    <div className="col-span-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {resource.type === "data"
                          ? "Data"
                          : resource.type === "voice"
                          ? "Voice"
                          : "SMS"}
                      </p>
                      <p className="text-sm text-gray-500">{resource.unit}</p>
                    </div>
                    <input
                      type="number"
                      value={resource.value}
                      onChange={(e) => {
                        const updated = [...comboResources];
                        updated[idx].value = parseInt(e.target.value) || 0;
                        setComboResources(updated);
                      }}
                      className="col-span-1 px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="Value"
                    />
                    {!comboSharedValidity && (
                      <input
                        type="number"
                        value={resource.sharedValidityHours}
                        onChange={(e) => {
                          const updated = [...comboResources];
                          updated[idx].sharedValidityHours =
                            parseInt(e.target.value) || 0;
                          setComboResources(updated);
                        }}
                        className="col-span-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        placeholder="Hours"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setComboResources(
                          comboResources.filter((_, i) => i !== idx)
                        );
                      }}
                      className="col-span-1 flex justify-center items-center text-red-600 hover:text-red-700"
                      aria-label="Delete resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Resource Buttons - Inline */}
              <div className="flex justify-between gap-3 mb-4 w-full">
                {!comboResources.some((r) => r.type === "data") && (
                  <button
                    type="button"
                    onClick={() => {
                      setComboResources([
                        ...comboResources,
                        {
                          type: "data",
                          value: 5,
                          unit: "data_mb",
                          sharedValidity: comboSharedValidity,
                          sharedValidityHours: comboValidityHours,
                        },
                      ]);
                    }}
                    style={{
                      background: button.bordered.background,
                      color: button.bordered.color,
                      border: button.bordered.border,
                      paddingTop: button.bordered.paddingY,
                      paddingBottom: button.bordered.paddingY,
                      paddingLeft: button.bordered.paddingX,
                      paddingRight: button.bordered.paddingX,
                      borderRadius: button.bordered.borderRadius,
                      fontSize: button.bordered.fontSize,
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      flex: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(37, 40, 41, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        button.bordered.background;
                    }}
                  >
                    + Data
                  </button>
                )}
                {!comboResources.some((r) => r.type === "voice") && (
                  <button
                    type="button"
                    onClick={() => {
                      setComboResources([
                        ...comboResources,
                        {
                          type: "voice",
                          value: 500,
                          unit: "onnet_minutes",
                          sharedValidity: comboSharedValidity,
                          sharedValidityHours: comboValidityHours,
                        },
                      ]);
                    }}
                    style={{
                      background: button.bordered.background,
                      color: button.bordered.color,
                      border: button.bordered.border,
                      paddingTop: button.bordered.paddingY,
                      paddingBottom: button.bordered.paddingY,
                      paddingLeft: button.bordered.paddingX,
                      paddingRight: button.bordered.paddingX,
                      borderRadius: button.bordered.borderRadius,
                      fontSize: button.bordered.fontSize,
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      flex: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(37, 40, 41, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        button.bordered.background;
                    }}
                  >
                    + Voice
                  </button>
                )}
                {!comboResources.some((r) => r.type === "sms") && (
                  <button
                    type="button"
                    onClick={() => {
                      setComboResources([
                        ...comboResources,
                        {
                          type: "sms",
                          value: 100,
                          unit: "sms_count",
                          sharedValidity: comboSharedValidity,
                          sharedValidityHours: comboValidityHours,
                        },
                      ]);
                    }}
                    style={{
                      background: button.bordered.background,
                      color: button.bordered.color,
                      border: button.bordered.border,
                      paddingTop: button.bordered.paddingY,
                      paddingBottom: button.bordered.paddingY,
                      paddingLeft: button.bordered.paddingX,
                      paddingRight: button.bordered.paddingX,
                      borderRadius: button.bordered.borderRadius,
                      fontSize: button.bordered.fontSize,
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      flex: 1,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(37, 40, 41, 0.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        button.bordered.background;
                    }}
                  >
                    + SMS
                  </button>
                )}
              </div>

              {/* Validity & Price - 2 Column Layout */}
              <div className="pt-3 mt-3">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={comboSharedValidity}
                    onChange={(e) => {
                      setComboSharedValidity(e.target.checked);
                      setComboResources(
                        comboResources.map((r) => ({
                          ...r,
                          sharedValidity: e.target.checked,
                        }))
                      );
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Shared Validity
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {comboSharedValidity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Validity Hours
                      </label>
                      <input
                        type="number"
                        value={comboValidityHours}
                        onChange={(e) => {
                          const newHours = parseInt(e.target.value) || 0;
                          setComboValidityHours(newHours);
                          setComboResources(
                            comboResources.map((r) => ({
                              ...r,
                              sharedValidityHours: newHours,
                            }))
                          );
                        }}
                        className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                        placeholder="e.g., 720"
                      />
                    </div>
                  )}

                  <div className={comboSharedValidity ? "" : "col-span-2"}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Combo Price <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={comboPrice ?? ""}
                      onChange={(e) =>
                        setComboPrice(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      placeholder="Enter price"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {error && (
            <div
              className={`mt-2 p-3 bg-red-50 border border-red-200 ${tw.rounded}`}
            >
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
              className={`px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 ${tw.rounded} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
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
    [key: string]: unknown;
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
            className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors`}
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
          {!config.disableCreate && (
            <button
              onClick={handleCreateItem}
              className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold text-sm text-white w-auto`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4" />
              {config.createButtonText}
            </button>
          )}
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
            className={`w-full pl-10 pr-4 py-3 text-sm border border-[${color.border.default}] ${tw.rounded} focus:outline-none`}
          />
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-[${color.border.default}] overflow-hidden`}
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
            {!searchTerm && !config.disableCreate && (
              <button
                onClick={handleCreateItem}
                className={`px-4 py-2 ${tw.rounded} font-semibold flex items-center gap-2 mx-auto text-sm text-white`}
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
                    {config.configType === "characterSets"
                      ? "Character Set Name"
                      : config.entityName}
                  </th>
                  {config.configType === "characterSets" ? (
                    <>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Message Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Character Set Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        {config.statusLabel || "Status"}
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Description
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        {config.statusLabel || "Status"}
                      </th>
                      {/* Hide metadata header for combo types */}
                      {config.metadataField &&
                        !config.configType?.includes("comboTypes") && (
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
                    </>
                  )}
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
                    {config.configType === "characterSets" ? (
                      <>
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <div className={`text-sm ${tw.textPrimary}`}>
                            {String(
                              (item as unknown as Record<string, unknown>)
                                .messageType || "—"
                            )}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <div className={`text-sm ${tw.textPrimary}`}>
                            {String(
                              (item as unknown as Record<string, unknown>)
                                .characterSetType || "—"
                            )}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <span className={`text-sm ${tw.textPrimary}`}>
                            {item.isActive ?? true
                              ? t.genericConfig.active
                              : t.genericConfig.inactive}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <div
                            className={`text-sm ${tw.textSecondary} max-w-md`}
                          >
                            {item.description || t.genericConfig.noDescription}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <span className={`text-sm ${tw.textPrimary}`}>
                            {item.isActive ?? true
                              ? t.genericConfig.active
                              : t.genericConfig.inactive}
                          </span>
                        </td>
                        {/* Hide metadata column for combo types */}
                        {config.metadataField &&
                          !config.configType?.includes("comboTypes") && (
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
                      </>
                    )}
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
                          title="Edit template"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!config.disableDelete && (
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-colors`}
                            title="Delete template"
                          >
                            <Trash2 className="w-4 h-4" />
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
