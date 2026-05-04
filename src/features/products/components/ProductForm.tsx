import { useState, useEffect } from "react";
import { Save, HelpCircle, Plus, Trash2, X, ChevronDown, Edit } from "lucide-react";
import {
  CreateProductRequest,
  UpdateProductRequest,
  ProductScope,
  ProductUnit,
  ComboResource,
  ComboProductData,
} from "../types/product";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import CreateCategoryModal from "../../../shared/components/CreateCategoryModal";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import TypeSelector from "../../../shared/components/TypeSelector";
import CreateProductTypeModal from "./CreateProductTypeModal";
import Input from "../../../shared/components/ui/Input";
import { ConfigurationItem } from "../../configurations/components/ConfigurationManager";
import { tw, color, zIndex, getButtonStyles, button } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import { useBackendProductTypeData } from "../../../shared/hooks/useBackendProductTypeData";
import { useBackendComboTypeData } from "../../../shared/hooks/useBackendComboTypeData";
import { ComboType } from "../services/comboTypeService";
import Checkbox from "../../../shared/components/ui/Checkbox";
import CreateUtilityModal from "../../configurations/components/CreateUtilityModal";

interface ProductFormProps {
  formData: CreateProductRequest | UpdateProductRequest;
  onInputChange: (
    field: keyof (CreateProductRequest | UpdateProductRequest),
    value: string | number | boolean | string[] | undefined,
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
  const { t } = useLanguage();
  // Fetch product types and combo types from backend
  const { data: productTypes, loading: productTypesLoading, refresh: refreshProductTypes } =
    useBackendProductTypeData();
  const { data: comboTypes, loading: comboTypesLoading } =
    useBackendComboTypeData();

  // Get resource types and utilities from configuration
  const { data: resourceTypesData } = useConfigurationData("resourceTypes");
  const { data: utilitiesData } = useConfigurationData("utilities");

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Focus state for inputs
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Combo data state
  const [comboData, setComboData] = useState<ComboProductData>(() => {
    if (formData.combo_data) {
      return formData.combo_data;
    }
    return {
      resources: [],
      shared_validity: true,
      shared_validity_hours: undefined,
      shared_price: true,
      price: undefined,
      shared_daid: true,
      shared_daid_account: undefined,
    };
  });

  // Track if user is in custom combo creation mode
  const [isCustomComboMode, setIsCustomComboMode] = useState(false);

  // Selected resource type for dropdown
  const [selectedResourceType, setSelectedResourceType] = useState<
    ProductUnit | ""
  >("");

  // Temporary resource data being configured
  const [tempResourceData, setTempResourceData] = useState({
    unit_value: 0,
    unit: "" as string,
    validity_hours: undefined as number | undefined,
    price: undefined as number | undefined,
    daid_account: undefined as string | undefined,
  });

  // Combo checkbox settings (persists across resource additions)
  const [comboSettings, setComboSettings] = useState({
    shared_validity: true,
    shared_price: true,
    shared_daid: true,
  });

  // Add Resource accordion state
  const [isAddResourceExpanded, setIsAddResourceExpanded] = useState(false);

  // Inline card editing state
  const [editingCardResourceIndex, setEditingCardResourceIndex] = useState<number | null>(null);
  const [editingCardData, setEditingCardData] = useState<any>(null);

  // Utility selection state (for when utility resource type is selected)
  const [selectedUtility, setSelectedUtility] = useState<string>("");

  // Custom utilities state
  const [customUtilities, setCustomUtilities] = useState<Array<{ value: string; label: string }>>([]);

  // Create utility modal state
  const [isCreateUtilityModalOpen, setIsCreateUtilityModalOpen] = useState(false);

  // Create product type modal state
  const [showCreateTypeModal, setShowCreateTypeModal] = useState(false);

  // Tags input state
  const [tagInput, setTagInput] = useState("");

  // Validate combo resources
  const validateComboResources = (): string | null => {
    if (isComboType && comboData.resources.length === 0) {
      return "Please add at least one resource to the combo";
    }

    if (isComboType) {
      // Validate shared fields if they're enabled
      if (comboSettings.shared_validity && !comboData.shared_validity_hours) {
        return "Shared Validity (Hours) is required";
      }
      if (comboSettings.shared_price && comboData.price === undefined) {
        return "Combo Price is required";
      }
      if (comboSettings.shared_daid && !comboData.shared_daid_account) {
        return "Shared DAID Account is required";
      }

      // Validate each resource
      for (let i = 0; i < comboData.resources.length; i++) {
        const resource = comboData.resources[i];

        if (!resource.unit_value || resource.unit_value === 0) {
          return `Resource ${i + 1}: Unit value is required`;
        }

        if (!resource.unit) {
          return `Resource ${i + 1}: Unit is required`;
        }

        // Validate non-shared fields for each resource
        if (!comboSettings.shared_validity && !resource.validity_hours) {
          return `Resource ${i + 1}: Validity (Hours) is required`;
        }

        if (!comboSettings.shared_price && (resource.price === undefined || resource.price === null)) {
          return `Resource ${i + 1}: Price is required`;
        }

        if (!comboSettings.shared_daid && !resource.daid_account) {
          return `Resource ${i + 1}: DAID Account is required`;
        }
      }
    }

    return null;
  };

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_code || !formData.product_code.trim()) {
      newErrors.product_code = "Product code is required";
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.da_id || !formData.da_id.trim()) {
      newErrors.da_id = "DA ID is required";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!formData.description || !formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    // Validate combo resources
    const comboError = validateComboResources();
    if (comboError) {
      newErrors.combo = comboError;
    }

    setErrors(newErrors);

    // Scroll to first error field
    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const errorElement = document.querySelector(
        `input[name="${firstErrorKey}"], textarea[name="${firstErrorKey}"]`,
      );
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        (errorElement as HTMLInputElement | HTMLTextAreaElement).focus();
      }
    }

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(e);
    }
  };

  // Helper to ensure tags is always an array
  const getCurrentTagsAsArray = (): string[] => {
    const tags = formData.tags || [];
    // If tags is a string (shouldn't happen, but safety check), try to parse it
    if (typeof tags === "string") {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    // If tags is already an array, return it
    return Array.isArray(tags) ? tags : [];
  };

  // Handle adding a tag
  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      const currentTags = getCurrentTagsAsArray();
      if (!currentTags.includes(newTag)) {
        onInputChange("tags", [...currentTags, newTag]);
      }
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = getCurrentTagsAsArray();
    const updatedTags = currentTags.filter((tag) => tag !== tagToRemove);
    onInputChange("tags", updatedTags.length > 0 ? updatedTags : undefined);
  };

  // Check if selected product type is Combo
  const selectedProductType = productTypes.find(
    (pt) => String(pt.id) === String(formData.product_type_id),
  );
  const isComboType = selectedProductType?.name === "Combo";

  // Update combo data in formData when it changes
  useEffect(() => {
    if (isComboType) {
      // Update formData with combo_data using type assertion
      onInputChange(
        "combo_data",
        comboData as unknown as string | number | boolean | undefined,
      );
    } else {
      onInputChange("combo_data", undefined);
    }
  }, [comboData, isComboType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh product types when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshProductTypes();
    }
  }, [refreshTrigger, refreshProductTypes]);

  // Get selected combo type details (move before useEffect that uses it)
  const selectedComboType = comboData.combo_type_id
    ? (comboTypes.find((ct) => ct.id === comboData.combo_type_id) as
        | ComboType
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
        shared_price: true,
        price: undefined,
        shared_daid: true,
        shared_daid_account: undefined,
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
      // Map API resource types to form resource types
      const resources: ComboResource[] = [];

      if (
        selectedComboType.combo_resources &&
        Array.isArray(selectedComboType.combo_resources)
      ) {
        selectedComboType.combo_resources.forEach((apiResource: any) => {
          // Map API resource_type to form unit (keeping it as-is since it's already in correct format)
          const resourceType: ProductUnit = apiResource.unit as ProductUnit;

          resources.push({
            resource_type: resourceType,
            unit: apiResource.unit,
            unit_value: apiResource.unit_value,
          });
        });
      }

      // Prefill with combo type data from API
      if (resources.length > 0) {
        setComboData({
          combo_type_id: comboData.combo_type_id,
          resources,
          shared_validity: selectedComboType.shared_validity ?? true,
          shared_validity_hours: selectedComboType.validity_hours,
          shared_price: true,
          price: selectedComboType.price,
          shared_daid: true,
          shared_daid_account: undefined,
        });
      }
    }
  }, [comboData.combo_type_id, selectedComboType]);

  // Track which resources are already in the combo
  const existingResourceTypes = comboData.resources.map((r) => r.resource_type);

  // Resource type options from configuration
  const resourceTypeOptions: {
    label: string;
    value: ProductUnit;
    category: string;
    validUnits?: string[];
  }[] = (resourceTypesData || []).map((rt: any) => ({
    label: rt.name,
    value: rt.value,
    category: rt.category,
    validUnits: rt.validUnits,
  })) || [];

  // Get valid units for a selected resource type
  const getValidUnitsForResource = (resourceValue: ProductUnit) => {
    const resource = resourceTypeOptions.find((opt) => opt.value === resourceValue);
    return resource?.validUnits || [];
  };

  // Unit options for combo resources (dynamic based on selected resource)
  const comboUnitOptions: { label: string; value: string }[] = selectedResourceType
    ? getValidUnitsForResource(selectedResourceType).map((unit) => ({
        label: unit,
        value: unit,
      }))
    : [];

  // Filter out already-selected resource types
  const availableResourceTypeOptions = resourceTypeOptions.filter(
    (opt) => !existingResourceTypes.includes(opt.value),
  );

  // Helper to get utilities from config
  const getUtilitiesOptions = () => {
    const configUtilities = (utilitiesData || [])
      .filter((u: any) => u.isActive)
      .map((u: any) => ({
        value: u.value,
        label: u.name,
      }));

    // Add "Create custom" option at the beginning, followed by config utilities, then custom utilities
    return [
      {
        value: "create-custom",
        label: "Create custom",
        isCreateCustom: true,
      },
      ...configUtilities,
      ...customUtilities,
    ] as any[];
  };

  // Check if a unit is a data type (needs size selector)
  const isDataType = (unit: ProductUnit | undefined | ""): boolean => {
    if (!unit) return false;
    return unit.includes("data");
  };

  // Get the size multiplier from unit (mb or gb)
  const getDataTypeSize = (unit: ProductUnit | undefined): "mb" | "gb" => {
    if (!unit) return "mb";
    if (unit.includes("gb")) return "gb";
    return "mb";
  };

  // Get the base data type (data or roaming_data)
  const getDataTypeBase = (unit: ProductUnit | undefined): string => {
    if (!unit) return "data";
    if (unit.includes("roaming")) return "roaming_data";
    return "data";
  };

  // Build unit string from base and size
  const buildDataUnit = (base: string, size: "mb" | "gb"): ProductUnit => {
    return `${base}_${size}` as ProductUnit;
  };

  // Get label for a resource type
  const getResourceTypeLabel = (resourceType: ProductUnit): string => {
    return (
      resourceTypeOptions.find((opt) => opt.value === resourceType)?.label ||
      resourceType
    );
  };

  const currentUnitLabel =
    resourceTypeOptions.find((option) => option.value === formData.unit)?.label ||
    "Value";

  const scopeOptions: { label: string; value: ProductScope }[] = [
    { label: "Segmented", value: "segment" },
    { label: "Open Market", value: "open_market" },
  ];

  // Combo resource handlers
  const addComboResource = (
    resourceType: ProductUnit,
    unit_value: number = 0,
    unit: string = "MB",
    validity_hours: number | undefined = undefined,
    price: number | undefined = undefined,
    daid_account: string | undefined = undefined,
  ) => {
    const newResource: ComboResource = {
      resource_type: resourceType,
      unit: unit as ProductUnit,
      unit_value,
      validity_hours,
      price,
      daid_account,
    };
    setComboData({
      ...comboData,
      resources: [...comboData.resources, newResource],
    });
    setSelectedResourceType(""); // Reset dropdown
    setTempResourceData({
      unit_value: 0,
      unit: "",
      validity_hours: undefined,
      price: undefined,
      daid_account: undefined,
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
    value: string | number | boolean,
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Information Card */}
        <div
          className={`${tw.rounded} border p-6`}
          style={{
            borderColor: color.border.default,
            backgroundColor: color.surface.background,
          }}
        >
          <div className="space-y-5">
            {/* Product Name & Product Code */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  {t.products.form.productName}{" "}
                  <span style={{ color: color.status.danger }}>*</span>
                </label>
                <Input
                  placeholder={t.products.form.enterProductName}
                  value={formData.name || ""}
                  onChange={(value) => {
                    onInputChange("name", value);
                    if (errors.name) {
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.name;
                        return newErrors;
                      });
                    }
                  }}
                  hasError={!!errors.name}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {errors.name && (
                  <p
                    className="mt-1.5 text-xs font-semibold cursor-pointer"
                    style={{
                      color: color.status.danger,
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const element =
                        document.querySelector('input[name="name"]');
                      if (element) {
                        (element as HTMLInputElement).focus();
                        (element as HTMLInputElement).scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                  >
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  {t.products.form.productCode}{" "}
                  <span style={{ color: color.status.danger }}>*</span>
                </label>
                <Input
                  placeholder={t.products.form.enterProductCode}
                  value={formData.product_code || ""}
                  onChange={(value) =>
                    onInputChange("product_code", value)
                  }
                  hasError={!!errors.product_code}
                  onFocus={() => setFocusedField("product_code")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {errors.product_code && (
                  <p
                    className="text-xs mt-1 cursor-pointer"
                    style={{
                      color: color.status.danger,
                    }}
                    onClick={() => {
                      const element = document.querySelector(
                        'input[name="product_code"]',
                      );
                      if (element) {
                        (element as HTMLInputElement).focus();
                        (element as HTMLInputElement).scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                  >
                    {errors.product_code}
                  </p>
                )}
              </div>
            </div>

            {/* DA ID - Full Width */}
            {!isComboType && (
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  DA ID <span style={{ color: color.status.danger }}>*</span>
                </label>
                {/* Note: DA ID does not have a translation key in the requirements */}
                <Input
                  placeholder="Enter DA ID"
                  value={formData.da_id || ""}
                  onChange={(value) => onInputChange("da_id", value)}
                  hasError={!!errors.da_id}
                  onFocus={() => setFocusedField("da_id")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {errors.da_id && (
                  <p
                    className="text-xs mt-1 font-semibold cursor-pointer"
                    style={{
                      color: color.status.danger,
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const element = document.querySelector(
                        'input[name="da_id"]',
                      );
                      if (element) {
                        (element as HTMLInputElement).focus();
                        (element as HTMLInputElement).scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                  >
                    {errors.da_id}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                {t.products.form.productDescription}{" "}
                <span style={{ color: color.status.danger }}>*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                value={formData.description || ""}
                onChange={(e) => {
                  onInputChange("description", e.target.value);
                  if (errors.description) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.description;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all resize-none outline-none ${
                  focusedField === "description"
                    ? errors.description
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-blue-500 ring-2 ring-blue-500/20"
                    : errors.description
                      ? "border-red-500"
                      : "border-gray-300"
                }`}
                placeholder={t.products.form.enterProductDescription}
                onFocus={() => setFocusedField("description")}
                onBlur={() => setFocusedField(null)}
              />
              {errors.description && (
                <p
                  className="mt-1.5 text-xs font-semibold cursor-pointer"
                  style={{
                    color: color.status.danger,
                    fontWeight: 600,
                  }}
                  onClick={() => {
                    const element = document.querySelector(
                      'textarea[name="description"]',
                    );
                    if (element) {
                      (element as HTMLTextAreaElement).focus();
                      (element as HTMLTextAreaElement).scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }}
                >
                  {errors.description}
                </p>
              )}
            </div>

            {/* Price & Tags */}
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  {t.products.form.pricing}{" "}
                  <span style={{ color: color.status.danger }}>*</span>
                </label>
                <Input
                  placeholder="0.00"
                  value={String(formData.price || 0)}
                  onChange={(value) =>
                    onInputChange("price", parseFloat(value) || 0)
                  }
                  hasError={!!errors.price}
                  onFocus={() => setFocusedField("price")}
                  onBlur={() => setFocusedField(null)}
                  required
                />
                {errors.price && (
                  <p
                    className="text-xs mt-1 font-semibold cursor-pointer"
                    style={{
                      color: color.status.danger,
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      const element = document.querySelector(
                        'input[name="price"]',
                      );
                      if (element) {
                        (element as HTMLInputElement).focus();
                        (element as HTMLInputElement).scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                      }
                    }}
                  >
                    {errors.price}
                  </p>
                )}
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                >
                  Tags
                </label>
                <div className="space-y-2">
                  <div className="flex">
                    <div className="flex-1">
                      <Input
                        placeholder="Type tags separated by commas"
                        value={tagInput}
                        onChange={(value) => {
                          setTagInput(value);

                          // Auto-add tag when comma is typed
                          if (value.includes(",")) {
                            const tag = value.replace(",", "").trim();
                            const currentTags = getCurrentTagsAsArray();
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
                        onFocus={() => setFocusedField("tags")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full"
                        style={{
                          borderTopRightRadius: "0",
                          borderBottomRightRadius: "0",
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (tagInput.trim()) {
                          const newTag = tagInput.trim().toLowerCase();
                          const currentTags = getCurrentTagsAsArray();
                          if (!currentTags.includes(newTag)) {
                            const updatedTags = [...currentTags, newTag];
                            onInputChange("tags", updatedTags);
                            setTagInput("");
                          }
                        }
                      }}
                      className="px-3 py-2 text-white rounded-r-md flex items-center justify-center text-sm border-l-0 font-medium"
                      style={{
                        backgroundColor: color.primary.action,
                        borderColor: color.primary.action,
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {getCurrentTagsAsArray().length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getCurrentTagsAsArray().map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
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
                {t.products.form.productCategory}
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
                {t.products.form.productType}
              </label>
              <TypeSelector
                options={productTypes
                  .filter((pt) => pt.is_active !== false)
                  .map((pt) => ({
                    value: String(pt.id),
                    label: pt.name,
                  }))}
                disabled={productTypesLoading}
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
                    value ? Number(value) : undefined,
                  )
                }
                placeholder={t.products.form.selectProductType}
                allowCreate={true}
                onCreate={() => setShowCreateTypeModal(true)}
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
                        shared_price: true,
                        price: undefined,
                        shared_daid: true,
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
                    Create Combo Type
                  </button>
                </div>

                {/* Combo Type Selector */}
                <div>
                  <HeadlessSelect
                    options={[
                      { value: "", label: "Select a combo type" },
                      ...comboTypes
                        .filter((ct) => ct.is_active !== false)
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
                    zIndex={zIndex.popover}
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

                {/* Combo Price and Validity Configuration */}
                <div
                  style={{ borderColor: color.border.default }}
                  className="mb-3 pb-3"
                >
                  {/* Shared Configuration Checkboxes */}
                  <div className="grid gap-4 md:grid-cols-3 mb-4">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                      setComboSettings({
                        ...comboSettings,
                        shared_validity: !comboSettings.shared_validity,
                      })
                    }>
                      <Checkbox
                        id="shared-validity-combo"
                        checked={comboSettings.shared_validity}
                        onChange={() =>
                          setComboSettings({
                            ...comboSettings,
                            shared_validity: !comboSettings.shared_validity,
                          })
                        }
                      />
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        Shared Validity
                      </span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                      setComboSettings({
                        ...comboSettings,
                        shared_price: !comboSettings.shared_price,
                      })
                    }>
                      <Checkbox
                        id="shared-price-combo"
                        checked={comboSettings.shared_price}
                        onChange={() =>
                          setComboSettings({
                            ...comboSettings,
                            shared_price: !comboSettings.shared_price,
                          })
                        }
                      />
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        Shared Price
                      </span>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                      setComboSettings({
                        ...comboSettings,
                        shared_daid: !comboSettings.shared_daid,
                      })
                    }>
                      <Checkbox
                        id="shared-daid-combo"
                        checked={comboSettings.shared_daid}
                        onChange={() =>
                          setComboSettings({
                            ...comboSettings,
                            shared_daid: !comboSettings.shared_daid,
                          })
                        }
                      />
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        Shared DAID
                      </span>
                    </div>
                  </div>

                  {/* Validity and Price Fields */}
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Shared Validity Hours */}
                    {comboSettings.shared_validity && (
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                        >
                          Validity (Hours){" "}
                          <span style={{ color: color.status.danger }}>*</span>
                        </label>
                        <Input type="number"
                          min="1"
                          step="1"
                          value={comboData.shared_validity_hours ?? ""}
                          onChange={(value) =>
                            setComboData({
                              ...comboData,
                              shared_validity_hours: String(value)
                                ? parseInt(String(value), 10)
                                : undefined,
                            })
                          }
                          className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                          style={{ borderColor: color.border.default }}
                          placeholder="e.g., 720 (30 days)"
                        />
                      </div>
                    )}

                    {/* Shared Combo Price */}
                    {comboSettings.shared_price && (
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                        >
                          Combo Price{" "}
                          <span style={{ color: color.status.danger }}>*</span>
                        </label>
                        <Input type="number"
                          min="0"
                          step="0.01"
                          value={comboData.price ?? ""}
                          onChange={(value) =>
                            setComboData({
                              ...comboData,
                              price: String(value)
                                ? parseFloat(String(value))
                                : undefined,
                            })
                          }
                          className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all`}
                          style={{ borderColor: color.border.default }}
                          placeholder="Enter combo price"
                        />
                      </div>
                    )}

                    {/* Shared DAID Account */}
                    {comboSettings.shared_daid && (
                      <div>
                        <label
                          className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                        >
                          DAID Account{" "}
                          <span style={{ color: color.status.danger }}>*</span>
                        </label>
                        <Input
                          placeholder="Enter shared DAID"
                          value={comboData.shared_daid_account ?? ""}
                          onChange={(value) =>
                            setComboData({
                              ...comboData,
                              shared_daid_account: value || undefined,
                            })
                          }
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Add Resource Accordion - Shows for custom combos */}
                {isCustomComboMode && !comboData.combo_type_id && (
                  <div
                    className={`border border-gray-200 ${tw.rounded} overflow-hidden`}
                  >
                    {/* Accordion Header */}
                    <button
                      type="button"
                      onClick={() =>
                        setIsAddResourceExpanded(!isAddResourceExpanded)
                      }
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      style={{
                        backgroundColor: isAddResourceExpanded
                          ? color.surface.cards
                          : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium ${tw.textPrimary}`}
                        >
                          Add Resource
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 transition-transform ${
                          isAddResourceExpanded ? "rotate-180" : ""
                        }`}
                        style={{ color: color.text.secondary }}
                      />
                    </button>

                    {/* Accordion Content */}
                    {isAddResourceExpanded && (
                      <div className="border-t border-gray-200 p-4 space-y-3">
                        <div
                          className={`grid gap-3 ${
                            selectedResourceType === "utility"
                              ? "md:grid-cols-4"
                              : !comboSettings.shared_validity &&
                                  !comboSettings.shared_price &&
                                  !comboSettings.shared_daid
                                ? "md:grid-cols-6"
                                : !comboSettings.shared_validity &&
                                    !comboSettings.shared_price
                                  ? "md:grid-cols-5"
                                  : !comboSettings.shared_validity ||
                                      !comboSettings.shared_price ||
                                      !comboSettings.shared_daid
                                    ? "md:grid-cols-4"
                                    : "md:grid-cols-3"
                          }`}
                        >
                          {/* Resource Type Dropdown */}
                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Resource Type
                            </label>
                            <HeadlessSelect
                              value={selectedResourceType}
                              onChange={(value) => {
                                const newType = value as ProductUnit;
                                setSelectedResourceType(newType);
                                // Auto-populate unit with first valid unit for this resource
                                const validUnits = getValidUnitsForResource(newType);
                                setTempResourceData({
                                  unit_value: 0,
                                  unit: validUnits.length > 0 ? validUnits[0] : "",
                                  validity_hours: undefined,
                                  price: undefined,
                                  daid_account: undefined,
                                });
                                // Reset utility selection if switching away from utility type
                                if (newType !== "utility") {
                                  setSelectedUtility("");
                                }
                              }}
                              options={availableResourceTypeOptions}
                              placeholder={
                                availableResourceTypeOptions.length === 0
                                  ? "All resources added"
                                  : "Select resource"
                              }
                              className="w-full"
                              disabled={availableResourceTypeOptions.length === 0}
                            />
                          </div>

                          {/* Unit Dropdown */}
                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Unit
                            </label>
                            <HeadlessSelect
                              value={tempResourceData.unit}
                              onChange={(value) => {
                                setTempResourceData({
                                  ...tempResourceData,
                                  unit: value as string,
                                });
                              }}
                              options={comboUnitOptions}
                              placeholder="Select unit"
                              className="w-full"
                            />
                          </div>

                          {/* Utility Selection - show when Utility resource type is selected */}
                          {selectedResourceType === "utility" && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                Utility *
                              </label>
                              <HeadlessSelect
                                options={getUtilitiesOptions()}
                                value={selectedUtility}
                                onChange={(value: string | number) => {
                                  const val = value as string;
                                  if (val === "create-custom") {
                                    setIsCreateUtilityModalOpen(true);
                                    setSelectedUtility(""); // Reset selection
                                  } else {
                                    setSelectedUtility(val);
                                  }
                                }}
                                placeholder="Select utility"
                                className="w-full"
                              />
                            </div>
                          )}

                          {/* Unit Value */}
                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Value{" "}
                              {tempResourceData.unit &&
                                `(${tempResourceData.unit})`}
                            </label>
                            <Input type="number"
                              min="0"
                              step="1"
                              value={
                                tempResourceData.unit_value === 0
                                  ? ""
                                  : tempResourceData.unit_value
                              }
                              onChange={(value) => {
                                const val =
                                  String(value) === ""
                                    ? 0
                                    : parseFloat(String(value));
                                setTempResourceData({
                                  ...tempResourceData,
                                  unit_value: isNaN(val) ? 0 : val,
                                });
                              }}
                              className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm transition-all`}
                              style={{ borderColor: color.border.default }}
                              placeholder="Enter value"
                            />
                          </div>

                          {/* Validity (if not shared) */}
                          {!comboSettings.shared_validity && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                Validity (Hours)
                              </label>
                              <Input type="number"
                                min="1"
                                step="1"
                                value={tempResourceData.validity_hours ?? ""}
                                onChange={(value) =>
                                  setTempResourceData({
                                    ...tempResourceData,
                                    validity_hours: String(value)
                                      ? parseInt(String(value), 10)
                                      : undefined,
                                  })
                                }
                                className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm transition-all`}
                                style={{ borderColor: color.border.default }}
                                placeholder="e.g., 72"
                              />
                            </div>
                          )}

                          {/* Price (if not shared) */}
                          {!comboSettings.shared_price && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                Price
                              </label>
                              <Input type="number"
                                min="0"
                                step="0.01"
                                value={tempResourceData.price ?? ""}
                                onChange={(value) =>
                                  setTempResourceData({
                                    ...tempResourceData,
                                    price: String(value)
                                      ? parseFloat(String(value))
                                      : undefined,
                                  })
                                }
                                className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm transition-all`}
                                style={{ borderColor: color.border.default }}
                                placeholder="Enter price"
                              />
                            </div>
                          )}

                          {/* DAID (if not shared) */}
                          {!comboSettings.shared_daid && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                DAID Account
                              </label>
                              <Input
                                placeholder="Enter DAID"
                                value={tempResourceData.daid_account ?? ""}
                                onChange={(value) =>
                                  setTempResourceData({
                                    ...tempResourceData,
                                    daid_account: value || undefined,
                                  })
                                }
                                variant="medium"
                              />
                            </div>
                          )}
                        </div>

                        {/* Save Resource Button - At Bottom */}
                        <button
                          type="button"
                          onClick={() => {
                            // Validate utility selection if utility resource type is selected
                            if (selectedResourceType === "utility" && !selectedUtility) {
                              alert("Please select a utility");
                              return;
                            }

                            // Validate required fields based on combo settings
                            if (!tempResourceData.unit) {
                              alert("Unit is required");
                              return;
                            }

                            if (!comboSettings.shared_validity && !tempResourceData.validity_hours) {
                              alert("Validity (Hours) is required for each resource");
                              return;
                            }

                            if (!comboSettings.shared_price && (tempResourceData.price === undefined || tempResourceData.price === null)) {
                              alert("Price is required for each resource");
                              return;
                            }

                            if (!comboSettings.shared_daid && !tempResourceData.daid_account) {
                              alert("DAID Account is required for each resource");
                              return;
                            }

                            // Add resource with all temp data at once
                            addComboResource(
                              selectedResourceType,
                              tempResourceData.unit_value,
                              tempResourceData.unit,
                              tempResourceData.validity_hours,
                              tempResourceData.price,
                              tempResourceData.daid_account,
                            );
                            // Reset utility selection
                            setSelectedUtility("");
                            // Collapse accordion after adding
                            setIsAddResourceExpanded(false);
                          }}
                          disabled={
                            !selectedResourceType ||
                            tempResourceData.unit_value === 0 ||
                            tempResourceData.unit_value === undefined ||
                            !tempResourceData.unit ||
                            (!comboSettings.shared_validity && !tempResourceData.validity_hours) ||
                            (!comboSettings.shared_price && (tempResourceData.price === undefined || tempResourceData.price === null)) ||
                            (!comboSettings.shared_daid && !tempResourceData.daid_account)
                          }
                          style={{
                            ...getButtonStyles(button.bordered),
                            color: "#000000",
                            fontWeight: 500,
                            cursor: (
                              selectedResourceType &&
                              tempResourceData.unit_value &&
                              tempResourceData.unit_value > 0 &&
                              tempResourceData.unit &&
                              (comboSettings.shared_validity || tempResourceData.validity_hours) &&
                              (comboSettings.shared_price || (tempResourceData.price !== undefined && tempResourceData.price !== null)) &&
                              (comboSettings.shared_daid || tempResourceData.daid_account)
                            ) ? "pointer" : "not-allowed",
                            opacity: (
                              selectedResourceType &&
                              tempResourceData.unit_value &&
                              tempResourceData.unit_value > 0 &&
                              tempResourceData.unit &&
                              (comboSettings.shared_validity || tempResourceData.validity_hours) &&
                              (comboSettings.shared_price || (tempResourceData.price !== undefined && tempResourceData.price !== null)) &&
                              (comboSettings.shared_daid || tempResourceData.daid_account)
                            ) ? 1 : 0.5,
                          }}
                        >
                          Save Resource
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Resources List */}
                {comboData.resources.length > 0 && (
                  <div className="space-y-3 mb-3 mt-6">
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
                              className={`text-sm font-medium ${tw.textPrimary}`}
                            >
                              {getResourceTypeLabel(resource.resource_type)}
                            </span>
                          </div>
                          {!comboData.combo_type_id && (
                            <div className="flex gap-2">
                              {editingCardResourceIndex === index ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setComboData((prev) => ({
                                        ...prev,
                                        resources: prev.resources.map((r, i) =>
                                          i === index
                                            ? {
                                                ...r,
                                                unit_value: editingCardData.unit_value,
                                                unit: editingCardData.unit,
                                                validity_hours: editingCardData.validity_hours,
                                                price: editingCardData.price,
                                                daid_account: editingCardData.daid_account,
                                              }
                                            : r
                                        ),
                                      }));
                                      setEditingCardResourceIndex(null);
                                      setEditingCardData(null);
                                    }}
                                    disabled={isLoading}
                                    style={{
                                      ...getButtonStyles(button.action),
                                      fontWeight: "500",
                                      cursor: isLoading ? "not-allowed" : "pointer",
                                      opacity: isLoading ? 0.5 : 1,
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCardResourceIndex(null);
                                      setEditingCardData(null);
                                    }}
                                    disabled={isLoading}
                                    style={{
                                      ...getButtonStyles(button.bordered),
                                      fontWeight: "500",
                                      cursor: isLoading ? "not-allowed" : "pointer",
                                      opacity: isLoading ? 0.5 : 1,
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCardResourceIndex(index);
                                      setEditingCardData({
                                        unit_value: resource.unit_value,
                                        unit: resource.unit,
                                        validity_hours: resource.validity_hours,
                                        price: resource.price,
                                        daid_account: resource.daid_account,
                                      });
                                    }}
                                    className="text-gray-500 hover:text-gray-700 transition-colors"
                                    disabled={isLoading}
                                    title="Edit resource"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeComboResource(index)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div
                          className={`grid gap-3 ${
                            !comboSettings.shared_validity &&
                            !comboSettings.shared_price &&
                            !comboSettings.shared_daid
                              ? "md:grid-cols-5"
                              : !comboSettings.shared_validity &&
                                  !comboSettings.shared_price
                                ? "md:grid-cols-4"
                              : !comboSettings.shared_validity ||
                                  !comboSettings.shared_price ||
                                  !comboSettings.shared_daid
                                ? "md:grid-cols-3"
                                : "md:grid-cols-2"
                          } mb-3`}
                        >
                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Unit
                            </label>
                            <Input type="text"
                              value={editingCardResourceIndex === index ? editingCardData.unit : getResourceTypeLabel(resource.unit)}
                              disabled={editingCardResourceIndex !== index}
                              onChange={(value) =>
                                setEditingCardData({
                                  ...editingCardData,
                                  unit: String(value),
                                })
                              }
                              className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm ${
                                editingCardResourceIndex === index ? "" : "bg-gray-50"
                              }`}
                              style={{
                                borderColor: color.border.default,
                                color: editingCardResourceIndex === index ? "auto" : color.text.secondary,
                              }}
                            />
                          </div>

                          <div>
                            <label
                              className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                            >
                              Value {isDataType(resource.unit) && "(MB)"}
                            </label>
                            <Input type="number"
                              min="0"
                              step="1"
                              value={
                                editingCardResourceIndex === index
                                  ? editingCardData.unit_value === 0
                                    ? ""
                                    : editingCardData.unit_value ?? ""
                                  : resource.unit_value === 0
                                  ? ""
                                  : (resource.unit_value ?? "")
                              }
                              disabled={editingCardResourceIndex !== index}
                              onChange={(value) => {
                                const val =
                                  String(value) === ""
                                    ? 0
                                    : parseFloat(String(value));
                                setEditingCardData({
                                  ...editingCardData,
                                  unit_value: isNaN(val) ? 0 : val,
                                });
                              }}
                              className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm ${
                                editingCardResourceIndex === index ? "" : "bg-gray-50"
                              }`}
                              style={{
                                borderColor: color.border.default,
                                color: editingCardResourceIndex === index ? "auto" : color.text.secondary,
                              }}
                              placeholder="Enter value"
                            />
                          </div>

                          {!comboSettings.shared_validity && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                Validity (Hours)
                              </label>
                              <Input type="number"
                                min="1"
                                step="1"
                                value={
                                  editingCardResourceIndex === index
                                    ? editingCardData.validity_hours ?? ""
                                    : resource.validity_hours ?? ""
                                }
                                disabled={editingCardResourceIndex !== index}
                                onChange={(value) =>
                                  setEditingCardData({
                                    ...editingCardData,
                                    validity_hours: String(value)
                                      ? parseInt(String(value), 10)
                                      : (0 as number),
                                  })
                                }
                                className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm ${
                                  editingCardResourceIndex === index ? "" : "bg-gray-50"
                                }`}
                                style={{
                                  borderColor: color.border.default,
                                  color: editingCardResourceIndex === index ? "auto" : color.text.secondary,
                                }}
                                placeholder="e.g., 72"
                              />
                            </div>
                          )}

                          {!comboSettings.shared_price && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                Price
                              </label>
                              <Input type="number"
                                min="0"
                                step="0.01"
                                value={
                                  editingCardResourceIndex === index
                                    ? editingCardData.price ?? ""
                                    : resource.price ?? ""
                                }
                                disabled={editingCardResourceIndex !== index}
                                onChange={(value) =>
                                  setEditingCardData({
                                    ...editingCardData,
                                    price: String(value)
                                      ? parseFloat(String(value))
                                      : (0 as number),
                                  })
                                }
                                className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm ${
                                  editingCardResourceIndex === index ? "" : "bg-gray-50"
                                }`}
                                style={{
                                  borderColor: color.border.default,
                                  color: editingCardResourceIndex === index ? "auto" : color.text.secondary,
                                }}
                                placeholder="Enter price"
                              />
                            </div>
                          )}

                          {!comboSettings.shared_daid && (
                            <div>
                              <label
                                className={`block text-xs font-medium ${tw.textPrimary} mb-2`}
                              >
                                DAID Account
                              </label>
                              <Input type="text"
                                value={
                                  editingCardResourceIndex === index
                                    ? editingCardData.daid_account ?? ""
                                    : resource.daid_account ?? ""
                                }
                                disabled={editingCardResourceIndex !== index}
                                onChange={(value) =>
                                  setEditingCardData({
                                    ...editingCardData,
                                    daid_account: String(value),
                                  })
                                }
                                className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm ${
                                  editingCardResourceIndex === index ? "" : "bg-gray-50"
                                }`}
                                style={{
                                  borderColor: color.border.default,
                                  color: editingCardResourceIndex === index ? "auto" : color.text.secondary,
                                }}
                                placeholder="Enter DAID"
                              />
                            </div>
                          )}
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
                  zIndex={zIndex.popover}
                />
              </div>

              {!isComboType && (
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
                    options={resourceTypeOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label,
                    }))}
                    value={formData.unit || resourceTypeOptions[0]?.value || ""}
                    onChange={(value) =>
                      onInputChange("unit", value as ProductUnit)
                    }
                    placeholder="Select resource type"
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                </div>
              )}
            </div>

            {/* Value & Validity (Not sent to backend - for future use) */}
            {!isComboType && (
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                  >
                    Value ({currentUnitLabel})
                  </label>
                  <Input type="number"
                    min="0"
                    step="1"
                    value={
                      formData.unit_value === 0
                        ? ""
                        : (formData.unit_value ?? "")
                    }
                    onChange={(value) => {
                      const val =
                        String(value) === "" ? 0 : parseFloat(String(value));
                      onInputChange("unit_value", isNaN(val) ? 0 : val);
                    }}
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
                  <Input type="number"
                    min="1"
                    max="8760"
                    step="1"
                    value={formData.validity_hours ?? ""}
                    onChange={(value) =>
                      onInputChange(
                        "validity_hours",
                        String(value)
                          ? parseInt(String(value), 10)
                          : undefined,
                      )
                    }
                    className={`w-full px-4 py-2.5 border ${tw.rounded} text-sm transition-all outline-none ${
                      focusedField === "validity_hours"
                        ? "border-blue-500 ring-2 ring-blue-500/20"
                        : "border-gray-300"
                    }`}
                    placeholder="1-8760 hours"
                    onFocus={() => setFocusedField("validity_hours")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>
            )}
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

      {/* Create Utility Modal */}
      <CreateUtilityModal
        isOpen={isCreateUtilityModalOpen}
        onClose={() => setIsCreateUtilityModalOpen(false)}
        onSave={async (utility) => {
          // Add custom utility to the list and select it
          const newUtility = {
            value: utility.name.toLowerCase().replace(/\s+/g, "-"),
            label: utility.name,
          };
          setCustomUtilities((prev) => [...prev, newUtility]);
          setSelectedUtility(newUtility.value);
        }}
      />

      {/* Create Product Type Modal */}
      <CreateProductTypeModal
        isOpen={showCreateTypeModal}
        onClose={() => setShowCreateTypeModal(false)}
        onTypeCreated={(typeId) => {
          onInputChange(
            "product_type_id" as keyof (
              | CreateProductRequest
              | UpdateProductRequest
            ),
            typeId,
          );
          refreshProductTypes();
          setShowCreateTypeModal(false);
        }}
      />
    </>
  );
}
