import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Clock,
  BarChart3,
  BellOff,
  Star,
} from "lucide-react";
import { color, tw, components, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import {
  CommunicationPolicyConfiguration,
  CreateCommunicationPolicyRequest,
  CommunicationPolicyType,
  CommunicationChannel,
  COMMUNICATION_POLICY_TYPES,
  COMMUNICATION_CHANNELS,
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

interface AllPolicyConfigs {
  timeWindow: TimeWindowConfig;
  maximumCommunication: MaximumCommunicationConfig;
  dnd: DNDConfig;
  vipList: VIPListConfig;
}

// Period item for maximum communication (with id for list management)
interface MaxCommPeriod {
  id: string;
  type: "daily" | "weekly" | "monthly";
  maxCount: number;
}

const PERIOD_OPTIONS = [
  { label: "Daily", value: "daily" as const },
  { label: "Weekly", value: "weekly" as const },
  { label: "Monthly", value: "monthly" as const },
];

export default function CommunicationPolicyModal({
  isOpen,
  onClose,
  policy,
  onSave,
  isSaving = false,
}: CommunicationPolicyModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [channels, setChannels] = useState<CommunicationChannel[]>(["EMAIL"]);
  const [isActive, setIsActive] = useState(true);

  const [configs, setConfigs] = useState<AllPolicyConfigs>({
    timeWindow: {
      startTime: "09:00",
      endTime: "18:00",
      timezone: "UTC",
      days: [],
    },
    maximumCommunication: {
      type: "daily",
      maxCount: 3,
    },
    dnd: {
      categories: [],
    },
    vipList: {
      action: "include",
      vipLists: [],
      priority: 1,
    },
  });

  // Track which section is currently expanded (only one at a time)
  const [expandedSection, setExpandedSection] =
    useState<CommunicationPolicyType | null>("timeWindow");

  // Track channel dropdown state
  const [isChannelDropdownOpen, setIsChannelDropdownOpen] = useState(false);

  // Maximum communication periods (multiple)
  const [maxCommPeriods, setMaxCommPeriods] = useState<MaxCommPeriod[]>([]);

  const [error, setError] = useState("");

  useEffect(() => {
    if (policy) {
      setName(policy.name);
      setDescription(policy.description || "");
      setChannels(policy.channels);
      setIsActive(policy.isActive);
    } else {
      setName("");
      setDescription("");
      setChannels(["EMAIL"]);
      setIsActive(true);
      setConfigs({
        timeWindow: {
          startTime: "09:00",
          endTime: "18:00",
          timezone: "UTC",
          days: [],
        },
        maximumCommunication: {
          type: "daily",
          maxCount: 3,
        },
        dnd: {
          categories: [],
        },
        vipList: {
          action: "include",
          vipLists: [],
          priority: 1,
        },
      });
    }
    setError("");
    setIsChannelDropdownOpen(false); // Reset dropdown state when modal opens/closes
    setMaxCommPeriods([]); // Reset periods when modal opens/closes
  }, [policy, isOpen]);

  const toggleSection = (type: CommunicationPolicyType) => {
    // If clicking the currently expanded section, collapse it
    // Otherwise, expand the clicked section (and collapse others)
    setExpandedSection((current) => (current === type ? null : type));
  };

  const updateConfig = <T extends CommunicationPolicyType>(
    type: T,
    updater: (prev: AllPolicyConfigs[T]) => AllPolicyConfigs[T]
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [type]: updater(prev[type] as AllPolicyConfigs[T]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Policy name is required");
      return;
    }

    setError("");

    // Create policies for each type with configurations
    const policyData: CreateCommunicationPolicyRequest = {
      name,
      description,
      channels,
      type: "timeWindow",
      config: configs.timeWindow,
      isActive,
    };

    await onSave(policyData);
  };

  const getTypeIcon = (type: CommunicationPolicyType) => {
    switch (type) {
      case "timeWindow":
        return <Clock className="w-5 h-5" />;
      case "maximumCommunication":
        return <BarChart3 className="w-5 h-5" />;
      case "dnd":
        return <BellOff className="w-5 h-5" />;
      case "vipList":
        return <Star className="w-5 h-5" />;
    }
  };

  const renderTimeWindowConfig = () => {
    const timeConfig = configs.timeWindow;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={timeConfig.startTime}
              onChange={(e) =>
                updateConfig("timeWindow", (prev) => ({
                  ...prev,
                  startTime: e.target.value,
                }))
              }
              className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white`}
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
                updateConfig("timeWindow", (prev) => ({
                  ...prev,
                  endTime: e.target.value,
                }))
              }
              className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white`}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Days of Week
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <label
                key={day.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={timeConfig.days?.includes(day.value) || false}
                  onChange={(e) => {
                    const days = timeConfig.days || [];
                    const newDays = e.target.checked
                      ? [...days, day.value]
                      : days.filter((d) => d !== day.value);
                    updateConfig("timeWindow", (prev) => ({
                      ...prev,
                      days: newDays,
                    }));
                  }}
                  className="rounded"
                  style={{ accentColor: color.primary.action }}
                />
                <span className={`${tw.caption} ${tw.textSecondary}`}>
                  {day.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderMaxCommunicationConfig = () => {
    // Get already selected period types to disable them in other rows
    const selectedPeriodTypes = maxCommPeriods.map((p) => p.type);

    // Find first available period type for new periods
    const getFirstAvailablePeriodType = () => {
      const availableType = PERIOD_OPTIONS.find(
        (opt) => !selectedPeriodTypes.includes(opt.value)
      );
      return availableType?.value || "daily";
    };

    return (
      <div className="space-y-4 overflow-visible">
        <div className="flex items-center justify-between">
          <p className={`${tw.caption} ${tw.textSecondary}`}>
            Set maximum communications per period
          </p>
          <button
            type="button"
            onClick={() => {
              const newPeriod: MaxCommPeriod = {
                id: Date.now().toString(),
                type: getFirstAvailablePeriodType(),
                maxCount: 3,
              };
              setMaxCommPeriods((prev) => [...prev, newPeriod]);
            }}
            className={`${tw.button} flex items-center gap-2 text-xs px-3 py-1.5`}
            disabled={selectedPeriodTypes.length >= PERIOD_OPTIONS.length}
          >
            <Plus className="w-3 h-3" />
            Add Period
          </button>
        </div>

        {/* Column Headers - only show when there are periods */}
        {maxCommPeriods.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4">
            <label className="block text-sm font-medium text-gray-700">
              Period
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Count
            </label>
            <div className="w-8" /> {/* Spacer for delete button */}
          </div>
        )}

        <div className="space-y-2">
          {maxCommPeriods.map((period, index) => (
            <div
              key={period.id}
              className={`px-4 py-3 ${tw.rounded} bg-white transition-colors hover:bg-gray-50`}
            >
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                <div
                  className="relative overflow-visible"
                  style={{ zIndex: zIndex.popover - index }}
                >
                  <HeadlessSelect
                    value={period.type}
                    onChange={(value) => {
                      setMaxCommPeriods((prev) =>
                        prev.map((p) =>
                          p.id === period.id
                            ? {
                                ...p,
                                type: value as "daily" | "weekly" | "monthly",
                              }
                            : p
                        )
                      );
                    }}
                    options={PERIOD_OPTIONS.map((opt) => ({
                      label: opt.label,
                      value: opt.value,
                      // Disable if already selected in another row (but not current row)
                      disabled:
                        selectedPeriodTypes.includes(opt.value) &&
                        period.type !== opt.value,
                    }))}
                    placeholder="Select period"
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                </div>
                <div>
                  <input
                    type="number"
                    min="1"
                    value={period.maxCount}
                    onChange={(e) => {
                      setMaxCommPeriods((prev) =>
                        prev.map((p) =>
                          p.id === period.id
                            ? { ...p, maxCount: parseInt(e.target.value) || 1 }
                            : p
                        )
                      );
                    }}
                    className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMaxCommPeriods((prev) =>
                      prev.filter((p) => p.id !== period.id)
                    );
                  }}
                  className="p-2 rounded transition-colors"
                  style={{ color: "#dc2626" }}
                  title="Delete period"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {maxCommPeriods.length === 0 && (
            <p className={`${tw.caption} ${tw.textMuted} text-center py-6`}>
              No periods added yet. Click "Add Period" to get started.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderDNDConfig = () => {
    const dndConfig = configs.dnd;

    // Get already selected types to disable them in other rows
    const selectedTypes = dndConfig.categories.map((cat) => cat.type);

    // Find first available type for new categories
    const getFirstAvailableType = () => {
      const availableType = DND_CATEGORIES.find(
        (cat) => !selectedTypes.includes(cat.type)
      );
      return availableType?.type || "marketing";
    };

    return (
      <div className="space-y-4 overflow-visible">
        <div className="flex items-center justify-between">
          <p className={`${tw.caption} ${tw.textSecondary}`}>
            Manage customer preferences
          </p>
          <button
            type="button"
            onClick={() => {
              const newCategory: DNDCategory = {
                id: Date.now().toString(),
                name: "",
                type: getFirstAvailableType(),
                status: "stop",
                value: "allowed",
              };
              updateConfig("dnd", (prev) => ({
                ...prev,
                categories: [...prev.categories, newCategory],
              }));
            }}
            className={`${tw.button} flex items-center gap-2 text-xs px-3 py-1.5`}
            disabled={selectedTypes.length >= DND_CATEGORIES.length}
          >
            <Plus className="w-3 h-3" />
            Add Category
          </button>
        </div>

        {/* Column Headers - only show when there are categories */}
        {dndConfig.categories.length > 0 && (
          <div className="grid grid-cols-[1fr_1fr_auto] gap-4 px-4">
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Value
            </label>
            <div className="w-8" /> {/* Spacer for delete button */}
          </div>
        )}

        <div className="space-y-2">
          {dndConfig.categories.map((category, index) => (
            <div
              key={category.id}
              className={`px-4 py-3 ${tw.rounded} bg-white transition-colors hover:bg-gray-50`}
            >
              <div className="grid grid-cols-[1fr_1fr_auto] gap-4 items-center">
                <div
                  className="relative overflow-visible"
                  style={{ zIndex: zIndex.popover - index }}
                >
                  <HeadlessSelect
                    value={category.type}
                    onChange={(value) => {
                      const newCategories = [...dndConfig.categories];
                      newCategories[index] = {
                        ...category,
                        type: value as DNDCategory["type"],
                      };
                      updateConfig("dnd", (prev) => ({
                        ...prev,
                        categories: newCategories,
                      }));
                    }}
                    options={DND_CATEGORIES.map((cat) => ({
                      label: cat.label,
                      value: cat.type,
                      // Disable if already selected in another row (but not current row)
                      disabled:
                        selectedTypes.includes(cat.type) &&
                        category.type !== cat.type,
                    }))}
                    placeholder="Select type"
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                </div>
                <div
                  className="relative overflow-visible"
                  style={{ zIndex: zIndex.popover - index }}
                >
                  <HeadlessSelect
                    value={category.value || "allowed"}
                    onChange={(value) => {
                      const newCategories = [...dndConfig.categories];
                      newCategories[index] = {
                        ...category,
                        value: value as "allowed" | "not allowed",
                      };
                      updateConfig("dnd", (prev) => ({
                        ...prev,
                        categories: newCategories,
                      }));
                    }}
                    options={[
                      { label: "Allowed", value: "allowed" },
                      { label: "Not Allowed", value: "not allowed" },
                    ]}
                    placeholder="Select value"
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newCategories = dndConfig.categories.filter(
                      (_, i) => i !== index
                    );
                    updateConfig("dnd", (prev) => ({
                      ...prev,
                      categories: newCategories,
                    }));
                  }}
                  className="p-2 rounded transition-colors"
                  style={{ color: "#dc2626" }}
                  title="Delete category"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {dndConfig.categories.length === 0 && (
            <p className={`${tw.caption} ${tw.textMuted} text-center py-6`}>
              No categories added yet. Click "Add Category" to get started.
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderVIPListConfig = () => {
    const vipConfig = configs.vipList;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Action
            </label>
            <HeadlessSelect
              value={vipConfig.action}
              onChange={(value) =>
                updateConfig("vipList", (prev) => ({
                  ...prev,
                  action: value as "include" | "exclude",
                }))
              }
              options={[
                { label: "Include VIP List", value: "include" },
                { label: "Exclude VIP List", value: "exclude" },
              ]}
              placeholder="Select action"
              className="w-full"
              zIndex={zIndex.popover}
            />
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
                updateConfig("vipList", (prev) => ({
                  ...prev,
                  priority: parseInt(e.target.value) || 1,
                }))
              }
              className={`w-full px-3 py-3 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white`}
            />
          </div>
        </div>
        <div className={`p-3 ${tw.rounded} ${tw.statusInfo10}`}>
          <p className={`${tw.caption} ${tw.textSecondary}`}>
            VIP lists will be managed separately. This configuration defines how
            VIP customers are handled.
          </p>
        </div>
      </div>
    );
  };

  const renderPolicySection = (type: CommunicationPolicyType) => {
    const policyType = COMMUNICATION_POLICY_TYPES.find((t) => t.value === type);
    if (!policyType) return null;

    const isExpanded = expandedSection === type;

    return (
      <div
        key={type}
        className={`border ${
          tw.rounded
        } overflow-visible transition-all duration-200 ${
          isExpanded ? "border-2" : tw.borderDefault
        }`}
        style={{
          backgroundColor: isExpanded ? "white" : "white",
          borderColor: isExpanded ? color.primary.accent : undefined,
        }}
      >
        <button
          type="button"
          onClick={() => toggleSection(type)}
          className={`w-full px-5 py-4 flex items-center justify-between transition-all duration-200 ${
            isExpanded ? "bg-gray-50" : "bg-white hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 ${tw.rounded} transition-all duration-200`}
              style={{
                color: isExpanded ? color.primary.accent : "#6b7280",
              }}
            >
              {getTypeIcon(type)}
            </div>
            <div className="text-left">
              <h3
                className={`text-base transition-colors duration-200 ${
                  isExpanded
                    ? "font-semibold text-gray-900"
                    : "font-medium text-gray-700"
                }`}
              >
                {policyType.label}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {policyType.description}
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 transition-colors duration-200 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400 transition-colors duration-200" />
          )}
        </button>

        {isExpanded && (
          <div className="px-5 py-6 bg-white border-t border-gray-100 overflow-visible">
            {type === "timeWindow" && renderTimeWindowConfig()}
            {type === "maximumCommunication" && renderMaxCommunicationConfig()}
            {type === "dnd" && renderDNDConfig()}
            {type === "vipList" && renderVIPListConfig()}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ zIndex: zIndex.overlay }}
    >
      <div
        className={`${components.card.surface} w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${tw.rounded}`}
        style={{ zIndex: zIndex.modal, position: "relative" }}
      >
        {/* Header */}
        <div style={{ backgroundColor: color.surface.background }}>
          <div className="flex items-center justify-between pt-5 pb-3 px-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {policy
                  ? "Edit Communication Policy"
                  : "Create Communication Policy"}
              </h2>
              <p className={`${tw.caption} ${tw.textMuted} mt-1`}>
                Configure all policy types in one place
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 ${tw.hover} ${tw.rounded} transition-colors hover:bg-gray-100`}
              title="Close"
            >
              <X className={`w-5 h-5 ${tw.textMuted}`} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto"
          style={{
            backgroundColor: color.surface.background,
            overflowX: "visible",
          }}
        >
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="px-4 pt-3 pb-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Policy Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2.5 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white`}
                  placeholder="Enter policy name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full px-4 py-2.5 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm resize-none transition-all bg-white`}
                  placeholder="Enter policy description"
                  rows={3}
                />
              </div>

              {/* Communication Channels (Multi-select Dropdown) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Channels <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setIsChannelDropdownOpen(!isChannelDropdownOpen)
                    }
                    className={`w-full px-4 py-2.5 border border-gray-300 ${tw.rounded} text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all bg-white`}
                  >
                    <div className="flex items-center space-x-2">
                      {channels.length === 0 ? (
                        <span className={tw.textMuted}>Select channels...</span>
                      ) : (
                        <div className="flex items-center">
                          <span className={`${tw.caption} ${tw.textPrimary}`}>
                            {channels.length === 1
                              ? COMMUNICATION_CHANNELS.find(
                                  (ch) => ch.value === channels[0]
                                )?.label
                              : channels
                                  .map(
                                    (c) =>
                                      COMMUNICATION_CHANNELS.find(
                                        (ch) => ch.value === c
                                      )?.label
                                  )
                                  .join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 ${
                        tw.textMuted
                      } transition-transform ${
                        isChannelDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isChannelDropdownOpen && (
                    <div
                      className={`absolute z-[10000] w-full mt-1 bg-white border border-gray-200 ${tw.rounded} max-h-64 overflow-y-auto`}
                    >
                      {COMMUNICATION_CHANNELS.map((ch) => (
                        <label
                          key={ch.value}
                          className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={channels.includes(ch.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setChannels((prev) => [...prev, ch.value]);
                              } else {
                                setChannels((prev) =>
                                  prev.filter((c) => c !== ch.value)
                                );
                              }
                            }}
                            className="mt-1 rounded"
                            style={{ accentColor: color.primary.accent }}
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {ch.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {ch.description}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Select one or more communication channels for this policy
                </p>
              </div>
            </div>

            {/* All Policy Type Configurations */}
            <div className="px-4 space-y-4 pb-2">
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Policy Configurations
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Configure different policy types. Expand a section to
                    configure it.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedSection("timeWindow")}
                    className="text-xs text-gray-600 hover:text-gray-900 hover:underline transition-colors"
                  >
                    Open First
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => setExpandedSection(null)}
                    className="text-xs text-gray-600 hover:text-gray-900 hover:underline transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
              {renderPolicySection("timeWindow")}
              {renderPolicySection("maximumCommunication")}
              {renderPolicySection("dnd")}
              {renderPolicySection("vipList")}
            </div>

            {/* Active Status */}
            <div className="px-4 pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded w-5 h-5"
                  style={{ accentColor: color.primary.action }}
                />
                <div>
                  <span className={`${tw.body} font-medium ${tw.textPrimary}`}>
                    Active Policy
                  </span>
                  <p className={`${tw.caption} ${tw.textMuted}`}>
                    Enable this policy to apply it to campaigns immediately
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div
                className={`px-4 p-4 ${tw.statusDanger10} ${tw.borderDefault} border ${tw.rounded}`}
              >
                <p className={`${tw.caption} ${tw.danger}`}>{error}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-end gap-3 px-4 py-4"
            style={{ backgroundColor: color.surface.background }}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
              style={{ backgroundColor: color.primary.action }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  (e.target as HTMLButtonElement).style.opacity = "0.9";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  (e.target as HTMLButtonElement).style.opacity = "1";
                }
              }}
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
