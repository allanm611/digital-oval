import { useState, useEffect } from "react";
import { Save, HelpCircle, Plus, Trash2, X } from "lucide-react";
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductScope,
  ProductUnit,
  ComboResourceType,
  ComboResource,
  ComboProductData,
} from "../types/product";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import CreateCategoryModal from "../../../shared/components/CreateCategoryModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { TypeConfigurationItem } from "../../../shared/components/TypeConfigurationPage";
import { tw, color, zIndex } from "../../../shared/utils/utils";
import { useConfigurationData } from "../../../shared/services/configurationDataService";

interface ProductFormProps {
  formData: CreateProductRequest | UpdateProductRequest;
  onInputChange: (
    field: keyof (CreateProductRequest | UpdateProductRequest),
    value: string | number | boolean | undefined
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  selectedCategoryIds: number[];
  onCategoryIdsChange: (ids: number[]) => void;
  showCreateModal: boolean;
  onShowCreateModal: (show: boolean) => void;
  refreshTrigger: number;
  onCategoryCreated: (categoryId: number) => void;
  submitButtonText?: string;
  loadingText?: string;
  onCancel?: () => void;
}

export default function ProductForm({
  formData,
  onInputChange,
  onSubmit,
  isLoading,
  selectedCategoryIds,
  onCategoryIdsChange,
  showCreateModal,
  onShowCreateModal,
  refreshTrigger,
  onCategoryCreated,
  submitButtonText = "Save Product",
  loadingText = "Saving...",
  onCancel,
}: ProductFormProps) {
  // Get product types from configuration
  const { data: productTypes } = useConfigurationData("productTypes");
  const { data: comboTypes } = useConfigurationData("comboTypes");

  // Combo data state
  const [comboData, setComboData] = useState<ComboProductData>(() => {
    if (formData.combo_data) {
      return formData.combo_data;
    }
    return {
      resources: [],
      shared_validity: true,
      shared_validity_hours: undefined,
    };
  });

  // Track if user is in custom combo creation mode
  const [isCustomComboMode, setIsCustomComboMode] = useState(false);

  // Tags input state
  const [tagInput, setTagInput] = useState("");

  // Handle adding a tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const currentTags = formData.tags || [];
      if (!currentTags.includes(newTag)) {
        onInputChange("tags", [...currentTags, newTag]);
      }
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = formData.tags || [];
    const updatedTags = currentTags.filter((tag) => tag !== tagToRemove);
    onInputChange("tags", updatedTags.length > 0 ? updatedTags : undefined);
  };

  // Check if selected product type is Combo
  const selectedProductType = productTypes.find(
    (pt) => String(pt.id) === String(formData.product_type_id)
  );
  const isComboType = selectedProductType?.name === "Combo";

