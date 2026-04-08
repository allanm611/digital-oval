import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ComboType } from "../services/comboTypeService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw, color } from "../../../shared/utils/utils";

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
        type: "data" as "data" | "voice" | "sms",
        value: "",
        unit: "MB",
        sharedValidity: false,
        sharedValidityHours: "",
      },
    ],
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
          ? comboType.combo_resources.map((r: any) => ({
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
    setFormData((prev) => ({
      ...prev,
      comboResources: [
        ...prev.comboResources,
        {
          type: "data" as const,
          value: "",
          unit: "MB",
          sharedValidity: false,
          sharedValidityHours: "",
        },
      ],
    }));
  };

  const handleRemoveResource = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      comboResources: prev.comboResources.filter((_, i) => i !== index),
    }));
  };

  const handleResourceChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      comboResources: prev.comboResources.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource,
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
          ...resource,
          value:
            resource.value !== "" && resource.value !== null
              ? parseFloat(String(resource.value))
              : undefined,
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

            <div className="space-y-2">
              <Checkbox
                label="Shared Validity"
                checked={formData.sharedValidity}
                onChange={(e) =>
                  setFormData({ ...formData, sharedValidity: e.target.checked })
                }
                disabled={isLoading}
              />
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

            <div className="space-y-2">
              <Checkbox
                label="Active"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Combo Resources */}
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Combo Resources *
              </h3>
              <button
                type="button"
                onClick={handleAddResource}
                disabled={isLoading}
                className={`px-3 py-1 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50`}
                style={{ backgroundColor: color.primary.action }}
              >
                Add Resource
              </button>
            </div>

            <div className="space-y-4">
              {formData.comboResources.map((resource, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Resource Type
                      </label>
                      <HeadlessSelect
                        options={RESOURCE_TYPE_OPTIONS}
                        value={resource.type}
                        onChange={(value: string | number) =>
                          handleResourceChange(index, "type", value)
                        }
                        disabled={isLoading}
                        placeholder="Select resource type"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit
                      </label>
                      <HeadlessSelect
                        options={UNIT_OPTIONS}
                        value={resource.unit}
                        onChange={(value: string | number) =>
                          handleResourceChange(index, "unit", value)
                        }
                        disabled={isLoading}
                        placeholder="Select unit"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={resource.value}
                      onChange={(e) =>
                        handleResourceChange(index, "value", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter value"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Checkbox
                      label="Shared Validity"
                      checked={resource.sharedValidity}
                      onChange={(e) =>
                        handleResourceChange(
                          index,
                          "sharedValidity",
                          e.target.checked,
                        )
                      }
                      disabled={isLoading}
                    />
                  </div>

                  {resource.sharedValidity && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Validity Hours
                      </label>
                      <input
                        type="text"
                        value={resource.sharedValidityHours}
                        onChange={(e) =>
                          handleResourceChange(
                            index,
                            "sharedValidityHours",
                            e.target.value,
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter validity hours"
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {formData.comboResources.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveResource(index)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                    >
                      Remove Resource
                    </button>
                  )}
                </div>
              ))}
            </div>
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
