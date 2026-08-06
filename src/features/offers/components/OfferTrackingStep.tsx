import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, BarChart3, Settings, Edit, X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import {
  conditions as CONDITION_OPTIONS,
  formatTrackingKeyLabel,
  formatTrackingRuleValueDisplay,
  getConditionsForParameter,
  getDefaultConditionForParameter,
  getParameterOptionsByType,
  getParameterValueType,
  getParametersByType,
  normalizeParameterKey,
  PARAMETER_LABELS,
  serializeTrackingRuleValue,
  toTrackingValueInputDisplay,
  TRACKING_TYPE_OPTIONS,
  validateTrackingRuleValue,
  type TrackingParameterValueType,
} from "../utils/trackingSourcesConfig";
import { trackingSourceService } from "../../configurations/services/trackingSourceService";
import type { TrackingSourceCatalogItem } from "../../configurations/types/trackingSource";
import type {
  OfferTrackingRule,
  OfferTrackingSource,
} from "../types/offerTrackingSource";

interface OfferTrackingStepProps {
  trackingSources: OfferTrackingSource[];
  onTrackingSourcesChange: (sources: OfferTrackingSource[]) => void;
}

export default function OfferTrackingStep({
  trackingSources = [],
  onTrackingSourcesChange,
}: OfferTrackingStepProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(
    trackingSources.length > 0 ? trackingSources[0].id : null,
  );
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<OfferTrackingRule | null>(
    null,
  );
  const [ruleModalError, setRuleModalError] = useState("");
  const [catalogSources, setCatalogSources] = useState<
    TrackingSourceCatalogItem[]
  >([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [sourceActionError, setSourceActionError] = useState("");

  const generateId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      setCatalogError("");
      try {
        const sources = await trackingSourceService.getAll({ activeOnly: true });
        if (!cancelled) setCatalogSources(sources);
      } catch {
        if (!cancelled) {
          setCatalogSources([]);
          setCatalogError("Could not load tracking source catalog.");
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const catalogOptions = useMemo(() => {
    const usedCatalogIds = new Set(
      trackingSources
        .map((s) => s.catalog_source_id)
        .filter((id) => id != null)
        .map(String),
    );
    return catalogSources
      .filter((c) => !usedCatalogIds.has(String(c.id)))
      .map((c) => ({
        value: String(c.id),
        label: c.name,
      }));
  }, [catalogSources, trackingSources]);

  const selectedSourceData = trackingSources.find(
    (s) => s.id === selectedSource,
  );

  const parameterOptionsForSelected = useMemo(() => {
    if (!selectedSourceData) return [];
    const catalog = catalogSources.find(
      (c) => String(c.id) === String(selectedSourceData.catalog_source_id),
    );
    const keys =
      catalog?.parameters?.length
        ? catalog.parameters
        : getParametersByType(selectedSourceData.type);
    const opts = keys.map((value) => ({
      value,
      label: formatTrackingKeyLabel(value, PARAMETER_LABELS),
    }));
    // Keep legacy/custom parameter on the rule selectable
    if (
      editingRule?.parameter &&
      !opts.some((o) => o.value === editingRule.parameter)
    ) {
      const normalized = normalizeParameterKey(editingRule.parameter);
      opts.unshift({
        value: normalized || editingRule.parameter,
        label: formatTrackingKeyLabel(
          normalized || editingRule.parameter,
          PARAMETER_LABELS,
        ),
      });
    }
    if (opts.length === 0) {
      return getParameterOptionsByType(selectedSourceData.type || "custom");
    }
    return opts;
  }, [selectedSourceData, catalogSources, editingRule?.parameter]);

  const editingParameterType: TrackingParameterValueType = useMemo(
    () => getParameterValueType(editingRule?.parameter || ""),
    [editingRule?.parameter],
  );

  const conditionOptionsForParameter = useMemo(
    () => getConditionsForParameter(editingRule?.parameter || ""),
    [editingRule?.parameter],
  );

  const applyParameterChange = (nextParameter: string) => {
    if (!editingRule) return;
    const prevType = getParameterValueType(editingRule.parameter);
    const nextType = getParameterValueType(nextParameter);
    const nextConditions = getConditionsForParameter(nextParameter);
    const conditionStillValid = nextConditions.some(
      (c) => c.value === editingRule.condition,
    );

    setEditingRule({
      ...editingRule,
      parameter: nextParameter,
      condition: conditionStillValid
        ? editingRule.condition
        : getDefaultConditionForParameter(nextParameter),
      // Clear value when the control type changes to avoid invalid leftover text
      value: prevType === nextType ? editingRule.value : "",
    });
    setRuleModalError("");
  };

  const addBlankSource = () => {
    const newSource: OfferTrackingSource = {
      id: generateId(),
      name: "",
      type: "custom",
      enabled: true,
      rules: [],
    };
    const updatedSources = [...trackingSources, newSource];
    onTrackingSourcesChange(updatedSources);
    setSelectedSource(newSource.id);
  };

  const isCatalogIdInUse = (
    catalogId: string,
    exceptInstanceId?: string,
  ): boolean => {
    return trackingSources.some(
      (s) =>
        s.catalog_source_id != null &&
        String(s.catalog_source_id) === String(catalogId) &&
        s.id !== exceptInstanceId,
    );
  };

  const applyCatalogSource = (
    catalogId: string,
    targetInstanceId?: string,
  ) => {
    const catalog = catalogSources.find((c) => String(c.id) === catalogId);
    if (!catalog) return;

    if (isCatalogIdInUse(catalogId, targetInstanceId)) {
      setSourceActionError(
        `"${catalog.name}" is already added. Each tracking source can only be used once.`,
      );
      return;
    }

    setSourceActionError("");
    const mapped: OfferTrackingSource = {
      id: targetInstanceId || generateId(),
      name: catalog.name,
      type: String(catalog.type),
      enabled: true,
      rules: targetInstanceId
        ? trackingSources.find((s) => s.id === targetInstanceId)?.rules || []
        : [],
      catalog_source_id: catalog.id,
    };

    if (targetInstanceId) {
      onTrackingSourcesChange(
        trackingSources.map((s) =>
          s.id === targetInstanceId
            ? { ...s, ...mapped, id: targetInstanceId }
            : s,
        ),
      );
      setSelectedSource(targetInstanceId);
    } else {
      const updated = [...trackingSources, mapped];
      onTrackingSourcesChange(updated);
      setSelectedSource(mapped.id);
    }
  };

  const removeTrackingSource = (id: string) => {
    const updatedSources = trackingSources.filter((s) => s.id !== id);
    onTrackingSourcesChange(updatedSources);
    if (selectedSource === id) {
      setSelectedSource(
        updatedSources.length > 0 ? updatedSources[0].id : null,
      );
    }
  };

  const updateTrackingSource = (
    id: string,
    updates: Partial<OfferTrackingSource>,
  ) => {
    onTrackingSourcesChange(
      trackingSources.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const addRule = () => {
    const defaultParam =
      parameterOptionsForSelected[0]?.value ||
      getParametersByType(selectedSourceData?.type || "recharge")[0] ||
      "amount";
    setEditingRule({
      id: generateId(),
      name: "New Rule",
      priority: 1,
      parameter: defaultParam,
      condition: getDefaultConditionForParameter(defaultParam),
      value: "",
      enabled: true,
    });
    setRuleModalError("");
    setShowRuleModal(true);
  };

  const saveRule = (sourceId: string, rule: OfferTrackingRule) => {
    if (!rule.parameter?.trim()) {
      setRuleModalError("Select a parameter for this rule.");
      return;
    }
    if (!rule.name?.trim()) {
      setRuleModalError("Rule name is required.");
      return;
    }

    const parameter =
      normalizeParameterKey(rule.parameter) || rule.parameter;
    const valueType = getParameterValueType(parameter);
    const allowedConditions = getConditionsForParameter(parameter);
    const condition = allowedConditions.some((c) => c.value === rule.condition)
      ? rule.condition
      : getDefaultConditionForParameter(parameter);

    const serializedValue =
      condition === "is_any_of"
        ? String(rule.value ?? "")
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean)
            .join(", ")
        : serializeTrackingRuleValue(rule.value, valueType);

    const valueError = validateTrackingRuleValue(
      serializedValue,
      parameter,
      condition,
    );
    if (valueError) {
      setRuleModalError(valueError);
      return;
    }

    const normalized: OfferTrackingRule = {
      ...rule,
      parameter,
      condition,
      value: serializedValue,
    };

    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) return;

    const existingRuleIndex = source.rules.findIndex(
      (r) => r.id === normalized.id,
    );
    const updatedRules =
      existingRuleIndex >= 0
        ? source.rules.map((r, i) =>
            i === existingRuleIndex ? normalized : r,
          )
        : [...source.rules, normalized];

    updateTrackingSource(sourceId, { rules: updatedRules });
    setShowRuleModal(false);
    setEditingRule(null);
    setRuleModalError("");
  };

  const removeRule = (sourceId: string, ruleId: string) => {
    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) return;
    updateTrackingSource(sourceId, {
      rules: source.rules.filter((r) => r.id !== ruleId),
    });
  };

  if (selectedSource && !selectedSourceData && trackingSources.length > 0) {
    setSelectedSource(trackingSources[0].id);
  }

  return (
    <div className="space-y-6">
      {trackingSources.length === 0 ? (
        <div
          className={`bg-white ${tw.rounded} border border-gray-200 p-8 text-center`}
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Tracking Sources Added
          </h3>
          <p className="text-gray-500 text-sm mb-4">
            Add a source from Configuration → Offer Tracking Sources, then
            define rules using its parameters.
          </p>
          {catalogError ? (
            <p className="text-sm text-red-600 mb-4">{catalogError}</p>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <div className="w-full max-w-sm">
              <HeadlessSelect
                label="Catalog source"
                options={[
                  { value: "", label: loadingCatalog ? "Loading..." : "Select from catalog..." },
                  ...catalogOptions,
                ]}
                value=""
                onChange={(value) => {
                  if (value) applyCatalogSource(String(value));
                }}
                disabled={loadingCatalog || catalogOptions.length === 0}
                placeholder="Select from catalog..."
              />
            </div>
            <button
              type="button"
              onClick={addBlankSource}
              className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded}`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add blank source
            </button>
          </div>
          {!loadingCatalog && catalogOptions.length === 0 ? (
            <p className={`mt-3 text-xs ${tw.textSecondary}`}>
              No active catalog sources available. Create one under
              Configuration → Offer Tracking Sources.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className={`bg-white ${tw.rounded} border border-gray-200 p-4`}>
              <div className="mb-4 space-y-2">
                <HeadlessSelect
                  label="Add from catalog"
                  options={[
                    {
                      value: "",
                      label: loadingCatalog
                        ? "Loading..."
                        : catalogOptions.length === 0
                          ? "No unused catalog sources"
                          : "Select catalog source...",
                    },
                    ...catalogOptions,
                  ]}
                  value=""
                  onChange={(value) => {
                    if (value) applyCatalogSource(String(value));
                  }}
                  disabled={loadingCatalog || catalogOptions.length === 0}
                />
                {sourceActionError ? (
                  <p className="text-xs text-red-600">{sourceActionError}</p>
                ) : (
                  <p className={`text-xs ${tw.textSecondary}`}>
                    Each catalog tracking source can only be added once per offer.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSourceActionError("");
                    addBlankSource();
                  }}
                  className={`inline-flex items-center px-3 py-1 text-sm text-white ${tw.rounded} w-full justify-center`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add blank source
                </button>
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
                      <div className="flex items-center space-x-3 min-w-0">
                        <div
                          className={`w-8 h-8 ${tw.rounded} flex items-center justify-center bg-gray-100 shrink-0`}
                        >
                          <BarChart3
                            className={`w-4 h-4 ${
                              source.enabled ? "text-gray-600" : "text-gray-400"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {source.name || "Untitled source"}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {TRACKING_TYPE_OPTIONS.find(
                              (t) => t.value === source.type,
                            )?.label || source.type}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTrackingSource(source.id);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {source.rules.length} rule
                      {source.rules.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedSourceData ? (
              <div
                className={`bg-white ${tw.rounded} border border-gray-200 p-6 w-full`}
              >
                <div className="space-y-6">
                  {!selectedSourceData.catalog_source_id ? (
                    <div>
                      <HeadlessSelect
                        label="Link catalog source"
                        options={[
                          { value: "", label: "Select a catalog source..." },
                          ...catalogOptions,
                        ]}
                        value=""
                        onChange={(value) => {
                          if (value) {
                            applyCatalogSource(
                              String(value),
                              selectedSourceData.id,
                            );
                          }
                        }}
                        placeholder="Select a catalog source..."
                        disabled={catalogOptions.length === 0}
                      />
                      {sourceActionError ? (
                        <p className="mt-1 text-xs text-red-600">
                          {sourceActionError}
                        </p>
                      ) : catalogOptions.length === 0 ? (
                        <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                          All catalog sources are already in use on this offer.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className={`text-xs ${tw.textSecondary}`}>
                      Linked to catalog #
                      {String(selectedSourceData.catalog_source_id)}
                      . Parameters come from that source&apos;s configuration.
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Source Name"
                      type="text"
                      placeholder="Enter source name"
                      value={selectedSourceData.name}
                      onChange={(value) =>
                        updateTrackingSource(selectedSourceData.id, {
                          name: String(value),
                        })
                      }
                    />

                    <HeadlessSelect
                      label="Type"
                      options={TRACKING_TYPE_OPTIONS.map((type) => ({
                        value: type.value,
                        label: type.label,
                      }))}
                      value={selectedSourceData.type}
                      onChange={(value) =>
                        updateTrackingSource(selectedSourceData.id, {
                          type: String(value),
                        })
                      }
                      placeholder="Select tracking type"
                      className="w-full text-sm"
                    />
                  </div>

                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() =>
                      updateTrackingSource(selectedSourceData.id, {
                        enabled: !selectedSourceData.enabled,
                      })
                    }
                  >
                    <Checkbox
                      id={`enabled-${selectedSourceData.id}`}
                      checked={selectedSourceData.enabled}
                      onChange={() =>
                        updateTrackingSource(selectedSourceData.id, {
                          enabled: !selectedSourceData.enabled,
                        })
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Enable this tracking source
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-sm text-gray-900">
                        Tracking Rules
                      </h4>
                      <button
                        type="button"
                        onClick={addRule}
                        className={`inline-flex items-center px-3 py-1 text-sm text-white ${tw.rounded}`}
                        style={{ backgroundColor: color.primary.action }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Rule
                      </button>
                    </div>

                    {selectedSourceData.rules.length === 0 ? (
                      <div
                        className={`text-center py-8 border-2 border-dashed border-gray-200 ${tw.rounded}`}
                      >
                        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-4">
                          No rules configured
                        </p>
                        <button
                          type="button"
                          onClick={addRule}
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
                              <div className="flex items-center space-x-3 flex-wrap gap-y-1">
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
                                  type="button"
                                  onClick={() => {
                                    setEditingRule({
                                      ...rule,
                                      parameter: normalizeParameterKey(
                                        rule.parameter,
                                      ) || rule.parameter,
                                    });
                                    setRuleModalError("");
                                    setShowRuleModal(true);
                                  }}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
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
                              {formatTrackingKeyLabel(
                                normalizeParameterKey(rule.parameter) ||
                                  rule.parameter,
                                PARAMETER_LABELS,
                              )}{" "}
                              {CONDITION_OPTIONS.find(
                                (c) => c.value === rule.condition,
                              )?.label.toLowerCase()}{" "}
                              &quot;
                              {formatTrackingRuleValueDisplay(
                                rule.value,
                                rule.parameter,
                              )}
                              &quot;
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={`bg-gray-50 ${tw.rounded} border border-gray-200 p-8 text-center`}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Source Selected
                </h3>
                <p className="text-gray-500 text-sm">
                  Select a tracking source from the list to configure it.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {showRuleModal &&
        editingRule &&
        selectedSourceData &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: zIndex.modal - 1 }}
          >
            <div
              className={`bg-white ${tw.rounded} p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedSourceData.rules.some((r) => r.id === editingRule.id)
                    ? "Edit Tracking Rule"
                    : "Add Tracking Rule"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                    setRuleModalError("");
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label="Rule Name"
                  type="text"
                  placeholder="Enter rule name"
                  value={editingRule.name}
                  onChange={(value) =>
                    setEditingRule({ ...editingRule, name: String(value) })
                  }
                />

                <Input
                  label="Priority"
                  type="number"
                  placeholder="Priority"
                  min="1"
                  value={editingRule.priority}
                  onChange={(value) =>
                    setEditingRule({
                      ...editingRule,
                      priority: parseInt(String(value), 10) || 1,
                    })
                  }
                />

                <HeadlessSelect
                  label="Parameter"
                  options={parameterOptionsForSelected}
                  value={editingRule.parameter}
                  onChange={(value) => applyParameterChange(String(value))}
                  placeholder={
                    parameterOptionsForSelected.length === 0
                      ? "No parameters configured for this source"
                      : "Select parameter"
                  }
                  disabled={parameterOptionsForSelected.length === 0}
                  className="w-full text-sm"
                  zIndex={zIndex.popover}
                />

                <HeadlessSelect
                  label="Condition"
                  options={conditionOptionsForParameter}
                  value={
                    conditionOptionsForParameter.some(
                      (c) => c.value === editingRule.condition,
                    )
                      ? editingRule.condition
                      : conditionOptionsForParameter[0]?.value || "equals"
                  }
                  onChange={(value) =>
                    setEditingRule({
                      ...editingRule,
                      condition: value as OfferTrackingRule["condition"],
                      // Multi-value vs single-value controls use different shapes
                      value:
                        value === "is_any_of" ||
                        editingRule.condition === "is_any_of"
                          ? ""
                          : editingRule.value,
                    })
                  }
                  placeholder="Select condition"
                  className="w-full text-sm"
                  zIndex={zIndex.popover}
                />

                {editingRule.condition === "is_any_of" ? (
                  <Input
                    label="Value"
                    type="text"
                    placeholder={
                      editingParameterType === "number"
                        ? "e.g. 10, 20, 50"
                        : "e.g. value1, value2"
                    }
                    value={editingRule.value}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        value: String(value),
                      })
                    }
                  />
                ) : editingParameterType === "boolean" ? (
                  <HeadlessSelect
                    label="Value"
                    options={[
                      { value: "true", label: "True" },
                      { value: "false", label: "False" },
                    ]}
                    value={toTrackingValueInputDisplay(
                      editingRule.value,
                      "boolean",
                    )}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        value: String(value),
                      })
                    }
                    placeholder="Select true or false"
                    className="w-full text-sm"
                    zIndex={zIndex.popover}
                  />
                ) : editingParameterType === "datetime" ? (
                  <Input
                    label="Value"
                    type="datetime-local"
                    placeholder="Select date and time"
                    value={toTrackingValueInputDisplay(
                      editingRule.value,
                      "datetime",
                    )}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        value: String(value),
                      })
                    }
                  />
                ) : editingParameterType === "date" ? (
                  <Input
                    label="Value"
                    type="date"
                    placeholder="Select date"
                    value={toTrackingValueInputDisplay(
                      editingRule.value,
                      "date",
                    )}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        value: String(value),
                      })
                    }
                  />
                ) : editingParameterType === "number" ? (
                  <Input
                    label="Value"
                    type="number"
                    placeholder="Enter number..."
                    value={editingRule.value}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        value: String(value),
                      })
                    }
                  />
                ) : (
                  <Input
                    label="Value"
                    type="text"
                    placeholder="Enter value..."
                    value={editingRule.value}
                    onChange={(value) =>
                      setEditingRule({
                        ...editingRule,
                        value: String(value),
                      })
                    }
                  />
                )}
                {editingParameterType === "datetime" ||
                editingParameterType === "date" ? (
                  <p className="text-xs text-gray-500 -mt-2">
                    {editingParameterType === "datetime"
                      ? "Uses the system date/time picker for an exact timestamp."
                      : "Uses the system date picker."}
                  </p>
                ) : null}

                {ruleModalError ? (
                  <p className="text-sm text-red-600">{ruleModalError}</p>
                ) : null}

                <div
                  className="flex items-center cursor-pointer"
                  onClick={() =>
                    setEditingRule({
                      ...editingRule,
                      enabled: !editingRule.enabled,
                    })
                  }
                >
                  <Checkbox
                    id="rule-enabled"
                    checked={editingRule.enabled}
                    onChange={() =>
                      setEditingRule({
                        ...editingRule,
                        enabled: !editingRule.enabled,
                      })
                    }
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Enable this rule
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowRuleModal(false);
                    setEditingRule(null);
                    setRuleModalError("");
                  }}
                  className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => saveRule(selectedSourceData.id, editingRule)}
                  className={`px-4 py-2 text-white ${tw.rounded}`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  Save Rule
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
