import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, BarChart3, Settings, Edit, X } from "lucide-react";
import { color , tw} from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface TrackingRule {
  id: string;
  name: string;
  priority: number;
  parameter: string;
  condition: "equals" | "greater_than" | "less_than" | "contains" | "is_any_of";
  value: string;
  enabled: boolean;
}

interface TrackingSource {
  id: string;
  name: string;
  type: "recharge" | "usage_metric" | "custom";
  enabled: boolean;
  rules: TrackingRule[];
}

interface OfferTrackingStepProps {
  trackingSources: TrackingSource[];
  onTrackingSourcesChange: (sources: TrackingSource[]) => void;
}

const TRACKING_TYPES = [
  {
    value: "recharge",
    label: "Recharge TrackSource",
    description: "Track recharge-based activities",
  },
  {
    value: "usage_metric",
    label: "Usage Metric",
    description: "Track usage-based metrics",
  },
  {
    value: "custom",
    label: "Custom Tracking",
    description: "Custom tracking parameters",
  },
];

const PARAMETERS = [
  "Amount",
  "Channel",
  "Customer_Segment",
  "Product_Type",
  "Transaction_Type",
  "Location",
  "Time_Period",
  "Usage_Volume",
  "Frequency",
];

const CONDITIONS = [
  { value: "equals", label: "Equals" },
  { value: "greater_than", label: "Greater than" },
  { value: "less_than", label: "Less than" },
  { value: "contains", label: "Contains" },
  { value: "is_any_of", label: "Is any of" },
];

// Pre-created Tracking Sources from Configuration
const PRE_CREATED_TRACKING_SOURCES = [
  {
    id: "pre_1",
    name: "Recharge Tracking",
    type: "recharge",
    rules: [
      {
        id: "rule_1",
        name: "Amount > 1000",
        priority: 1,
        parameter: "Amount",
        condition: "greater_than",
        value: "1000",
        enabled: true,
      },
    ],
  },
  {
    id: "pre_2",
    name: "Usage Metric Tracking",
    type: "usage_metric",
    rules: [
      {
        id: "rule_2",
        name: "Data > 500MB",
        priority: 1,
        parameter: "Usage_Volume",
        condition: "greater_than",
        value: "500",
        enabled: true,
      },
      {
        id: "rule_3",
        name: "Within 7 days",
        priority: 2,
        parameter: "Time_Period",
        condition: "less_than",
        value: "7",
        enabled: true,
      },
    ],
  },
  {
    id: "pre_3",
    name: "Engagement Tracking",
    type: "engagement",
    rules: [
      {
        id: "rule_4",
        name: "Click Rate",
        priority: 1,
        parameter: "Frequency",
        condition: "greater_than",
        value: "0",
        enabled: true,
      },
    ],
  },
];

