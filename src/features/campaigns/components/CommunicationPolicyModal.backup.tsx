import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  Plus,
  Trash2,
  Clock,
  BarChart3,
  BellOff,
  Star,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import {
  CommunicationPolicyConfiguration,
  CreateCommunicationPolicyRequest,
  CommunicationPolicyType,
  COMMUNICATION_POLICY_TYPES,
  TimeWindowConfig,
  MaximumCommunicationConfig,
  DNDConfig,
  VIPListConfig,
  DNDCategory,
  DND_CATEGORIES,
  DAYS_OF_WEEK,
} from "../types/communicationPolicyConfig";

interface CommunicationPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy?: CommunicationPolicyConfiguration;
  onSave: (policy: CreateCommunicationPolicyRequest) => Promise<void>;
  isSaving?: boolean;
}

export default function CommunicationPolicyModal({
  isOpen,
  onClose,
  policy,
  onSave,
  isSaving = false,
}: CommunicationPolicyModalProps) {
  const [formData, setFormData] = useState<CreateCommunicationPolicyRequest>({
    name: "",
    description: "",
    type: "timeWindow",
    config: {
      startTime: "09:00",
      endTime: "18:00",
      timezone: "UTC",
      days: [],
    } as TimeWindowConfig,
    isActive: true,
  });
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (policy) {
      setFormData({
        name: policy.name,
        description: policy.description || "",
        type: policy.type,
        config: policy.config,
        isActive: policy.isActive,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        type: "timeWindow",
        config: {
          startTime: "09:00",
          endTime: "18:00",
          timezone: "UTC",
          days: [],
        } as TimeWindowConfig,
        isActive: true,
      });
    }
    setError("");
  }, [policy, isOpen]);

  const handleTypeChange = (newType: CommunicationPolicyType) => {
    let defaultConfig: any;

    switch (newType) {
      case "timeWindow":
        defaultConfig = {
          startTime: "09:00",
          endTime: "18:00",
          timezone: "UTC",
          days: [],
        } as TimeWindowConfig;
        break;
      case "maximumCommunication":
        defaultConfig = {
          type: "daily",
          maxCount: 1,
        } as MaximumCommunicationConfig;
        break;
      case "dnd":
        defaultConfig = {
          categories: [],
        } as DNDConfig;
        break;
      case "vipList":
        defaultConfig = {
          action: "include",
          vipLists: [],
          priority: 1,
        } as VIPListConfig;
        break;
    }

    setFormData((prev) => ({
      ...prev,
      type: newType,
      config: defaultConfig,
    }));
    setIsTypeDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Policy name is required");
      return;
    }

    setError("");
    await onSave(formData);
  };

  const getTypeIcon = (type: CommunicationPolicyType) => {
    switch (type) {
      case "timeWindow":
        return <Clock className="w-4 h-4" />;
      case "maximumCommunication":
        return <BarChart3 className="w-4 h-4" />;
      case "dnd":
        return <BellOff className="w-4 h-4" />;
      case "vipList":
        return <Star className="w-4 h-4" />;
    }
  };

  const renderConfigurationFields = () => {
    switch (formData.type) {
      case "timeWindow":
        const timeConfig = formData.config as TimeWindowConfig;
        return (
          <div className="space-y-4">
            <h4 className={`${tw.cardTitle} ${tw.textPrimary}`}>
              Time Window Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={timeConfig.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...timeConfig, startTime: e.target.value },
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157]`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={timeConfig.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: { ...timeConfig, endTime: e.target.value },
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157]`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week (optional)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={timeConfig.days?.includes(day.value) || false}
                      onChange={(e) => {
                        const days = timeConfig.days || [];
                        const newDays = e.target.checked
                          ? [...days, day.value]
                          : days.filter((d) => d !== day.value);
                        setFormData((prev) => ({
                          ...prev,
                          config: { ...timeConfig, days: newDays },
                        }));
                      }}
                      className={`rounded ${tw.borderDefault} focus:ring-2 focus:ring-[${color.primary.action}] text-[${color.primary.action}]`}
                      style={
                        {
                          accentColor: color.primary.action,
                          "--tw-ring-color": color.primary.action,
                        } as React.CSSProperties
                      }
                    />
                    <span className="text-sm text-gray-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "maximumCommunication":
        const maxConfig = formData.config as MaximumCommunicationConfig;
        return (
          <div className="space-y-4">
            <h4 className={`${tw.cardTitle} ${tw.textPrimary}`}>
              Maximum Communication Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Type
                </label>
                <select
                  value={maxConfig.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...maxConfig,
                        type: e.target.value as "daily" | "weekly" | "monthly",
                      },
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157]`}
                >
                  <option value="daily">Daily Maximum</option>
                  <option value="weekly">Weekly Maximum</option>
                  <option value="monthly">Monthly Maximum</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxConfig.maxCount}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...maxConfig,
                        maxCount: parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157]`}
                />
              </div>
            </div>
          </div>
        );

      case "dnd":
        const dndConfig = formData.config as DNDConfig;
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className={`${tw.cardTitle} ${tw.textPrimary}`}>
                Do Not Disturb Configuration
              </h4>
              <button
                type="button"
                onClick={() => {
                  const newCategory: DNDCategory = {
                    id: Date.now().toString(),
                    name: "",
                    type: "marketing",
                    status: "stop",
                  };
                  setFormData((prev) => ({
                    ...prev,
                    config: {
                      ...dndConfig,
                      categories: [...dndConfig.categories, newCategory],
                    },
                  }));
                }}
                className={`${tw.button} flex items-center gap-1 text-xs px-3 py-1`}
              >
                <Plus className="w-3 h-3" />
                Add Category
              </button>
            </div>
            <div className="space-y-3">
              {dndConfig.categories.map((category, index) => (
                <div
                  key={category.id}
                  className={`p-3 ${tw.borderDefault} border ${tw.rounded}`}
                >
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label
                        className={`block ${tw.label} ${tw.textSecondary} mb-1`}
                      >
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={category.name}
                        onChange={(e) => {
                          const newCategories = [...dndConfig.categories];
                          newCategories[index] = {
                            ...category,
                            name: e.target.value,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            config: { ...dndConfig, categories: newCategories },
                          }));
                        }}
                        className={`${components.input.default} w-full px-2 py-1 ${tw.caption}`}
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <label
                        className={`block ${tw.label} ${tw.textSecondary} mb-1`}
                      >
                        Type
                      </label>
                      <select
                        value={category.type}
                        onChange={(e) => {
                          const newCategories = [...dndConfig.categories];
                          newCategories[index] = {
                            ...category,
                            type: e.target.value as any,
                          };
                          setFormData((prev) => ({
                            ...prev,
                            config: { ...dndConfig, categories: newCategories },
                          }));
                        }}
                        className={`${components.input.default} w-full px-2 py-1 ${tw.caption}`}
                      >
                        {DND_CATEGORIES.map((cat) => (
                          <option key={cat.type} value={cat.type}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label
                          className={`block ${tw.label} ${tw.textSecondary} mb-1`}
                        >
                          Status
                        </label>
                        <select
                          value={category.status}
                          onChange={(e) => {
                            const newCategories = [...dndConfig.categories];
                            newCategories[index] = {
                              ...category,
                              status: e.target.value as "stop" | "subscribe",
                            };
                            setFormData((prev) => ({
                              ...prev,
                              config: {
                                ...dndConfig,
                                categories: newCategories,
                              },
                            }));
                          }}
                          className={`${components.input.default} w-full px-2 py-1 ${tw.caption}`}
                        >
                          <option value="stop">Stop</option>
                          <option value="subscribe">Subscribe</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newCategories = dndConfig.categories.filter(
                            (_, i) => i !== index
                          );
                          setFormData((prev) => ({
                            ...prev,
                            config: { ...dndConfig, categories: newCategories },
                          }));
                        }}
                        className={`p-1 ${tw.danger} ${tw.statusDanger10} rounded`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {dndConfig.categories.length === 0 && (
                <p className={`${tw.caption} ${tw.textMuted} text-center py-4`}>
                  No DND categories configured. Click "Add Category" to get
                  started.
                </p>
              )}
            </div>
          </div>
        );

      case "vipList":
        const vipConfig = formData.config as VIPListConfig;
        return (
          <div className="space-y-4">
            <h4 className={`${tw.cardTitle} ${tw.textPrimary}`}>
              VIP List Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action
                </label>
                <select
                  value={vipConfig.action}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...vipConfig,
                        action: e.target.value as "include" | "exclude",
                      },
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157]`}
                >
                  <option value="include">Include VIP List</option>
                  <option value="exclude">Exclude VIP List</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <input
                  type="number"
                  min="1"
                  value={vipConfig.priority || 1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      config: {
                        ...vipConfig,
                        priority: parseInt(e.target.value) || 1,
                      },
                    }))
                  }
                  className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157]`}
                />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                VIP lists will be managed separately. This configuration defines
                how VIP customers are handled in campaigns.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const selectedType = COMMUNICATION_POLICY_TYPES.find(
    (t) => t.value === formData.type
  );

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div
        className={`${components.card.surface} w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        <div
          className={`flex items-center justify-between p-6 ${tw.borderDefault} border-b`}
        >
          <h2 className={`${tw.subtitle} ${tw.textPrimary}`}>
            {policy
              ? "Edit Communication Policy"
              : "Create Communication Policy"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 ${tw.hover} ${tw.rounded} transition-colors`}
          >
            <X className={`w-5 h-5 ${tw.textMuted}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
                  Policy Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={`${components.input.default} w-full px-3 py-2`}
                  placeholder="Enter policy name"
                  required
                />
              </div>

              <div>
                <label className={`block ${tw.label} ${tw.textSecondary} mb-2`}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className={`${components.input.default} w-full px-3 py-2`}
                  placeholder="Enter policy description"
                  rows={3}
                />
              </div>

              {/* Policy Type Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Type *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#588157] focus:border-[#588157] bg-white text-left flex items-center justify-between`}
                  >
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(formData.type)}
                      <span>{selectedType?.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isTypeDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isTypeDropdownOpen && (
                    <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 ${tw.rounded} shadow-lg max-h-60 overflow-auto`}>
                      {COMMUNICATION_POLICY_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => handleTypeChange(type.value)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {type.label}
                            </div>
                            <div className="text-sm text-gray-500">
                              {type.description}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Configuration Fields */}
            {renderConfigurationFields()}

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className={`rounded ${tw.borderDefault} focus:ring-2 focus:ring-[${color.primary.action}] text-[${color.primary.action}]`}
                  style={
                    {
                      accentColor: color.primary.action,
                      "--tw-ring-color": color.primary.action,
                    } as React.CSSProperties
                  }
                />
                <span
                  className={`${tw.caption} font-medium ${tw.textSecondary}`}
                >
                  Active Policy
                </span>
              </label>
            </div>
          </div>

          {error && (
            <div className={`mt-4 p-3 bg-red-50 border border-red-200 ${tw.rounded}`}>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 ${tw.textSecondary} ${tw.hover} ${tw.rounded} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`${tw.button} ${tw.disabled}`}
            >
              {isSaving
                ? "Saving..."
                : policy
                ? "Update Policy"
                : "Create Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
