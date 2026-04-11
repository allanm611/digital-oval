import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { ComboType } from "../services/comboTypeService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw, color } from "../../../shared/utils/utils";
import { buttons } from "../../../shared/utils/tokens";

const RESOURCE_TYPE_OPTIONS = [
  { value: "data", label: "Data" },
  { value: "voice", label: "Voice" },
  { value: "sms", label: "SMS" },
];

const UNIT_OPTIONS = [
  { value: "MB", label: "MB" },
  { value: "GB", label: "GB" },
  { value: "minutes", label: "Minutes" },
  { value: "seconds", label: "Seconds" },
  { value: "count", label: "Count" },
];

interface ComboTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  comboType?: ComboType | null;
  isLoading?: boolean;
}

export default function ComboTypeFormModal({
  isOpen,
  onClose,
  onSubmit,
  comboType,
  isLoading = false,
}: ComboTypeFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
    price: "",
    sharedValidity: false,
    validityHours: "",
    comboResources: [
      {
        id: 1,
        type: "data" as "data" | "voice" | "sms",
        value: "",
        unit: "MB",
        sharedValidity: false,
        sharedValidityHours: "",
      },
    ],
  });

  // Selected resource type for dropdown
  const [selectedResourceType, setSelectedResourceType] = useState<
    "data" | "voice" | "sms" | ""
  >("");

  // Temporary resource data being configured
  const [tempResourceData, setTempResourceData] = useState({
    value: "",
    unit: "MB",
    sharedValidity: false,
    sharedValidityHours: "",
  });

  useEffect(() => {
    if (comboType) {
      setFormData({
        name: comboType.name || "",
        description: comboType.description || "",
        isActive: comboType.is_active ?? true,
        price: comboType.price ? String(comboType.price) : "",
        sharedValidity: comboType.shared_validity ?? false,
        validityHours: comboType.validity_hours
          ? String(comboType.validity_hours)
          : "",
        comboResources: comboType.combo_resources
          ? comboType.combo_resources.map((r: any, idx: number) => ({
              id: Date.now() + idx,
              type: r.resource_type,
              value:
                r.unit_value !== undefined && r.unit_value !== null
                  ? String(r.unit_value)
                  : "",
              unit: r.unit,
              sharedValidity: r.shared_validity,
              sharedValidityHours:
                r.shared_validity_hours !== undefined &&
                r.shared_validity_hours !== null
                  ? String(r.shared_validity_hours)
                  : "",
            }))
          : [
              {
                id: 1,
                type: "data" as const,
                value: "",
                unit: "MB",
                sharedValidity: false,
                sharedValidityHours: "",
              },
            ],
      });
    } else {
      setFormData({
        name: "",
        description: "",
        isActive: true,
        price: "",
        sharedValidity: false,
        validityHours: "",
        comboResources: [
          {
            id: 1,
            type: "data" as const,
            value: "",
            unit: "MB",
            sharedValidity: false,
            sharedValidityHours: "",
          },
        ],
      });
    }
  }, [comboType, isOpen]);

  const handleAddResource = () => {
    if (!selectedResourceType) return;

    setFormData((prev) => ({
      ...prev,
      comboResources: [
        ...prev.comboResources,
        {
          id: Date.now() + prev.comboResources.length,
          type: selectedResourceType,
          value: tempResourceData.value,
          unit: tempResourceData.unit,
          sharedValidity: tempResourceData.sharedValidity,
          sharedValidityHours: tempResourceData.sharedValidityHours,
        },
      ],
    }));

    // Reset
    setSelectedResourceType("");
    setTempResourceData({
      value: "",
      unit: "MB",
      sharedValidity: false,
      sharedValidityHours: "",
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
      alert("Name is required");
      return;
    }
    if (formData.comboResources.length === 0) {
      alert("At least one resource is required");
      return;
    }

    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive,
        price: formData.price ? parseFloat(formData.price) : undefined,
        sharedValidity: formData.sharedValidity,
        validityHours: formData.validityHours
          ? parseInt(formData.validityHours)
          : undefined,
        comboResources: formData.comboResources.map((resource) => ({
          type: resource.type,
          value:
            resource.value !== "" && resource.value !== null
              ? parseFloat(String(resource.value))
              : undefined,
          unit: resource.unit,
          sharedValidity: resource.sharedValidity,
          sharedValidityHours:
            resource.sharedValidityHours !== "" &&
            resource.sharedValidityHours !== null
              ? parseInt(String(resource.sharedValidityHours))
              : undefined,
        })),
      });
      onClose();
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className={`text-xl font-bold ${tw.textPrimary}`}>
            {comboType ? "Edit Combo Type" : "Create Combo Type"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter combo type name"
                disabled={isLoading}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter description"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter price"
                disabled={isLoading}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="shared-validity"
                checked={formData.sharedValidity}
                onChange={(e) =>
                  setFormData({ ...formData, sharedValidity: e.target.checked })
                }
                disabled={isLoading}
              />
              <label
                htmlFor="shared-validity"
                className="text-sm font-medium text-gray-700"
              >
                Shared Validity
              </label>
            </div>

            {formData.sharedValidity && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Validity Hours
                </label>
                <input
                  type="text"
                  value={formData.validityHours}
                  onChange={(e) =>
                    setFormData({ ...formData, validityHours: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter validity hours"
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="is-active"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                disabled={isLoading}
              />
              <label
                htmlFor="is-active"
                className="text-sm font-medium text-gray-700"
              >
                Active
              </label>
            </div>
          </div>

          {/* Combo Resources */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Combo Resources *
            </h3>

            {/* Resource Selection and Input Section */}
            <div
              className={`border border-gray-200 ${tw.rounded} p-4 space-y-3`}
            >
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Resource Type *
                  </label>
                  <HeadlessSelect
                    options={RESOURCE_TYPE_OPTIONS}
                    value={selectedResourceType}
                    onChange={(value: string | number) =>
                      setSelectedResourceType(value as "data" | "voice" | "sms")
                    }
                    disabled={isLoading}
                    placeholder="Select resource"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={tempResourceData.value}
                    onChange={(e) =>
                      setTempResourceData({
                        ...tempResourceData,
                        value: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter value"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Unit
                  </label>
                  <HeadlessSelect
                    options={UNIT_OPTIONS}
                    value={tempResourceData.unit}
                    onChange={(value: string | number) =>
                      setTempResourceData({
                        ...tempResourceData,
                        unit: value as string,
                      })
                    }
                    disabled={isLoading}
                    placeholder="Select unit"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="temp-resource-validity"
                  checked={tempResourceData.sharedValidity}
                  onChange={(e) =>
                    setTempResourceData({
                      ...tempResourceData,
                      sharedValidity: e.target.checked,
                    })
                  }
                  disabled={isLoading}
                />
                <label
                  htmlFor="temp-resource-validity"
                  className="text-sm font-medium text-gray-700"
                >
                  Shared Validity
                </label>
              </div>

              {tempResourceData.sharedValidity && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Validity Hours
                  </label>
                  <input
                    type="text"
                    value={tempResourceData.sharedValidityHours}
                    onChange={(e) =>
                      setTempResourceData({
                        ...tempResourceData,
                        sharedValidityHours: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter validity hours"
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Add Resource Button */}
              <button
                type="button"
                onClick={handleAddResource}
                disabled={!selectedResourceType || isLoading}
                style={{
                  background: buttons.bordered.background,
                  color: "#000000",
                  border: buttons.bordered.border,
                  padding: `${buttons.bordered.paddingY} ${buttons.bordered.paddingX}`,
                  borderRadius: buttons.bordered.borderRadius,
                  fontSize: buttons.bordered.fontSize,
                  fontWeight: 500,
                  cursor:
                    selectedResourceType && !isLoading
                      ? "pointer"
                      : "not-allowed",
                  opacity: selectedResourceType && !isLoading ? 1 : 0.5,
                }}
              >
                Add Resource
              </button>
            </div>

            {/* Added Resources List */}
            {formData.comboResources.length > 0 && (
              <div className="space-y-3">
                {formData.comboResources.map((resource) => (
                  <div
                    key={resource.id}
                    className={`${tw.rounded} border p-4 flex items-start justify-between`}
                    style={{
                      borderColor: color.border.default,
                      backgroundColor: color.surface.background,
                    }}
                  >
                    <div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Type:
                          </span>
                          <p className="font-medium text-gray-900">
                            {RESOURCE_TYPE_OPTIONS.find(
                              (opt) => opt.value === resource.type,
                            )?.label || resource.type}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Unit:
                          </span>
                          <p className="font-medium text-gray-900">
                            {resource.unit}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Value:
                          </span>
                          <p className="font-medium text-gray-900">
                            {resource.value}
                          </p>
                        </div>
                        {resource.sharedValidity && (
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Validity:
                            </span>
                            <p className="font-medium text-gray-900">
                              {resource.sharedValidityHours} hrs
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(resource.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors ml-4"
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