  // Update combo data in formData when it changes
  useEffect(() => {
    if (isComboType) {
      // Update formData with combo_data using type assertion
      onInputChange(
        "combo_data",
        comboData as unknown as string | number | boolean | undefined
      );
    } else {
      onInputChange("combo_data", undefined);
    }
  }, [comboData, isComboType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Get selected combo type details (move before useEffect that uses it)
  const selectedComboType = comboData.combo_type_id
    ? (comboTypes.find((ct) => ct.id === comboData.combo_type_id) as
        | TypeConfigurationItem
        | undefined)
    : null;

  // Initialize combo data from formData when product type changes to Combo
  useEffect(() => {
    if (isComboType && formData.combo_data) {
      setComboData(formData.combo_data);
    } else if (!isComboType) {
      setComboData({
        resources: [],
        shared_validity: true,
        shared_validity_hours: undefined,
      });
    }
  }, [formData.product_type_id, isComboType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Prefill combo data when a template combo type is selected
  useEffect(() => {
    if (
      comboData.combo_type_id &&
      comboData.combo_type_id !== 0 &&
      selectedComboType
    ) {
      // For now, prefill based on combo type name
      // This will be replaced with actual template data from backend
      const resources: ComboResource[] = [];

      // Parse resources from combo type name and add default values
      if (selectedComboType.name.toLowerCase().includes("data")) {
        resources.push({
          resource_type: "data",
          unit: "data_mb",
          unit_value: 5,
        });
      }
      if (selectedComboType.name.toLowerCase().includes("voice")) {
        resources.push({
          resource_type: "voice",
          unit: "onnet_minutes",
          unit_value: 500,
        });
      }
      if (selectedComboType.name.toLowerCase().includes("sms")) {
        resources.push({
          resource_type: "sms",
          unit: "sms_count",
          unit_value: 100,
        });
      }

      // Prefill with default shared validity and price from template
      if (resources.length > 0) {
        setComboData({
          combo_type_id: comboData.combo_type_id,
          resources,
          shared_validity: true,
          shared_validity_hours: 720, // 30 days default
          price: selectedComboType.price, // Prefill price from template
        });
      }
    }
  }, [comboData.combo_type_id, selectedComboType]);

  // Track which resources are already in the combo
  const existingResourceTypes = comboData.resources.map((r) => r.resource_type);

  // Users can add all 3 resource types (Data, Voice, SMS), but only once each

  const unitOptions: { label: string; value: ProductUnit }[] = [
    { label: "Data (MB)", value: "data_mb" },
    { label: "SMS Count", value: "sms_count" },
    { label: "Airtime", value: "airtime" },
    { label: "On-net Minutes", value: "onnet_minutes" },
    { label: "Off-net Minutes", value: "offnet_minutes" },
    { label: "All-net Minutes", value: "allnet_minutes" },
    { label: "Utility", value: "utility" },
    { label: "Points", value: "points" },
    { label: "Others", value: "other" },
  ];

  // Unit options for combo resources
  const getComboUnitOptions = (
    resourceType: ComboResourceType
  ): { label: string; value: ProductUnit }[] => {
    switch (resourceType) {
      case "data":
        return [{ label: "Data (MB)", value: "data_mb" }];
      case "voice":
        return [
          { label: "On-net Minutes", value: "onnet_minutes" },
          { label: "Off-net Minutes", value: "offnet_minutes" },
          { label: "All-net Minutes", value: "allnet_minutes" },
        ];
      case "sms":
        return [{ label: "SMS Count", value: "sms_count" }];
      default:
        return [];
    }
  };

  const currentUnitLabel =
    unitOptions.find((option) => option.value === formData.unit)?.label ||
    "Value";

  const scopeOptions: { label: string; value: ProductScope }[] = [
    { label: "Segmented", value: "segment" },
    { label: "Open Market", value: "open_market" },
  ];

  // Combo resource handlers
  const addComboResource = (resourceType: ComboResourceType) => {
    const defaultUnit =
      getComboUnitOptions(resourceType)[0]?.value || "data_mb";
    const newResource: ComboResource = {
      resource_type: resourceType,
      unit: defaultUnit,
      unit_value: 0,
      validity_hours: undefined,
    };
    setComboData({
      ...comboData,
      resources: [...comboData.resources, newResource],
    });
  };

  const removeComboResource = (index: number) => {
    setComboData({
      ...comboData,
      resources: comboData.resources.filter((_, i) => i !== index),
    });
  };

  const updateComboResource = (
    index: number,
    field: keyof ComboResource,
    value: string | number | boolean
  ) => {
    const updatedResources = [...comboData.resources];
    updatedResources[index] = {
      ...updatedResources[index],
      [field]: value,
    };
    setComboData({
      ...comboData,
      resources: updatedResources,
    });
  };

  return (
    <>
      {/* Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Product Information Card */}
        <div
          className={`${tw.rounded} border p-6`}
          style={{
            borderColor: color.border.default,
            backgroundColor: color.surface.background,
          }}
        >
          <div className="space-y-5">
            {/* Product Code & DA ID */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Product Code{" "}
                  <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.product_code || ""}
                  onChange={(e) =>
                    onInputChange("product_code", e.target.value)
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{
                    borderColor: color.border.default,
                    outline: "none",
                  }}
                  placeholder="e.g., VOICE_BUNDLE_001"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  DA ID <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.da_id || ""}
                  onChange={(e) => onInputChange("da_id", e.target.value)}
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{
                    borderColor: color.border.default,
                    outline: "none",
                  }}
                  placeholder="Enter DA ID"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Product Name */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Product Name{" "}
                <span style={{ color: color.status.danger }}>*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name || ""}
                onChange={(e) => onInputChange("name", e.target.value)}
                className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                style={{
                  borderColor: color.border.default,
                  outline: "none",
                }}
                placeholder="e.g., Premium Voice Bundle"
                onFocus={(e) => {
                  e.target.style.borderColor = color.primary.accent;
                  e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = color.border.default;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description || ""}
                onChange={(e) => onInputChange("description", e.target.value)}
                className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all resize-none`}
                style={{
                  borderColor: color.border.default,
                  outline: "none",
                }}
                placeholder="Describe the product features and benefits..."
                onFocus={(e) => {
                  e.target.style.borderColor = color.primary.accent;
                  e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = color.border.default;
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Price & Tags */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Price <span style={{ color: color.status.danger }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.price || 0}
                  onChange={(e) =>
                    onInputChange("price", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{
                    borderColor: color.border.default,
                    outline: "none",
                  }}
                  placeholder="0.00"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTagInput(value);

                        // Auto-add tag when comma is typed
                        if (value.includes(",")) {
                          const tag = value.replace(",", "").trim();
                          const currentTags = formData.tags || [];
                          if (tag && !currentTags.includes(tag.toLowerCase())) {
                            const updatedTags = [
                              ...currentTags,
                              tag.toLowerCase(),
                            ];
                            onInputChange("tags", updatedTags);
                            setTagInput("");
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        handleAddTag(e);
                      }}
                      placeholder="Type tags separated by commas"
                      className={`flex-1 px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                      style={{
                        borderColor: color.border.default,
                        outline: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = color.primary.accent;
                        e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = color.border.default;
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim()) {
                          const newTag = tagInput.trim().toLowerCase();
                          const currentTags = formData.tags || [];
                          if (!currentTags.includes(newTag)) {
                            const updatedTags = [...currentTags, newTag];
                            onInputChange("tags", updatedTags);
                            setTagInput("");
                          }
                        }
                      }}
                      className={`inline-flex items-center px-4 py-2.5 text-sm text-white ${tw.rounded} transition-colors`}
                      style={{
                        backgroundColor: color.primary.action,
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border"
                          style={{
                            backgroundColor: color.primary.accent,
                            borderColor: color.primary.accent,
                            color: "#FFFFFF",
                          }}
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 hover:opacity-80"
                            style={{ color: "#FFFFFF" }}
                            aria-label={`Remove tag ${tag}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Catalog
              </label>
              <MultiCategorySelector
                value={selectedCategoryIds}
                onChange={onCategoryIdsChange}
                placeholder="Select catalog(s)"
                entityType="product"
                refreshTrigger={refreshTrigger}
                className="w-full"
                allowCreate={true}
                onCreateCategory={() => onShowCreateModal(true)}
                onCategoryCreated={onCategoryCreated}
              />
            </div>

            {/* Product Type */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Product Type
              </label>
              <HeadlessSelect
                options={productTypes
                  .filter((pt) => pt.isActive !== false)
                  .map((pt) => ({
                    value: String(pt.id),
                    label: pt.name,
                  }))}
                value={
                  formData.product_type_id
                    ? String(formData.product_type_id)
                    : ""
                }
                onChange={(value) =>
                  onInputChange(
                    "product_type_id" as keyof (
                      | CreateProductRequest
                      | UpdateProductRequest
                    ),
                    value as string
                  )
                }
                placeholder="Select product type"
                className="w-full"
                zIndex={zIndex.dropdown}
              />
            </div>

            {/* Combo Type Selector - Only show when Combo is selected */}
            {isComboType && (
              <>
                {/* Select Pre-configured and Create Custom Combo on same line */}
                <div className="flex items-center gap-3 mb-4">
                  <label
                    className={`text-sm font-medium ${tw.textPrimary} whitespace-nowrap`}
                  >
                    Select Pre-configured:
                  </label>
                  <span className={`text-sm font-medium ${tw.textPrimary}`}>
                    OR
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setComboData({
                        combo_type_id: undefined,
                        resources: [],
                        shared_validity: true,
                        shared_validity_hours: undefined,
                      });
                      setIsCustomComboMode(true);
                    }}
                    className={`px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap`}
                    style={{
                      color: "#FFFFFF",
                      backgroundColor: color.primary.action,
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Custom Combo
                  </button>
                </div>

                {/* Combo Type Selector */}
                <div>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "Select a combo type" },
                      ...comboTypes
                        .filter((ct) => ct.isActive !== false)
                        .map((ct) => ({
                          value: String(ct.id),
                          label: ct.name,
                        })),
                    ]}
                    value={
                      comboData.combo_type_id
                        ? String(comboData.combo_type_id)
                        : ""
                    }
                    onChange={(value) => {
                      setComboData({
                        ...comboData,
                        combo_type_id: value
                          ? parseInt(value as string, 10)
                          : undefined,
                        resources: [], // Reset resources when combo type changes
                      });
                      // Exit custom combo mode when selecting/deselecting
                      setIsCustomComboMode(false);
                    }}
                    placeholder="Select a combo type"
                    className="w-full"
                    zIndex={zIndex.dropdown}
                  />
                </div>
              </>
            )}

            {/* Combo Resources Section - Only show when a combo type is selected or in custom combo mode */}
            {isComboType && (comboData.combo_type_id || isCustomComboMode) && (
              <div
                className={`${tw.rounded} border p-5`}
                style={{
                  borderColor: color.border.default,
                  backgroundColor: color.surface.cards,
                }}
              >
                <div className="mb-4">
                  <h3
                    className={`text-sm font-semibold ${tw.textPrimary} mb-1`}
                  >
                    Combo Resources
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: color.text.secondary }}
                  >
                    Add resources (Data, Voice, SMS) to this combo product
                  </p>
                </div>

                {/* Combo Price and Validity - Same Line */}
                <div
                  style={{ borderColor: color.border.default }}
                  className="mb-6 pb-6 border-b"
                >
                  {/* Shared Validity Checkbox */}
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={comboData.shared_validity ?? true}
                        onChange={(e) =>
                          setComboData({
                            ...comboData,
                            shared_validity: e.target.checked,
                          })
                        }
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        Shared Validity
                      </span>
                    </label>
                  </div>

                  {/* Validity Hours and Combo Price - Same Line */}
                  {comboData.shared_validity && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                        >
                          Validity Hours{" "}
                          <span style={{ color: color.status.danger }}>*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={comboData.shared_validity_hours ?? ""}
                          onChange={(e) =>
                            setComboData({
                              ...comboData,
                              shared_validity_hours: e.target.value
                                ? parseInt(e.target.value, 10)
                                : undefined,
                            })
                          }
                          className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                          style={{ borderColor: color.border.default }}
                          placeholder="e.g., 720 (30 days)"
                        />
                      </div>

                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                        >
                          Combo Price{" "}
                          <span style={{ color: color.status.danger }}>*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={comboData.price ?? ""}
                          onChange={(e) =>
                            setComboData({
                              ...comboData,
                              price: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                          style={{ borderColor: color.border.default }}
                          placeholder="Enter combo price"
                        />
                      </div>
                    </div>
                  )}

                  {!comboData.shared_validity && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                        >
                          Combo Price{" "}
                          <span style={{ color: color.status.danger }}>*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={comboData.price ?? ""}
                          onChange={(e) =>
                            setComboData({
                              ...comboData,
                              price: e.target.value
                                ? parseFloat(e.target.value)
                                : undefined,
                            })
                          }
                          className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                          style={{ borderColor: color.border.default }}
                          placeholder="Enter combo price"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Show Add Resource Buttons only for custom combos */}
                {isCustomComboMode && !comboData.combo_type_id && (
                  <div className="flex gap-2 mb-4 flex-wrap">
                    <button
                      type="button"
                      onClick={() => addComboResource("data")}
                      disabled={existingResourceTypes.includes("data")}
                      className={`px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2`}
                      style={{
                        borderWidth: "1px",
                        borderColor: color.primary.action,
                        color: existingResourceTypes.includes("data")
                          ? color.text.secondary
                          : color.primary.action,
                        backgroundColor: "transparent",
                        opacity: existingResourceTypes.includes("data")
                          ? 0.5
                          : 1,
                        cursor: existingResourceTypes.includes("data")
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Data
                    </button>
                    <button
                      type="button"
                      onClick={() => addComboResource("voice")}
                      disabled={existingResourceTypes.includes("voice")}
                      className={`px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2`}
                      style={{
                        borderWidth: "1px",
                        borderColor: color.primary.action,
                        color: existingResourceTypes.includes("voice")
                          ? color.text.secondary
                          : color.primary.action,
                        backgroundColor: "transparent",
                        opacity: existingResourceTypes.includes("voice")
                          ? 0.5
                          : 1,
                        cursor: existingResourceTypes.includes("voice")
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Voice
                    </button>
                    <button
                      type="button"
                      onClick={() => addComboResource("sms")}
                      disabled={existingResourceTypes.includes("sms")}
                      className={`px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2`}
                      style={{
                        borderWidth: "1px",
                        borderColor: color.primary.action,
                        color: existingResourceTypes.includes("sms")
                          ? color.text.secondary
                          : color.primary.action,
                        backgroundColor: "transparent",
                        opacity: existingResourceTypes.includes("sms")
                          ? 0.5
                          : 1,
                        cursor: existingResourceTypes.includes("sms")
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      Add SMS
                    </button>
                  </div>
                )}

                {/* Resources List */}
                {comboData.resources.length > 0 && (
                  <div className="space-y-3">
                    {comboData.resources.map((resource, index) => (
                      <div
                        key={index}
                        className={`${tw.rounded} border p-4`}
                        style={{
                          borderColor: color.border.default,
                          backgroundColor: color.surface.background,
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span
                              className={`text-sm font-medium ${tw.textPrimary} capitalize`}
                            >
                              {resource.resource_type}
                            </span>
                          </div>
                          {!comboData.combo_type_id && (
                            <button
                              type="button"
                              onClick={() => removeComboResource(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className={`grid gap-3 ${!comboData.shared_validity ? 'md:grid-cols-3' : 'md:grid-cols-2'} mb-3`}>
                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Unit
                            </label>
                            <HeadlessSelect
                              options={getComboUnitOptions(
                                resource.resource_type
                              ).map((opt) => ({
                                value: opt.value,
                                label: opt.label,
                              }))}
                              value={resource.unit}
                              onChange={(value) =>
                                updateComboResource(
                                  index,
                                  "unit",
                                  value as ProductUnit
                                )
                              }
                              placeholder="Select unit"
                              className="w-full"
                              zIndex={zIndex.dropdown}
                            />
                          </div>

                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Value
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={resource.unit_value ?? ""}
                              onChange={(e) =>
                                updateComboResource(
                                  index,
                                  "unit_value",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm transition-all`}
                              style={{ borderColor: color.border.default }}
                              placeholder="Enter value"
                            />
                          </div>

                          {!comboData.shared_validity && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                Validity (Hours)
                              </label>
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={resource.validity_hours ?? ""}
                                onChange={(e) =>
                                  updateComboResource(
                                    index,
                                    "validity_hours",
                                    e.target.value
                                      ? parseInt(e.target.value, 10)
                                      : (0 as number)
                                  )
                                }
                                className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm transition-all`}
                                style={{ borderColor: color.border.default }}
                                placeholder="e.g., 72"
                              />
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex justify-end">
                          <button
                            type="button"
                            className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors`}
                            style={{ backgroundColor: color.primary.action }}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Scope & Unit (Not sent to backend - for future use) */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Scope
                </label>
                <HeadlessSelect
                  options={scopeOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={formData.scope || "segment"}
                  onChange={(value) =>
                    onInputChange("scope", value as ProductScope)
                  }
                  placeholder="Select scope"
                  className="w-full"
                  zIndex={zIndex.dropdown}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2 flex items-center gap-2 group`}
                >
                  Unit
                  <HelpCircle
                    className="w-4 h-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Unit defines the measurement type for this product (e.g., Data in MB, SMS count, Airtime, Minutes, etc.)"
                  />
                </label>
                <HeadlessSelect
                  options={unitOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={formData.unit || "data_mb"}
                  onChange={(value) =>
                    onInputChange("unit", value as ProductUnit)
                  }
                  placeholder="Select unit"
                  className="w-full"
                  zIndex={zIndex.dropdown}
                />
              </div>
            </div>

            {/* Value & Validity (Not sent to backend - for future use) */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Value ({currentUnitLabel})
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unit_value ?? ""}
                  onChange={(e) =>
                    onInputChange("unit_value", parseFloat(e.target.value) || 0)
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{ borderColor: color.border.default }}
                  placeholder="Enter unit value"
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2 flex items-center gap-2 group`}
                >
                  Validity (Hours)
                  <HelpCircle
                    className="w-4 h-4 text-gray-400 cursor-help opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Validity period specifies how long the product remains active after purchase (e.g., 24 hours = product expires 24 hours after activation). This should be set together with the Value field."
                  />
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.validity_hours ?? ""}
                  onChange={(e) =>
                    onInputChange(
                      "validity_hours",
                      e.target.value ? parseInt(e.target.value, 10) : undefined
                    )
                  }
                  className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                  style={{ borderColor: color.border.default }}
                  placeholder="e.g., 72"
                  onFocus={(e) => {
                    e.target.style.borderColor = color.primary.accent;
                    e.target.style.boxShadow = `0 0 0 3px ${color.primary.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = color.border.default;
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-8">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className={`px-6 py-2.5 ${tw.rounded} text-sm font-medium transition-colors`}
                style={{
                  borderWidth: "1px",
                  borderColor: color.border.default,
                  color: color.text.secondary,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = color.surface.cards;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={`px-6 py-2.5 ${tw.rounded} text-sm font-medium transition-colors flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{
                backgroundColor: color.primary.action,
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {loadingText}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {submitButtonText}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Create Catalog Modal */}
      <CreateCategoryModal
        isOpen={showCreateModal}
        onClose={() => onShowCreateModal(false)}
        onCategoryCreated={onCategoryCreated}
      />
    </>
  );
}
