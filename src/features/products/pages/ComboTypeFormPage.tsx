import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, ChevronDown, Edit } from "lucide-react";
import { ComboType, comboTypeService } from "../services/comboTypeService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import { tw, color, getButtonStyles, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { resourceTypesConfig, utilitiesConfig } from "../../configurations/configs/configurationPageConfigs";
import CreateUtilityModal from "../../configurations/components/CreateUtilityModal";

// Build resource type options from config
const RESOURCE_TYPE_OPTIONS = resourceTypesConfig.initialData
  .filter((rt: any) => rt.isActive)
  .map((rt: any) => ({
    value: rt.value,
    label: rt.name,
  }));

// Helper to get valid units for a selected resource type
const getValidUnitsForResourceType = (
  resourceTypeValue: string
): { value: string; label: string }[] => {
  const resourceType = resourceTypesConfig.initialData.find(
    (rt: any) => rt.value === resourceTypeValue
  ) as any;

  if (!resourceType || !resourceType.validUnits) {
    return [];
  }

  return resourceType.validUnits.map((unit: string) => ({
    value: unit,
    label: unit,
  }));
};

export default function ComboTypeFormPage() {
  // Helper to get utilities from config
  const getUtilitiesOptions = () => {
    const configUtilities = utilitiesConfig.initialData
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    comboResources: [],
  });

  const [selectedResourceType, setSelectedResourceType] = useState<string>("");
  const [selectedUtility, setSelectedUtility] = useState<string>("");

  const [comboSettings, setComboSettings] = useState({
    sharedValidity: true,
    sharedPrice: true,
  });

  const [tempResourceData, setTempResourceData] = useState({
    value: "",
    unit: "",
    price: "",
    validityHours: "",
  });

  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateUtilityModalOpen, setIsCreateUtilityModalOpen] = useState(false);
  const [customUtilities, setCustomUtilities] = useState<Array<{ value: string; label: string }>>([]);
  const [isAddResourceExpanded, setIsAddResourceExpanded] = useState(false);
  const [editingCardResourceId, setEditingCardResourceId] = useState<number | null>(null);
  const [editingCardData, setEditingCardData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const loadComboType = async () => {
        try {
          const data = await comboTypeService.getComboTypeById(parseInt(id));
          setFormData({
            name: data.name || "",
            description: data.description || "",
            isActive: data.is_active ?? true,
            comboResources: data.combo_resources
              ? data.combo_resources.map((r: any, idx: number) => ({
                  id: Date.now() + idx,
                  type: r.resource_type,
                  value:
                    r.unit_value !== undefined && r.unit_value !== null
                      ? String(r.unit_value)
                      : "",
                  unit: r.unit,
                  price: r.price ? String(r.price) : "",
                  validityHours:
                    r.shared_validity_hours !== undefined &&
                    r.shared_validity_hours !== null
                      ? String(r.shared_validity_hours)
                      : "",
                }))
              : [],
          });
          // Set combo settings from the first resource if available
          if (data.combo_resources && data.combo_resources.length > 0) {
            setComboSettings({
              sharedValidity: data.combo_resources[0]?.shared_validity ?? true,
              sharedPrice: !!data.combo_resources[0]?.price || false,
            });
          }
        } catch (err) {
          console.error("Failed to load combo type:", err);
          showError("Error", "Failed to load combo type");
          setError("Failed to load combo type");
        } finally {
          setIsLoading(false);
        }
      };
      loadComboType();
    }
  }, [id, showError]);

  const handleAddResource = () => {
    if (!selectedResourceType || !tempResourceData.unit) {
      showError(
        "Validation Error",
        "Please select both resource type and unit"
      );
      return;
    }

    // For Utility resource type, also require utility selection
    if (selectedResourceType === "utility" && !selectedUtility) {
      showError(
        "Validation Error",
        "Please select a utility"
      );
      return;
    }

    setFormData((prev) => ({
      ...prev,
      comboResources: [
        ...prev.comboResources,
        {
          id: Date.now() + prev.comboResources.length,
          type: selectedResourceType,
          value: tempResourceData.value,
          unit: tempResourceData.unit,
          price: tempResourceData.price,
          validityHours: tempResourceData.validityHours,
        },
      ],
    }));

    setSelectedResourceType("");
    setSelectedUtility("");
    setTempResourceData({
      value: "",
      unit: "",
      price: "",
      validityHours: "",
    });
  };

  const handleRemoveResource = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      comboResources: prev.comboResources.filter((r) => r.id !== id),
    }));
  };

  const handleResourceChange = (id: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      comboResources: prev.comboResources.map((resource) =>
        resource.id === id ? { ...resource, [field]: value } : resource,
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Validation Error", "Name is required");
      return;
    }
    if (formData.comboResources.length === 0) {
      showError("Validation Error", "At least one resource is required");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        is_active: formData.isActive,
        combo_resources: formData.comboResources.map((resource) => ({
          resource_type: resource.type,
          unit_value:
            resource.value !== "" && resource.value !== null
              ? parseFloat(String(resource.value))
              : undefined,
          unit: resource.unit,
          price: !comboSettings.sharedPrice && resource.price
            ? parseFloat(String(resource.price))
            : undefined,
          shared_validity: comboSettings.sharedValidity,
          shared_validity_hours:
            comboSettings.sharedValidity && tempResourceData.validityHours !== "" &&
            tempResourceData.validityHours !== null
              ? parseInt(String(tempResourceData.validityHours))
              : undefined,
        })),
      };

      if (id) {
        // Edit mode
        await comboTypeService.updateComboType(parseInt(id), payload);
        success(
          "Combo Type Updated",
          `"${formData.name}" has been updated successfully.`
        );
        navigate(`/dashboard/combo-types/${id}`);
      } else {
        // Create mode
        const newComboType = await comboTypeService.createComboType(payload);
        success(
          "Combo Type Created",
          `"${formData.name}" has been created successfully.`
        );
        navigate(`/dashboard/combo-types/${newComboType.id}`);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to save combo type"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Filter out already-selected resource types
  const availableResourceTypes = RESOURCE_TYPE_OPTIONS.filter(
    (opt) => !formData.comboResources.some((r) => r.type === opt.value)
  );

  // Get valid units for the selected resource type
  const validUnitsForSelected = useMemo(() => {
    if (!selectedResourceType) return [];
    return getValidUnitsForResourceType(selectedResourceType);
  }, [selectedResourceType]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <LoadingSpinner variant="modern" size="xl" color="primary" className="mb-4" />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading combo type...
        </p>
      </div>
    );
  }

  if (error && id) {
    return (
      <div className="space-y-6">
        <BackButton fallbackTo="/dashboard/combo-types" showBreadcrumb={true} />
        <div className="text-center py-12">
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            Error Loading Combo Type
          </h3>
          <p className={`${tw.textMuted} mb-6`}>{error}</p>
          <button
            onClick={() => navigate("/dashboard/combo-types")}
            className="px-4 py-2 text-white rounded-md font-semibold transition-colors"
            style={{ backgroundColor: color.primary.action }}
          >
            Back to Combo Types
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <BackButton
          fallbackTo="/dashboard/combo-types"
          showBreadcrumb={true}
          currentLabel={id ? "Edit Combo Type" : "Create Combo Type"}
        />
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(value) =>
                  setFormData({ ...formData, name: String(value) })
                }
                placeholder="Enter combo type name"
                disabled={isSaving}
                variant="medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
                disabled={isSaving}
              />
            </div>


            <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
              setFormData({ ...formData, isActive: !formData.isActive })
            }>
              <Checkbox
                id="is-active"
                checked={formData.isActive}
                onChange={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                disabled={isSaving}
              />
              <span className="text-sm font-medium text-gray-700">
                Active
              </span>
            </div>
          </div>

          {/* Combo Resources */}
          <div
            className={`${tw.rounded} border p-5 space-y-4`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.cards,
            }}
          >
            <div className="mb-4">
              <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-1`}>
                Combo Resources
              </h3>
              <p className="text-xs" style={{ color: color.text.secondary }}>
                Add resources (Data, Voice, SMS) to this combo product
              </p>
            </div>

            {/* Shared Configuration Checkboxes */}
            <div className="mb-3 pb-1">
              <div className="grid gap-4 md:grid-cols-2 mb-4">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                  setComboSettings({
                    ...comboSettings,
                    sharedValidity: !comboSettings.sharedValidity,
                  })
                }>
                  <Checkbox
                    id="shared-validity"
                    checked={comboSettings.sharedValidity}
                    onChange={() =>
                      setComboSettings({
                        ...comboSettings,
                        sharedValidity: !comboSettings.sharedValidity,
                      })
                    }
                    disabled={isSaving}
                  />
                  <span className={`text-sm font-medium ${tw.textPrimary}`}>
                    Shared Validity
                  </span>
                </div>

                <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
                  setComboSettings({
                    ...comboSettings,
                    sharedPrice: !comboSettings.sharedPrice,
                  })
                }>
                  <Checkbox
                    id="shared-price"
                    checked={comboSettings.sharedPrice}
                    onChange={() =>
                      setComboSettings({
                        ...comboSettings,
                        sharedPrice: !comboSettings.sharedPrice,
                      })
                    }
                    disabled={isSaving}
                  />
                  <span className={`text-sm font-medium ${tw.textPrimary}`}>
                    Shared Price
                  </span>
                </div>
              </div>

              {/* Validity and Price Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Shared Validity Hours */}
                {comboSettings.sharedValidity && (
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Validity (Hours) <span style={{ color: color.status.danger }}>*</span>
                    </label>
                    <Input
                      type="number"
                      value={tempResourceData.validityHours}
                      onChange={(value) =>
                        setTempResourceData({
                          ...tempResourceData,
                          validityHours: String(value),
                        })
                      }
                      placeholder="e.g., 720 (30 days)"
                      disabled={isSaving}
                      variant="medium"
                    />
                  </div>
                )}

                {/* Shared Combo Price */}
                {comboSettings.sharedPrice && (
                  <div>
                    <label
                      className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
                    >
                      Combo Price <span style={{ color: color.status.danger }}>*</span>
                    </label>
                    <Input
                      type="number"
                      value={tempResourceData.price}
                      onChange={(value) =>
                        setTempResourceData({
                          ...tempResourceData,
                          price: String(value),
                        })
                      }
                      placeholder="Enter combo price"
                      disabled={isSaving}
                      variant="medium"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Add Resource Accordion */}
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
                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                        Resource Type
                      </label>
                      <HeadlessSelect
                        options={availableResourceTypes}
                        value={selectedResourceType}
                        onChange={(value: string | number) => {
                          const newType = value as string;
                          setSelectedResourceType(newType);

                          // Auto-select the mapped unit for the selected resource type
                          const resourceType = resourceTypesConfig.initialData.find(
                            (rt: any) => rt.value === newType
                          ) as any;
                          const defaultUnit = resourceType?.validUnits?.[0] || "";

                          setTempResourceData({
                            ...tempResourceData,
                            unit: defaultUnit,
                          });
                          if (newType !== "utility") {
                            setSelectedUtility("");
                          }
                        }}
                        disabled={isSaving || availableResourceTypes.length === 0}
                        placeholder={
                          availableResourceTypes.length === 0
                            ? "All types added"
                            : "Select resource type"
                        }
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                        Unit
                      </label>
                      <HeadlessSelect
                        options={validUnitsForSelected}
                        value={tempResourceData.unit}
                        onChange={(value: string | number) =>
                          setTempResourceData({
                            ...tempResourceData,
                            unit: value as string,
                          })
                        }
                        disabled={isSaving || !selectedResourceType}
                        placeholder={
                          !selectedResourceType
                            ? "Select resource first"
                            : "Select unit"
                        }
                      />
                    </div>

                    {/* Utility Selection - show when Utility resource type is selected */}
                    {selectedResourceType === "utility" && (
                      <div>
                        <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
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
                          disabled={isSaving}
                          placeholder="Select utility"
                        />
                      </div>
                    )}

                    <div>
                      <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                        Value
                      </label>
                      <Input
                        type="text"
                        value={tempResourceData.value}
                        onChange={(value) =>
                          setTempResourceData({
                            ...tempResourceData,
                            value: String(value),
                          })
                        }
                        placeholder="Enter value"
                        disabled={isSaving}
                        variant="medium"
                      />
                    </div>

                    {!comboSettings.sharedPrice && (
                      <div>
                        <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                          Price
                        </label>
                        <Input
                          type="number"
                          value={tempResourceData.price}
                          onChange={(value) =>
                            setTempResourceData({
                              ...tempResourceData,
                              price: String(value),
                            })
                          }
                          placeholder="Enter price"
                          disabled={isSaving}
                          variant="medium"
                        />
                      </div>
                    )}

                    {!comboSettings.sharedValidity && (
                      <div>
                        <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                          Validity Hours
                        </label>
                        <Input
                          type="number"
                          value={tempResourceData.validityHours}
                          onChange={(value) =>
                            setTempResourceData({
                              ...tempResourceData,
                              validityHours: String(value),
                            })
                          }
                          placeholder="Enter validity hours"
                          disabled={isSaving}
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
                        showError("Validation Error", "Please select a utility");
                        return;
                      }

                      // Add resource
                      handleAddResource();
                      // Collapse accordion after adding
                      setIsAddResourceExpanded(false);
                    }}
                    disabled={!selectedResourceType || !tempResourceData.value || isSaving}
                    style={{
                      ...getButtonStyles(button.bordered),
                      color: "#000000",
                      fontWeight: 500,
                      cursor: (selectedResourceType && tempResourceData.value && !isSaving)
                        ? "pointer"
                        : "not-allowed",
                      opacity: (selectedResourceType && tempResourceData.value && !isSaving) ? 1 : 0.5,
                    }}
                  >
                    Save Resource
                  </button>
                </div>
              )}
            </div>

            {/* Added Resources List */}
            {formData.comboResources.length > 0 && (
              <div className="space-y-3 mb-3">
                {formData.comboResources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`${tw.rounded} border p-4`}
                    style={{
                      borderColor: color.border.default,
                      backgroundColor: color.surface.background,
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-sm font-medium ${tw.textPrimary}`}>
                        {RESOURCE_TYPE_OPTIONS.find(
                          (opt) => opt.value === resource.type
                        )?.label || resource.type}
                      </span>
                      <div className="flex gap-2">
                        {editingCardResourceId === resource.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  comboResources: prev.comboResources.map((r) =>
                                    r.id === resource.id
                                      ? {
                                          ...r,
                                          value: editingCardData.value,
                                          unit: editingCardData.unit,
                                          price: editingCardData.price,
                                          validityHours: editingCardData.validityHours,
                                        }
                                      : r
                                  ),
                                }));
                                setEditingCardResourceId(null);
                                setEditingCardData(null);
                              }}
                              disabled={isSaving}
                              style={{
                                ...getButtonStyles(button.action),
                                fontWeight: "500",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                opacity: isSaving ? 0.5 : 1,
                              }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCardResourceId(null);
                                setEditingCardData(null);
                              }}
                              disabled={isSaving}
                              style={{
                                ...getButtonStyles(button.bordered),
                                fontWeight: "500",
                                cursor: isSaving ? "not-allowed" : "pointer",
                                opacity: isSaving ? 0.5 : 1,
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
                                setEditingCardResourceId(resource.id);
                                setEditingCardData({
                                  value: resource.value,
                                  unit: resource.unit,
                                  price: resource.price,
                                  validityHours: resource.validityHours,
                                });
                              }}
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              disabled={isSaving}
                              title="Edit resource"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveResource(resource.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              disabled={isSaving}
                              title="Delete resource"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={`grid gap-3 ${
                        !comboSettings.sharedValidity && !comboSettings.sharedPrice
                          ? "md:grid-cols-4"
                          : (!comboSettings.sharedValidity || !comboSettings.sharedPrice)
                          ? "md:grid-cols-3"
                          : "md:grid-cols-2"
                      }`}
                    >
                      <div>
                        <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                          Unit
                        </label>
                        <Input
                          type="text"
                          value={editingCardResourceId === resource.id ? editingCardData.unit : resource.unit}
                          disabled={editingCardResourceId !== resource.id}
                          onChange={(value) =>
                            setEditingCardData({
                              ...editingCardData,
                              unit: String(value),
                            })
                          }
                          variant="medium"
                          className={editingCardResourceId !== resource.id ? "bg-gray-50" : ""}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                          Value
                        </label>
                        <Input
                          type="text"
                          value={editingCardResourceId === resource.id ? editingCardData.value : resource.value}
                          disabled={editingCardResourceId !== resource.id}
                          onChange={(value) =>
                            setEditingCardData({
                              ...editingCardData,
                              value: String(value),
                            })
                          }
                          variant="medium"
                          className={editingCardResourceId !== resource.id ? "bg-gray-50" : ""}
                        />
                      </div>

                      {!comboSettings.sharedValidity && (
                        <div>
                          <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                            Validity (Hours)
                          </label>
                          <Input
                            type="number"
                            value={editingCardResourceId === resource.id ? editingCardData.validityHours : resource.validityHours}
                            disabled={editingCardResourceId !== resource.id}
                            onChange={(value) =>
                              setEditingCardData({
                                ...editingCardData,
                                validityHours: String(value),
                              })
                            }
                            variant="medium"
                            className={editingCardResourceId !== resource.id ? "bg-gray-50" : ""}
                          />
                        </div>
                      )}

                      {!comboSettings.sharedPrice && (
                        <div>
                          <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
                            Price
                          </label>
                          <Input
                            type="number"
                            value={editingCardResourceId === resource.id ? editingCardData.price : resource.price}
                            disabled={editingCardResourceId !== resource.id}
                            onChange={(value) =>
                              setEditingCardData({
                                ...editingCardData,
                                price: String(value),
                              })
                            }
                            variant="medium"
                            className={editingCardResourceId !== resource.id ? "bg-gray-50" : ""}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-2 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/combo-types")}
              disabled={isSaving}
              className="px-8 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Create Custom Utility Modal */}
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
      </div>
    </div>
  );
}
