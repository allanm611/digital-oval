import Input from '../../../shared/components/ui/Input';
import Textarea from '../../../shared/components/ui/Textarea';
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
  COMMUNICATION_POLICY_TYPES,
  DNDCategory,
  DAYS_OF_WEEK,
  type CommunicationPolicyType,
} from "../types/communicationPolicyConfig";
import {
  buildFrequencyCappingConfig,
  buildMultiPolicyConfig,
  buildVipListConfig,
  hydrateFrequencyPeriods,
  hydrateVipRules,
  isPolicyActive,
  listConfiguredEditors,
  parsePolicyChannels,
  readDndConfig,
  readEditorSlice,
  readTimeWindowConfig,
  resolvePolicyEditor,
  type FrequencyPeriodDraft,
  type VipRuleDraft,
} from "../utils/communicationPolicyConfigMapper";
import Checkbox from "../../../shared/components/ui/Checkbox";
import MultiCategorySelector from "../../../shared/components/MultiCategorySelector";
import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { useBackendConfigurationData } from "../../../shared/hooks/useBackendConfigurationData";

interface CommunicationPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy?: CommunicationPolicyConfiguration;
  onSave: (policy: CreateCommunicationPolicyRequest) => Promise<void>;
  isSaving?: boolean;
}

interface AllPolicyConfigs {
  timeWindow: ReturnType<typeof readTimeWindowConfig>;
  dnd: ReturnType<typeof readDndConfig>;
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
  const { data: policyTypesData = [] } =
    useBackendConfigurationData("policyTypes") || { data: [] };
  const { data: dndTypesData = [] } =
    useBackendConfigurationData("dndTypes") || { data: [] };
  const { data: vipListsData = [] } =
    useBackendConfigurationData("vipLists") || { data: [] };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedChannelIds, setSelectedChannelIds] = useState<(number | string)[]>([]);
  const [isActive, setIsActive] = useState(true);

  const [configs, setConfigs] = useState<AllPolicyConfigs>({
    timeWindow: readTimeWindowConfig(null),
    dnd: { categories: [] },
  });

  const [selectedEditors, setSelectedEditors] = useState<CommunicationPolicyType[]>([]);
  const [expandedSections, setExpandedSections] = useState<CommunicationPolicyType[]>([]);

  // Frequency capping periods. This is the value that gets saved.
  const [maxCommPeriods, setMaxCommPeriods] = useState<FrequencyPeriodDraft[]>([]);

  // VIP list rules. This is the value that gets saved.
  const [vipListRows, setVipListRows] = useState<VipRuleDraft[]>([]);

  const [errors, setErrors] = useState<{
    name?: string;
    channels?: string;
    policyType?: string;
    config?: string;
    sections?: Partial<Record<CommunicationPolicyType, string>>;
  }>({});

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const initializeForm = async () => {
      if (policy) {
        const selected = listConfiguredEditors(policy);
        setName(policy.name);
        setDescription(policy.description || "");
        setIsActive(isPolicyActive(policy));
        setSelectedEditors(selected);
        setExpandedSections(selected);
        setConfigs({
          timeWindow: readTimeWindowConfig(readEditorSlice(policy, "timeWindow")),
          dnd: readDndConfig(readEditorSlice(policy, "dnd")),
        });
        setMaxCommPeriods(
          hydrateFrequencyPeriods(readEditorSlice(policy, "maximumCommunication")),
        );
        setVipListRows(hydrateVipRules(readEditorSlice(policy, "vipList")));

        const savedChannels = parsePolicyChannels(policy.channels);
        if (savedChannels.length > 0) {
          try {
            const allChannels = await communicationChannelService.getAll();
            if (cancelled) return;
            const channelIds = savedChannels
              .map((code) => allChannels.find((channel) => channel.code === code)?.id)
              .filter((id): id is number => id !== undefined && id !== null);
            setSelectedChannelIds(channelIds);
          } catch (err) {
            if (cancelled) return;
            console.error("Failed to load channels:", err);
            setSelectedChannelIds([]);
          }
        } else {
          setSelectedChannelIds([]);
        }
      } else {
        setName("");
        setDescription("");
        setSelectedChannelIds([]);
        setIsActive(true);
        setSelectedEditors([]);
        setExpandedSections([]);
        setConfigs({
          timeWindow: readTimeWindowConfig(null),
          dnd: { categories: [] },
        });
        setMaxCommPeriods([]);
        setVipListRows([]);
      }
      if (!cancelled) setErrors({});
    };

    initializeForm();
    return () => {
      cancelled = true;
    };
  }, [policy, isOpen]);

  const toggleExpanded = (editor: CommunicationPolicyType) => {
    setExpandedSections((current) => {
      const isOpen = current.includes(editor);
      if (isOpen) return current.filter((item) => item !== editor);
      return [...current, editor];
    });
    setSelectedEditors((current) =>
      current.includes(editor) ? current : [...current, editor],
    );
  };

  const toggleSelected = (editor: CommunicationPolicyType) => {
    const willSelect = !selectedEditors.includes(editor);
    setSelectedEditors((current) =>
      willSelect ? [...current, editor] : current.filter((item) => item !== editor),
    );
    setExpandedSections((current) => {
      if (willSelect) {
        return current.includes(editor) ? current : [...current, editor];
      }
      return current.filter((item) => item !== editor);
    });
  };

  const updateConfig = <T extends keyof AllPolicyConfigs>(
    type: T,
    updater: (prev: AllPolicyConfigs[T]) => AllPolicyConfigs[T]
  ) => {
    setConfigs((prev) => ({
      ...prev,
      [type]: updater(prev[type]),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Policy name is required";
    }

    if (selectedChannelIds.length === 0) {
      newErrors.channels = "At least one communication channel is required";
    }

    const sectionErrors: Partial<Record<CommunicationPolicyType, string>> = {};
    if (selectedEditors.length === 0) {
      newErrors.policyType = "Select at least one policy configuration.";
    }

    if (selectedEditors.includes("maximumCommunication")) {
      if (maxCommPeriods.length === 0) {
        sectionErrors.maximumCommunication = "Add at least one frequency period before saving.";
      } else if (maxCommPeriods.some((period) => period.maxCount < 1)) {
        sectionErrors.maximumCommunication = "Each frequency period needs a maximum count of at least 1.";
      } else if (
        new Set(maxCommPeriods.map((period) => period.type)).size !==
        maxCommPeriods.length
      ) {
        sectionErrors.maximumCommunication = "Each period type can only be used once.";
      }
    }

    if (selectedEditors.includes("vipList")) {
      if (vipListRows.length === 0) {
        sectionErrors.vipList = "Add at least one VIP list rule before saving.";
      } else if (vipListRows.some((row) => !row.vipListId)) {
        sectionErrors.vipList = "Select a VIP list for every rule.";
      } else if (vipListRows.some((row) => row.priority < 1)) {
        sectionErrors.vipList = "Each VIP rule needs a priority of at least 1.";
      }
    }

    if (selectedEditors.includes("dnd")) {
      if (configs.dnd.categories.length === 0) {
        sectionErrors.dnd = "Add at least one Do Not Disturb category.";
      } else if (configs.dnd.categories.some((category) => !category.type)) {
        sectionErrors.dnd = "Select a type for every Do Not Disturb category.";
      }
    }

    if (selectedEditors.includes("timeWindow")) {
      if (!configs.timeWindow.startTime || !configs.timeWindow.endTime) {
        sectionErrors.timeWindow = "Start time and end time are required.";
      }
    }

    if (Object.keys(sectionErrors).length > 0) {
      newErrors.sections = sectionErrors;
      newErrors.config = "Complete every selected configuration before saving.";
      setExpandedSections((current) => [
        ...new Set([...current, ...(Object.keys(sectionErrors) as CommunicationPolicyType[])]),
      ]);
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      const allChannels = await communicationChannelService.getAll();
      const channelCodes = selectedChannelIds.map((id) => {
        const channel = allChannels.find((ch) => ch.id === Number(id));
        return channel?.code as string;
      }).filter(Boolean);

      const saved = buildMultiPolicyConfig({
        timeWindow: selectedEditors.includes("timeWindow") ? configs.timeWindow : null,
        maximumCommunication: selectedEditors.includes("maximumCommunication")
          ? buildFrequencyCappingConfig(maxCommPeriods)
          : null,
        dnd: selectedEditors.includes("dnd") ? configs.dnd : null,
        vipList: selectedEditors.includes("vipList")
          ? buildVipListConfig(vipListRows, vipListsData)
          : null,
      });

      const policyData: CreateCommunicationPolicyRequest = {
        name,
        description,
        channels: channelCodes,
        type_code: saved.type_code,
        type_codes: saved.type_codes,
        config: saved.config,
        is_active: isActive,
      };

      await onSave(policyData);
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Failed to process communication channels";
      setErrors({
        config: message.includes("frequency") || message.includes("VIP")
          ? message
          : undefined,
        channels:
          message.includes("frequency") || message.includes("VIP")
            ? undefined
            : message,
      });
      console.error("Error in handleSubmit:", err);
    }
  };

  const getTypeIcon = (code: string) => {
    switch (resolvePolicyEditor(code)) {
      case "timeWindow": return <Clock className="w-5 h-5" />;
      case "maximumCommunication": return <BarChart3 className="w-5 h-5" />;
      case "dnd": return <BellOff className="w-5 h-5" />;
      case "vipList": return <Star className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const renderTimeWindowConfig = () => {
    const timeConfig = configs.timeWindow;
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Input
              label="Start Time"
              type="time"
              placeholder=""
              value={timeConfig.startTime}
              onChange={(value) =>
                updateConfig("timeWindow", (prev) => ({
                  ...prev,
                  startTime: String(value),
                }))
              }
            />
          </div>
          <div>
            <Input
              label="End Time"
              type="time"
              placeholder=""
              value={timeConfig.endTime}
              onChange={(value) =>
                updateConfig("timeWindow", (prev) => ({
                  ...prev,
                  endTime: String(value),
                }))
              }
            />
          </div>
        </div>
        <div>
          <div className="grid grid-cols-4 gap-2" data-label="Days of Week">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day.value}
                className="flex items-center space-x-2 cursor-pointer"
                onClick={() => {
                  const days = timeConfig.days || [];
                  const newDays = timeConfig.days?.includes(day.value)
                    ? days.filter((d) => d !== day.value)
                    : [...days, day.value];
                  updateConfig("timeWindow", (prev) => ({
                    ...prev,
                    days: newDays,
                  }));
                }}
              >
                <Checkbox
                  id={`day-${day.value}`}
                  checked={timeConfig.days?.includes(day.value) || false}
                  onChange={() => {
                    const days = timeConfig.days || [];
                    const newDays = timeConfig.days?.includes(day.value)
                      ? days.filter((d) => d !== day.value)
                      : [...days, day.value];
                    updateConfig("timeWindow", (prev) => ({
                      ...prev,
                      days: newDays,
                    }));
                  }}
                />
                <span className={`${tw.caption} ${tw.textSecondary}`}>
                  {day.label}
                </span>
              </div>
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
              const newPeriod: FrequencyPeriodDraft = {
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
                    label="Period"
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
                  <Input
                    label="Maximum Count"
                    type="number"
                    placeholder="0"
                    min="1"
                    value={period.maxCount}
                    onChange={(value) => {
                      setMaxCommPeriods((prev) =>
                        prev.map((p) =>
                          p.id === period.id
                            ? { ...p, maxCount: parseInt(String(value)) || 1 }
                            : p
                        )
                      );
                    }}
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
      const available = dndTypesData.find((dt: any) => !selectedTypes.includes(String(dt.id)));
      return available ? String((available as any).id) : "";
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
            disabled={selectedTypes.length >= dndTypesData.length}
          >
            <Plus className="w-3 h-3" />
            Add Category
          </button>
        </div>


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
                    label="Type"
                    value={category.type}
                    onChange={(value) => {
                      const newCategories = [...dndConfig.categories];
                      newCategories[index] = {
                        ...category,
                        type: String(value),
                      };
                      updateConfig("dnd", (prev) => ({
                        ...prev,
                        categories: newCategories,
                      }));
                    }}
                    options={dndTypesData.map((dt: any) => ({
                      label: dt.name,
                      value: String(dt.id),
                      disabled:
                        selectedTypes.includes(String(dt.id)) &&
                        category.type !== String(dt.id),
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
                    label="Value"
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
    const selectedListIds = vipListRows.map((row) => row.vipListId);

    return (
      <div className="space-y-4 overflow-visible">
        <div className="flex items-center justify-between">
          <p className={`${tw.caption} ${tw.textSecondary}`}>
            Manage VIP list handling with custom actions and priorities
          </p>
          <button
            type="button"
            onClick={() => {
              const newRow: VipRuleDraft = {
                id: Date.now().toString(),
                vipListId: "",
                action: "include",
                priority: 1,
              };
              setVipListRows((prev) => [...prev, newRow]);
            }}
            className={`${tw.button} flex items-center gap-2 text-xs px-3 py-1.5`}
            disabled={vipListsData.length === 0 || selectedListIds.length >= vipListsData.length}
          >
            <Plus className="w-3 h-3" />
            Add VIP List
          </button>
        </div>


        <div className="space-y-2">
          {vipListRows.map((row, index) => (
            <div
              key={row.id}
              className={`px-4 py-3 ${tw.rounded} bg-white transition-colors hover:bg-gray-50`}
            >
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                {/* VIP List Dropdown */}
                <div
                  className="relative overflow-visible"
                  style={{ zIndex: zIndex.popover - index }}
                >
                  <HeadlessSelect
                    label="VIP List"
                    value={row.vipListId}
                    onChange={(value) => {
                      setVipListRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id ? { ...r, vipListId: String(value) } : r
                        )
                      );
                    }}
                    options={vipListsData.map((list: any) => ({
                      label: list.name,
                      value: String(list.id),
                      disabled:
                        selectedListIds.includes(String(list.id)) &&
                        row.vipListId !== String(list.id),
                    }))}
                    placeholder="Select VIP list"
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                </div>

                {/* Action Dropdown */}
                <div
                  className="relative overflow-visible"
                  style={{ zIndex: zIndex.popover - index }}
                >
                  <HeadlessSelect
                    label="Action"
                    value={row.action}
                    onChange={(value) => {
                      setVipListRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? { ...r, action: value as "include" | "exclude" }
                            : r
                        )
                      );
                    }}
                    options={[
                      { label: "Include", value: "include" },
                      { label: "Exclude", value: "exclude" },
                    ]}
                    placeholder="Select action"
                    className="w-full"
                    zIndex={zIndex.popover}
                  />
                </div>

                {/* Priority Input */}
                <div>
                  <Input
                    label="Priority"
                    type="number"
                    placeholder="1"
                    min="1"
                    value={row.priority}
                    onChange={(value) => {
                      setVipListRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? { ...r, priority: parseInt(String(value)) || 1 }
                            : r
                        )
                      );
                    }}
                  />
                </div>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => {
                    setVipListRows((prev) =>
                      prev.filter((r) => r.id !== row.id)
                    );
                  }}
                  className="p-2 rounded transition-colors"
                  style={{ color: "#dc2626" }}
                  title="Delete VIP list"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {vipListRows.length === 0 && (
            <p className={`${tw.caption} ${tw.textMuted} text-center py-6`}>
              {vipListsData.length === 0
                ? "No VIP lists available. Create VIP lists in configurations first."
                : 'No VIP list configurations yet. Click "Add VIP List" to get started.'}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderPolicySection = (policyType: { code: string; name: string; description?: string }) => {
    const { code, name: typeName, description: typeDesc } = policyType;
    const editor = resolvePolicyEditor(code);
    if (!editor) return null;
    const isExpanded = expandedSections.includes(editor);
    const isSelected = selectedEditors.includes(editor);
    const sectionError = errors.sections?.[editor];

    return (
      <div
        key={editor}
        className={`border ${
          tw.rounded
        } overflow-visible transition-all duration-200 ${
          isSelected ? "border-2" : tw.borderDefault
        }`}
        style={{
          borderColor: isSelected ? color.primary.accent : undefined,
        }}
      >
        <div
          className={`w-full px-5 py-4 flex items-center justify-between gap-3 transition-all duration-200 ${
            isExpanded || isSelected ? "bg-gray-50" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Checkbox
              checked={isSelected}
              onChange={() => toggleSelected(editor)}
              aria-label={`Include ${typeName}`}
            />
            <button
              type="button"
              onClick={() => toggleExpanded(editor)}
              className="flex items-center gap-3 min-w-0 flex-1 text-left"
            >
              <div
                className={`p-2.5 ${tw.rounded} transition-all duration-200`}
                style={{ color: isSelected ? color.primary.accent : "#6b7280" }}
              >
                {getTypeIcon(code)}
              </div>
              <div className="text-left min-w-0">
                <h3
                  className={`text-sm transition-colors duration-200 ${
                    isSelected ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                  }`}
                >
                  {typeName}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">{typeDesc}</p>
              </div>
            </button>
          </div>
          <button
            type="button"
            onClick={() => toggleExpanded(editor)}
            className="p-1 rounded hover:bg-gray-100"
            aria-label={isExpanded ? `Collapse ${typeName}` : `Expand ${typeName}`}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 transition-colors duration-200 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 transition-colors duration-200" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="px-5 py-6 bg-white border-t border-gray-100 overflow-visible">
            {editor === "timeWindow" && renderTimeWindowConfig()}
            {editor === "maximumCommunication" && renderMaxCommunicationConfig()}
            {editor === "dnd" && renderDNDConfig()}
            {editor === "vipList" && renderVIPListConfig()}
            {sectionError && (
              <p className="text-xs text-red-600 mt-3">{sectionError}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ zIndex: zIndex.popover }}
    >
      <div
        className={`${components.card.surface} w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col ${tw.rounded}`}
        style={{ zIndex: zIndex.popover, position: "relative" }}
      >
        {/* Header */}
        <div style={{ backgroundColor: color.surface.background }}>
          <div className="flex items-center justify-between pt-5 pb-3 px-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
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
                <Input
                  label="Policy Name *"
                  type="text"
                  value={name}
                  onChange={(value) => setName(String(value))}
                  placeholder="Enter policy name"
                  required
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>
                )}
              </div>

              <div>
                <Textarea
                  label="Description"
                  value={description}
                  onChange={(value) => setDescription(value)}
                  placeholder="Enter policy description"
                  rows={3}
                />
              </div>

              {/* Communication Channels */}
              <div>
                <MultiCategorySelector
                  label="Communication Channels *"
                  value={selectedChannelIds}
                  onChange={setSelectedChannelIds}
                  placeholder="Select channels..."
                  entityType="channel"
                  className="w-full"
                />
                {errors.channels ? (
                  <p className="text-xs text-red-600 mt-1.5">{errors.channels}</p>
                ) : (
                  <p className="text-xs text-gray-500 mt-2">
                    Select one or more communication channels for this policy
                  </p>
                )}
              </div>
            </div>

            {/* All Policy Type Configurations */}
            <div className="px-4 space-y-4 pb-2">
              <div className="flex items-center justify-between pb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Policy Configurations
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Select one or more configurations. Checked sections are saved together on this policy.
                  </p>
                  {selectedEditors.length > 0 && (
                    <p className="text-xs text-gray-700 mt-1">
                      {selectedEditors.length} selected
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedSections([])}
                  className="text-xs text-gray-600 hover:text-gray-900 hover:underline transition-colors"
                >
                  Collapse All
                </button>
              </div>
              {(() => {
                const source = policyTypesData.length > 0
                  ? policyTypesData.map((pt: { code?: string; name?: string; description?: string }) => ({
                      code: String(pt.code ?? ""),
                      name: String(pt.name ?? pt.code ?? ""),
                      description: pt.description,
                    }))
                  : COMMUNICATION_POLICY_TYPES.map((item) => ({
                      code: item.value,
                      name: item.label,
                      description: item.description,
                    }));
                const seen = new Set<CommunicationPolicyType>();
                return source
                  .filter((item) => {
                    const editor = resolvePolicyEditor(item.code);
                    if (!editor || seen.has(editor)) return false;
                    seen.add(editor);
                    return true;
                  })
                  .map((item) => renderPolicySection(item));
              })()}
              {errors.policyType && (
                <p className="text-xs text-red-600 mt-2">{errors.policyType}</p>
              )}
              {errors.config && (
                <p className="text-xs text-red-600 mt-2">{errors.config}</p>
              )}
            </div>

            {/* Active Status */}
            <div className="px-4 pt-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <Checkbox
                  checked={isActive}
                  onChange={() => setIsActive((current) => !current)}
                  className="rounded w-5 h-5"
                  style={{ accentColor: color.primary.action }}
                />
                <div>
                  <span className={`text-sm font-medium ${tw.textPrimary}`}>
                    Active Policy
                  </span>
                  <p className={`${tw.caption} ${tw.textMuted}`}>
                    Enable this policy to apply it to campaigns immediately
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            className="flex items-center justify-end gap-3 px-4 py-4"
            style={{ backgroundColor: color.surface.background }}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 text-sm font-medium ${tw.rounded} transition-colors`}
              style={{
                background: "transparent",
                color: "var(--c-bordered-button-color)",
                border: `1px solid var(--c-bordered-button-color)`,
              }}
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
                ? policy
                  ? "Updating..."
                  : "Creating..."
                : policy
                ? "Update"
                : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