export default function OfferTrackingStep({
  trackingSources = [],
  onTrackingSourcesChange,
}: OfferTrackingStepProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(
    trackingSources && trackingSources.length > 0 ? trackingSources[0].id : null
  );
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<TrackingRule | null>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addTrackingSource = (preCreatedId: string) => {
    const preCreated = PRE_CREATED_TRACKING_SOURCES.find(
      (s) => s.id === preCreatedId
    );
    if (!preCreated) return;

    // Create a copy with new ID
    const newSource: TrackingSource = {
      id: generateId(),
      name: preCreated.name,
      type: preCreated.type,
      enabled: true,
      rules: preCreated.rules.map((rule) => ({
        ...rule,
        id: generateId(),
      })),
    };

    const updatedSources = [...trackingSources, newSource];
    onTrackingSourcesChange(updatedSources);
    setSelectedSource(newSource.id);
  };

  const removeTrackingSource = (id: string) => {
    const updatedSources = trackingSources.filter((s) => s.id !== id);
    onTrackingSourcesChange(updatedSources);

    if (selectedSource === id) {
      setSelectedSource(
        updatedSources.length > 0 ? updatedSources[0].id : null
      );
    }
  };

  const updateTrackingSource = (
    id: string,
    updates: Partial<TrackingSource>
  ) => {
    const updatedSources = trackingSources.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    onTrackingSourcesChange(updatedSources);
  };

  const addRule = () => {
    const newRule: TrackingRule = {
      id: generateId(),
      name: "New Rule",
      priority: 1,
      parameter: "Amount",
      condition: "equals",
      value: "",
      enabled: true,
    };

    setEditingRule(newRule);
    setShowRuleModal(true);
  };

  const saveRule = (sourceId: string, rule: TrackingRule) => {
    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) return;

    const existingRuleIndex = source.rules.findIndex((r) => r.id === rule.id);
    let updatedRules;

    if (existingRuleIndex >= 0) {
      updatedRules = [...source.rules];
      updatedRules[existingRuleIndex] = rule;
    } else {
      updatedRules = [...source.rules, rule];
    }

    updateTrackingSource(sourceId, { rules: updatedRules });
    setShowRuleModal(false);
    setEditingRule(null);
  };

  const removeRule = (sourceId: string, ruleId: string) => {
    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) return;

    const updatedRules = source.rules.filter((r) => r.id !== ruleId);
    updateTrackingSource(sourceId, { rules: updatedRules });
  };

  const selectedSourceData = trackingSources.find(
    (s) => s.id === selectedSource
  );

  // Ensure selectedSourceData exists before rendering - reset if it doesn't match
  if (selectedSource && !selectedSourceData && trackingSources.length > 0) {
    setSelectedSource(trackingSources[0].id);
  }

  return (
    <div className="space-y-6">
      {trackingSources.length === 0 ? (
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-8 text-center`}>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Tracking Sources Added
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Set up how you'll track customer engagement and measure offer
            performance
          </p>
          <div className="max-w-sm">
            <HeadlessSelect
              options={[
                { value: "", label: "Select a tracking source..." },
                ...PRE_CREATED_TRACKING_SOURCES.map((source) => ({
                  value: source.id,
                  label: source.name,
                })),
              ]}
              value=""
              onChange={(value) => {
                if (value) {
                  addTrackingSource(value);
                }
              }}
              placeholder="Select a tracking source..."
              className="w-full"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tracking Sources List */}
          <div className="lg:col-span-1">
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-4`}>
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Source Name
                </h3>
                <HeadlessSelect
                  options={[
                    { value: "", label: "Select a tracking source..." },
                    ...PRE_CREATED_TRACKING_SOURCES.map((source) => ({
                      value: source.id,
                      label: source.name,
                    })),
                  ]}
                  value=""
                  onChange={(value) => {
                    if (value) {
                      addTrackingSource(value);
                    }
                  }}
                  placeholder="Select a tracking source..."
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                {trackingSources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => setSelectedSource(source.id)}
                    className={`p-3 ${tw.rounded} border cursor-pointer transition-all ${
                      selectedSource === source.id
                        ? "border-gray-300 bg-gray-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 ${tw.rounded} flex items-center justify-center ${
                            source.enabled ? "bg-gray-100" : "bg-gray-100"
                          }`}
                        >
                          <BarChart3
                            className={`w-4 h-4 ${
                              source.enabled ? "text-gray-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {source.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {
                              TRACKING_TYPES.find(
                                (t) => t.value === source.type
                              )?.label
                            }
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrackingSource(source.id);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {source.rules.length} rule
                      {source.rules.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tracking Configuration */}
          <div className="lg:col-span-2">
            {selectedSourceData ? (
              <div className={`bg-white ${tw.rounded} border border-gray-200 p-6 w-full`}>
                <div className="space-y-6">
                  {/* Source Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source Name
                      </label>
                      <input
                        type="text"
                        value={selectedSourceData.name}
                        onChange={(e) =>
                          updateTrackingSource(selectedSourceData.id, {
                            name: e.target.value,
                          })
                        }
                        className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <HeadlessSelect
                        options={TRACKING_TYPES.map((type) => ({
                          value: type.value,
                          label: type.label,
                        }))}
                        value={selectedSourceData.type}
                        onChange={(value) =>
                          updateTrackingSource(selectedSourceData.id, {
                            type: value as
                              | "recharge"
                              | "usage_metric"
                              | "custom",
                          })
                        }
                        placeholder="Select tracking type"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`enabled-${selectedSourceData.id}`}
                      checked={selectedSourceData.enabled}
                      onChange={(e) =>
                        updateTrackingSource(selectedSourceData.id, {
                          enabled: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:outline-none"
                    />
                    <label
                      htmlFor={`enabled-${selectedSourceData.id}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      Set as default tracking source
                    </label>
                  </div>

                  {/* Rules Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Tracking Rules
                      </h4>
                      <button
                        onClick={() => addRule()}
                        className={`inline-flex items-center px-3 py-1 text-sm text-white ${tw.rounded} transition-colors`}
                        style={{ backgroundColor: color.primary.action }}
                        onMouseEnter={(e) => {
                          (
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = color.primary.hover;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.target as HTMLButtonElement
                          ).style.backgroundColor = color.primary.action;
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Rule
                      </button>
                    </div>

                    {selectedSourceData.rules.length === 0 ? (
                      <div className={`text-center py-8 border-2 border-dashed border-gray-200 ${tw.rounded}`}>
                        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">
                          No rules configured
                        </p>
                        <button
                          onClick={() => addRule()}
                          className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded}`}
                          style={{ backgroundColor: color.primary.action }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Rule
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedSourceData.rules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`p-4 border border-gray-200 ${tw.rounded}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-sm text-gray-900">
                                  {rule.name}
                                </span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  Priority: {rule.priority}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs rounded ${
                                    rule.enabled
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {rule.enabled ? "Enabled" : "Disabled"}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingRule(rule);
                                    setShowRuleModal(true);
                                  }}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    removeRule(selectedSourceData.id, rule.id)
                                  }
                                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              {rule.parameter}{" "}
                              {CONDITIONS.find(
                                (c) => c.value === rule.condition
                              )?.label.toLowerCase()}{" "}
                              "{rule.value}"
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`bg-gray-50 ${tw.rounded} border border-gray-200 p-8 text-center`}>
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Source Selected
                </h3>
                <p className="text-gray-500 text-sm">
                  Select a tracking source from the list above to start
                  configuring.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rule Modal */}
      {showRuleModal &&
        editingRule &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: zIndex.modal - 1 }}
          >
            <div className={`bg-white ${tw.rounded} p-6 w-full max-w-md mx-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRule.id ? "Edit Rule" : "Add Rule"}
                </h3>
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, name: e.target.value })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editingRule.priority}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        priority: parseInt(e.target.value) || 1,
                      })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parameter
                  </label>
                  <HeadlessSelect
                    options={PARAMETERS.map((param) => ({
                      value: param,
                      label: param,
                    }))}
                    value={editingRule.parameter}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        parameter: value as string,
                      })
                    }
                    placeholder="Select parameter"
                    zIndex={zIndex.popover}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Condition
                  </label>
                  <HeadlessSelect
                    options={CONDITIONS.map((condition) => ({
                      value: condition.value,
                      label: condition.label,
                    }))}
                    value={editingRule.condition}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        condition: value as
                          | "equals"
                          | "greater_than"
                          | "less_than"
                          | "contains"
                          | "is_any_of",
                      })
                    }
                    placeholder="Select condition"
                    zIndex={zIndex.popover}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={editingRule.value}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, value: e.target.value })
                    }
                    placeholder="Enter value..."
                    className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} focus:outline-none`}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rule-enabled"
                    checked={editingRule.enabled}
                    onChange={(e) =>
                      setEditingRule({
                        ...editingRule,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-gray-600 border-gray-300 rounded focus:outline-none"
                  />
                  <label
                    htmlFor="rule-enabled"
                    className="ml-2 text-sm text-gray-700"
                  >
                    Enable this rule
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                  }}
                  className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded}`}
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    selectedSourceData &&
                    saveRule(selectedSourceData.id, editingRule)
                  }
                  className={`px-4 py-2 text-white ${tw.rounded}`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Save Rule
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
