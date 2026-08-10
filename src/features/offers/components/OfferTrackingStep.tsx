import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, BarChart3, Settings, Edit, X, Check } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import SearchInput from "../../../shared/components/ui/SearchInput";
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
import { engineTrackingSourceService } from "../../configurations/services/engineTrackingSourceService";
import type { TrackingSourceCatalogItem } from "../../configurations/types/trackingSource";
import type {
  EngineTrackingSource,
  TrackingSelectorSource,
} from "../../configurations/types/engineTrackingSource";
import type {
  OfferTrackingRule,
  OfferTrackingSource,
} from "../types/offerTrackingSource";
import {
  getNextAvailableTrackingRulePriority,
  TRACKING_RULE_PRIORITY_MAX,
  TRACKING_RULE_PRIORITY_MIN,
  validateTrackingRulePriority,
} from "../utils/trackingRulePriority";

interface OfferTrackingStepProps {
  trackingSources: OfferTrackingSource[];
  onTrackingSourcesChange: (sources: OfferTrackingSource[]) => void;
}

function trackingTypeLabel(type: string | undefined): string {
  if (!type) return "—";
  return (
    TRACKING_TYPE_OPTIONS.find((t) => t.value === type)?.label || type
  );
}

export default function OfferTrackingStep({
  trackingSources = [],
  onTrackingSourcesChange,
}: OfferTrackingStepProps) {
  const navigate = useNavigate();
  const [selectedSource, setSelectedSource] = useState<string | null>(
    trackingSources.length > 0 ? trackingSources[0].id : null,
  );
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingRule, setEditingRule] = useState<OfferTrackingRule | null>(
    null,
  );
  const [ruleModalError, setRuleModalError] = useState("");
  const [catalogSources, setCatalogSources] = useState<
    TrackingSourceCatalogItem[]
  >([]);
  const [engineSources, setEngineSources] = useState<EngineTrackingSource[]>(
    [],
  );
  const [selectorTree, setSelectorTree] = useState<TrackingSelectorSource[]>(
    [],
  );
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [sourceActionError, setSourceActionError] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const [pendingCatalogIds, setPendingCatalogIds] = useState<string[]>([]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const resolveEngineId = (
    catalog: TrackingSourceCatalogItem,
    engines: EngineTrackingSource[] = engineSources,
  ): number | undefined => {
    const needle = String(catalog.type || catalog.dataSource || "")
      .trim()
      .toLowerCase();
    if (!needle) return undefined;
    const match =
      engines.find((s) => s.code.toLowerCase() === needle) ||
      engines.find((s) => s.sourceType.toLowerCase() === needle);
    return match?.id;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      setCatalogError("");
      try {
        const [sources, engines, selector] = await Promise.all([
          trackingSourceService.getAll({ activeOnly: true }),
          engineTrackingSourceService
            .getAll({ is_active: true, limit: 500 })
            .catch(() => [] as EngineTrackingSource[]),
          engineTrackingSourceService
            .getSelectorConfig()
            .catch(() => [] as TrackingSelectorSource[]),
        ]);
        if (!cancelled) {
          setCatalogSources(sources);
          setEngineSources(engines);
          setSelectorTree(selector);
        }
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

  useEffect(() => {
    if (selectedSource && !trackingSources.some((s) => s.id === selectedSource)) {
      setSelectedSource(trackingSources[0]?.id ?? null);
    }
  }, [trackingSources, selectedSource]);

  const usedCatalogIds = useMemo(() => {
    return new Set(
      trackingSources
        .map((s) => s.catalog_source_id)
        .filter((id) => id != null)
        .map(String),
    );
  }, [trackingSources]);

  const availableCatalogSources = useMemo(() => {
    return catalogSources.filter((c) => !usedCatalogIds.has(String(c.id)));
  }, [catalogSources, usedCatalogIds]);

  const filteredModalSources = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();
    return availableCatalogSources.filter((c) => {
      if (sourceTypeFilter !== "all" && String(c.type) !== sourceTypeFilter) {
        return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        String(c.type).toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q)
      );
    });
  }, [availableCatalogSources, sourceSearch, sourceTypeFilter]);

  const typeFilterOptions = useMemo(() => {
    const types = new Set(
      availableCatalogSources.map((c) => String(c.type)).filter(Boolean),
    );
    return [
      { value: "all", label: "All Types" },
      ...TRACKING_TYPE_OPTIONS.filter((t) => types.has(t.value)),
      ...[...types]
        .filter((t) => !TRACKING_TYPE_OPTIONS.some((o) => o.value === t))
        .map((t) => ({ value: t, label: t })),
    ];
  }, [availableCatalogSources]);

  /** Dropdown options for the selected instance: current link + unused catalog rows */
  const trackingSourceSelectOptions = useMemo(() => {
    if (!selectedSource) return [];
    const current = trackingSources.find((s) => s.id === selectedSource);
    const options = availableCatalogSources.map((c) => ({
      value: String(c.id),
      label: c.name,
    }));
    if (current?.catalog_source_id != null) {
      const id = String(current.catalog_source_id);
      if (!options.some((o) => o.value === id)) {
        const linked = catalogSources.find((c) => String(c.id) === id);
        options.unshift({
          value: id,
          label: linked?.name || current.name || `Catalog #${id}`,
        });
      }
    }
    return options;
  }, [
    selectedSource,
    trackingSources,
    availableCatalogSources,
    catalogSources,
  ]);

  const selectedSourceData = trackingSources.find(
    (s) => s.id === selectedSource,
  );

  const parameterOptionsForSelected = useMemo(() => {
    if (!selectedSourceData) return [];

    // Prefer engine selector-config fields when attribution source is linked
    const engineId = selectedSourceData.engine_tracking_source_id;
    if (engineId != null) {
      const engineFields =
        engineTrackingSourceService.getFieldsForSource(selectorTree, engineId);
      if (engineFields.length > 0) {
        const opts = engineFields.map((f) => ({
          value: f.fieldKey,
          label: f.fieldName || formatTrackingKeyLabel(f.fieldKey, PARAMETER_LABELS),
        }));
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
        return opts;
      }
    }

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
  }, [
    selectedSourceData,
    catalogSources,
    editingRule?.parameter,
    selectorTree,
  ]);

  const conditionOptionsForParameter = useMemo(() => {
    const engineId = selectedSourceData?.engine_tracking_source_id;
    const param = editingRule?.parameter || "";
    if (engineId != null && param) {
      const field = engineTrackingSourceService
        .getFieldsForSource(selectorTree, engineId)
        .find((f) => f.fieldKey === param);
      if (field?.operators?.length) {
        return field.operators.map((op) => ({
          value: op.symbol || op.code,
          label: op.name || op.symbol || op.code,
        }));
      }
    }
    return getConditionsForParameter(param);
  }, [
    selectedSourceData?.engine_tracking_source_id,
    editingRule?.parameter,
    selectorTree,
  ]);

  const editingParameterType: TrackingParameterValueType = useMemo(
    () => getParameterValueType(editingRule?.parameter || ""),
    [editingRule?.parameter],
  );

  const applyParameterChange = (nextParameter: string) => {
    if (!editingRule) return;
    const prevType = getParameterValueType(editingRule.parameter);
    const nextType = getParameterValueType(nextParameter);
    const engineId = selectedSourceData?.engine_tracking_source_id;
    let nextConditions = getConditionsForParameter(nextParameter);
    if (engineId != null) {
      const field = engineTrackingSourceService
        .getFieldsForSource(selectorTree, engineId)
        .find((f) => f.fieldKey === nextParameter);
      if (field?.operators?.length) {
        nextConditions = field.operators.map((op) => ({
          value: op.symbol || op.code,
          label: op.name || op.symbol || op.code,
        }));
      }
    }
    const conditionStillValid = nextConditions.some(
      (c) => c.value === editingRule.condition,
    );

    setEditingRule({
      ...editingRule,
      parameter: nextParameter,
      condition: conditionStillValid
        ? editingRule.condition
        : ((nextConditions[0]?.value as OfferTrackingRule["condition"]) ||
          getDefaultConditionForParameter(nextParameter)),
      value: prevType === nextType ? editingRule.value : "",
    });
    setRuleModalError("");
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

  const mapCatalogToOfferSource = (
    catalog: TrackingSourceCatalogItem,
    options?: {
      targetInstanceId?: string;
      existingRules?: OfferTrackingRule[];
      isDefault?: boolean;
      engineTrackingSourceId?: number;
    },
  ): OfferTrackingSource => ({
    id: options?.targetInstanceId || generateId(),
    name: catalog.name,
    type: String(catalog.type),
    enabled: true,
    rules: options?.existingRules ?? [],
    catalog_source_id: catalog.id,
    engine_tracking_source_id:
      options?.engineTrackingSourceId ?? resolveEngineId(catalog),
    is_default: options?.isDefault === true,
  });

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
    const existing = targetInstanceId
      ? trackingSources.find((s) => s.id === targetInstanceId)
      : undefined;

    const mapped = mapCatalogToOfferSource(catalog, {
      targetInstanceId,
      existingRules: existing?.rules || [],
      isDefault: existing?.is_default === true,
      engineTrackingSourceId:
        existing?.engine_tracking_source_id ?? resolveEngineId(catalog),
    });

    if (targetInstanceId) {
      onTrackingSourcesChange(
        trackingSources.map((s) =>
          s.id === targetInstanceId
            ? {
                ...s,
                ...mapped,
                id: targetInstanceId,
                enabled: s.enabled !== false,
                is_default: s.is_default,
              }
            : s,
        ),
      );
      setSelectedSource(targetInstanceId);
    } else {
      const shouldBeDefault =
        trackingSources.length === 0 ||
        !trackingSources.some((s) => s.is_default);
      const next: OfferTrackingSource = {
        ...mapped,
        is_default: shouldBeDefault,
      };
      const updated = shouldBeDefault
        ? [
            ...trackingSources.map((s) => ({ ...s, is_default: false })),
            next,
          ]
        : [...trackingSources, next];
      onTrackingSourcesChange(updated);
      setSelectedSource(next.id);
    }
  };

  const openSourceModal = () => {
    setSourceActionError("");
    setSourceSearch("");
    setSourceTypeFilter("all");
    setPendingCatalogIds([]);
    setShowSourceModal(true);
  };

  const togglePendingCatalog = (catalogId: string) => {
    setPendingCatalogIds((prev) =>
      prev.includes(catalogId)
        ? prev.filter((id) => id !== catalogId)
        : [...prev, catalogId],
    );
  };

  const confirmPendingCatalogSources = () => {
    if (pendingCatalogIds.length === 0) return;

    const toAdd = pendingCatalogIds
      .map((id) => catalogSources.find((c) => String(c.id) === id))
      .filter((c): c is TrackingSourceCatalogItem => Boolean(c))
      .filter((c) => !isCatalogIdInUse(String(c.id)));

    if (toAdd.length === 0) {
      setSourceActionError(
        "Selected tracking sources are already on this offer.",
      );
      return;
    }

    const hasDefault = trackingSources.some((s) => s.is_default);
    let nextSources = [...trackingSources];
    let firstNewId: string | null = null;

    toAdd.forEach((catalog, index) => {
      const makeDefault = !hasDefault && index === 0;
      const mapped = mapCatalogToOfferSource(catalog, {
        isDefault: makeDefault,
      });
      if (!firstNewId) firstNewId = mapped.id;
      if (makeDefault) {
        nextSources = nextSources.map((s) => ({ ...s, is_default: false }));
      }
      nextSources.push(mapped);
    });

    onTrackingSourcesChange(nextSources);
    if (firstNewId) setSelectedSource(firstNewId);
    setShowSourceModal(false);
    setPendingCatalogIds([]);
    setSourceActionError("");
  };

  const removeTrackingSource = (id: string) => {
    const removed = trackingSources.find((s) => s.id === id);
    let updatedSources = trackingSources.filter((s) => s.id !== id);
    // Keep exactly one default when the previous default is removed
    if (removed?.is_default && updatedSources.length > 0) {
      updatedSources = updatedSources.map((s, i) => ({
        ...s,
        is_default: i === 0,
      }));
    }
    onTrackingSourcesChange(updatedSources);
    if (selectedSource === id) {
      setSelectedSource(updatedSources[0]?.id ?? null);
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

  /** Exclusive default: at most one source is marked default on the offer */
  const setAsDefaultTrackingSource = (id: string, makeDefault: boolean) => {
    onTrackingSourcesChange(
      trackingSources.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            is_default: makeDefault,
            // Default source must remain enabled for rewards / validation
            enabled: makeDefault ? true : s.enabled,
          };
        }
        return makeDefault ? { ...s, is_default: false } : s;
      }),
    );
  };

  const addRule = () => {
    const defaultParam =
      parameterOptionsForSelected[0]?.value ||
      getParametersByType(selectedSourceData?.type || "recharge")[0] ||
      "amount";
    const nextPriority = getNextAvailableTrackingRulePriority(
      selectedSourceData?.rules || [],
    );
    if (nextPriority == null) {
      setSourceActionError(
        `This source already has rules for every priority (${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}). Remove or change an existing rule first.`,
      );
      return;
    }
    setSourceActionError("");
    setEditingRule({
      id: generateId(),
      name: "New Rule",
      priority: nextPriority,
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

    const source = trackingSources.find((s) => s.id === sourceId);
    if (!source) return;

    const priorityError = validateTrackingRulePriority(
      rule.priority,
      source.rules || [],
      rule.id,
    );
    if (priorityError) {
      setRuleModalError(priorityError);
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

  const renderAddTrackingSourceButton = (opts?: {
    fullWidth?: boolean;
    size?: "md" | "lg";
  }) => (
    <button
      type="button"
      onClick={openSourceModal}
      disabled={loadingCatalog}
      className={`inline-flex items-center ${
        opts?.fullWidth ? "w-full justify-center" : ""
      } ${
        opts?.size === "lg" ? "px-4 py-2" : "px-3 py-1.5 text-sm"
      } text-white ${tw.rounded} disabled:opacity-50`}
      style={{ backgroundColor: color.primary.action }}
    >
      <Plus className={`mr-2 ${opts?.size === "lg" ? "w-4 h-4" : "w-4 h-4"}`} />
      Add tracking source
    </button>
  );

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
          
          {catalogError ? (
            <p className="text-sm text-red-600 mb-4">{catalogError}</p>
          ) : null}
          <div className="flex justify-center">
            {renderAddTrackingSourceButton({ size: "lg" })}
          </div>
          {!loadingCatalog && availableCatalogSources.length === 0 ? (
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
                {renderAddTrackingSourceButton({ fullWidth: true })}
                {sourceActionError ? (
                  <p className="text-xs text-red-600">{sourceActionError}</p>
                ) : (
                  <p className={`text-xs ${tw.textSecondary}`}>
                    Each catalog tracking source can only be added once per
                    offer.
                  </p>
                )}
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
                          <div className="font-medium text-sm text-gray-900 truncate flex items-center gap-2">
                            <span className="truncate">
                              {source.name || "Untitled source"}
                            </span>
                            {source.is_default ? (
                              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-200 text-gray-700">
                                Default
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            {trackingTypeLabel(source.type)}
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
                  <div>
                    <HeadlessSelect
                      label="Tracking Source"
                      options={trackingSourceSelectOptions}
                      value={
                        selectedSourceData.catalog_source_id != null
                          ? String(selectedSourceData.catalog_source_id)
                          : ""
                      }
                      onChange={(value) => {
                        if (value) {
                          applyCatalogSource(
                            String(value),
                            selectedSourceData.id,
                          );
                        }
                      }}
                      placeholder={
                        trackingSourceSelectOptions.length === 0
                          ? "No catalog sources available"
                          : "Select tracking source..."
                      }
                      disabled={trackingSourceSelectOptions.length === 0}
                      className="w-full text-sm"
                    />
                    {sourceActionError ? (
                      <p className="mt-1 text-xs text-red-600">
                        {sourceActionError}
                      </p>
                    ) : selectedSourceData.catalog_source_id != null ? (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        {selectedSourceData.engine_tracking_source_id != null
                          ? `Linked to engine attribution source #${selectedSourceData.engine_tracking_source_id} (reward mapping FK).`
                          : ""}
                      </p>
                    ) : (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        Link this instance to a catalog tracking source to
                        configure rules from its parameters.
                      </p>
                    )}
                  </div>

                  
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() =>
                      setAsDefaultTrackingSource(
                        selectedSourceData.id,
                        !selectedSourceData.is_default,
                      )
                    }
                  >
                    <Checkbox
                      id={`default-${selectedSourceData.id}`}
                      checked={selectedSourceData.is_default === true}
                      onChange={() =>
                        setAsDefaultTrackingSource(
                          selectedSourceData.id,
                          !selectedSourceData.is_default,
                        )
                      }
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Set as default tracking source
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">
                          Tracking Rules
                          
                        </h4>
                        
                      </div>
                      <button
                        type="button"
                        onClick={addRule}
                        disabled={!selectedSourceData.catalog_source_id}
                        className={`inline-flex items-center px-3 py-1 text-sm text-white ${tw.rounded} disabled:opacity-50`}
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
                        <p className="text-gray-500 text-sm mb-1">
                          {!selectedSourceData.catalog_source_id
                            ? "Select a tracking source before adding rules"
                            : "No rules configured — optional"}
                        </p>
                        {selectedSourceData.catalog_source_id ? (
                          <>
                            <p className={`text-xs mb-4 ${tw.textSecondary}`}>
                              You can continue without rules. Fulfilment will
                              use this source as-is; add rules only when you need
                              parameter conditions.
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
                          </>
                        ) : null}
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
                                      parameter:
                                        normalizeParameterKey(rule.parameter) ||
                                        rule.parameter,
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

      {showSourceModal &&
        createPortal(
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            style={{ zIndex: zIndex.modal - 1 }}
          >
            <div
              className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select Tracking Sources
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose catalog sources to measure this offer. Each source
                    can only be added once.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate("/dashboard/offer-tracking-sources")
                    }
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium text-white ${tw.rounded} hover:opacity-90 transition-all`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create Tracking Source
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSourceModal(false);
                      setPendingCatalogIds([]);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="px-6 pt-4 space-y-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <SearchInput
                    placeholder="Search tracking sources..."
                    value={sourceSearch}
                    onChange={setSourceSearch}
                  />
                  <div className="w-48">
                    <div className="[&_button]:py-2 [&_li]:py-1.5">
                      <HeadlessSelect
                        label="Filter"
                        options={typeFilterOptions}
                        value={sourceTypeFilter}
                        onChange={(value) =>
                          setSourceTypeFilter(String(value))
                        }
                        placeholder="Filter by type"
                        zIndex={zIndex.popover}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {pendingCatalogIds.length > 0 ? (
                <div className="px-6 flex-shrink-0 my-3">
                  <div
                    className={`${tw.rounded} p-4 border text-sm`}
                    style={{
                      backgroundColor: "white",
                      borderColor: color.primary.accent,
                      color: color.primary.accent,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span>
                        {pendingCatalogIds.length} source
                        {pendingCatalogIds.length !== 1 ? "s" : ""} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingCatalogIds([])}
                        className="font-medium hover:opacity-80 transition-opacity"
                        style={{ color: color.primary.accent }}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex-1 overflow-y-auto p-6">
                {loadingCatalog ? (
                  <div className="text-center py-12 text-gray-500 text-sm">
                    Loading tracking sources...
                  </div>
                ) : catalogError ? (
                  <div className="text-center py-12 text-red-600 text-sm">
                    {catalogError}
                  </div>
                ) : filteredModalSources.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {availableCatalogSources.length === 0
                        ? "No unused catalog sources available. Create one or remove an existing source from this offer."
                        : "No tracking sources match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-200 rounded">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            Select
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Parameters
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredModalSources.map((source) => {
                          const id = String(source.id);
                          const checked = pendingCatalogIds.includes(id);
                          return (
                            <tr
                              key={id}
                              className={`cursor-pointer hover:bg-gray-50 ${
                                checked ? "bg-gray-50" : ""
                              }`}
                              onClick={() => togglePendingCatalog(id)}
                            >
                              <td className="px-4 py-3">
                                <div
                                  className="flex items-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    id={`catalog-${id}`}
                                    checked={checked}
                                    onChange={() => togglePendingCatalog(id)}
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                <div className="flex items-center gap-2">
                                  {checked ? (
                                    <Check
                                      className="w-4 h-4 shrink-0"
                                      style={{ color: color.primary.accent }}
                                    />
                                  ) : null}
                                  {source.name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {trackingTypeLabel(String(source.type))}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {source.parameters?.length ?? 0}
                              </td>
                              <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                                {source.description || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
                <span className="text-sm text-gray-600">
                  {pendingCatalogIds.length} of {filteredModalSources.length}{" "}
                  shown source
                  {filteredModalSources.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSourceModal(false);
                      setPendingCatalogIds([]);
                    }}
                    className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmPendingCatalogSources}
                    disabled={pendingCatalogIds.length === 0}
                    className={`px-4 py-2 text-white ${tw.rounded} disabled:opacity-50`}
                    style={{ backgroundColor: color.primary.action }}
                  >
                    Confirm Selection
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
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

                <div>
                  <Input
                    label="Priority"
                    type="number"
                    placeholder={`${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}`}
                    min={TRACKING_RULE_PRIORITY_MIN}
                    max={TRACKING_RULE_PRIORITY_MAX}
                    step={1}
                    value={editingRule.priority}
                    onChange={(value) => {
                      const parsed = parseInt(String(value), 10);
                      setEditingRule({
                        ...editingRule,
                        priority: Number.isFinite(parsed)
                          ? parsed
                          : TRACKING_RULE_PRIORITY_MIN,
                      });
                    }}
                    hasError={Boolean(
                      validateTrackingRulePriority(
                        editingRule.priority,
                        selectedSourceData.rules || [],
                        editingRule.id,
                      ),
                    )}
                  />
                  <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                    Must be unique on this source (
                    {TRACKING_RULE_PRIORITY_MIN}–{TRACKING_RULE_PRIORITY_MAX}).
                    Lower priority is evaluated first.
                  </p>
                </div>

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
