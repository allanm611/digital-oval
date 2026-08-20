import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
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
  getConditionsForValueType,
  getDefaultConditionForParameter,
  getParameterValueType,
  normalizeParameterKey,
  PARAMETER_LABELS,
  serializeTrackingRuleValue,
  splitTrackingRangeValue,
  joinTrackingRangeValue,
  toTrackingValueInputDisplay,
  validateTrackingRuleValue,
  isListCondition,
  isBetweenCondition,
  type TrackingParameterValueType,
} from "../utils/trackingSourcesConfig";
import {
  engineTrackingSourceService,
  mergeSourcesIntoSelectorTree,
} from "../../configurations/services/engineTrackingSourceService";
import type {
  EngineTrackingSource,
  TrackingSelectorField,
  TrackingSelectorSource,
} from "../../configurations/types/engineTrackingSource";
import {
  ENGINE_TRACKING_SOURCE_TYPE_OPTIONS,
  engineSourceTypeLabel,
  trackingOperatorIsList,
  trackingOperatorLabel,
  trackingOperatorRequiresTwoValues,
  trackingOperatorValue,
} from "../../configurations/types/engineTrackingSource";
import type {
  OfferTrackingRule,
  OfferTrackingSource,
} from "../types/offerTrackingSource";
import {
  getAvailablePrioritySelectOptions,
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
  return engineSourceTypeLabel(type);
}

function dataTypeToValueType(
  dataType: string | undefined,
): TrackingParameterValueType {
  switch (String(dataType || "").toLowerCase()) {
    case "number":
    case "integer":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "date";
    case "timestamp":
    case "datetime":
      return "datetime";
    case "text":
    case "string":
    case "json":
    default:
      return "string";
  }
}

function conditionsForEngineField(
  field: TrackingSelectorField | undefined,
  parameterKey: string,
) {
  if (field?.operators?.length) {
    return field.operators.map((op) => ({
      value: trackingOperatorValue(op),
      label: trackingOperatorLabel(op),
    }));
  }
  if (field?.dataType) {
    return getConditionsForValueType(dataTypeToValueType(field.dataType));
  }
  return getConditionsForParameter(parameterKey);
}

function findFieldOperator(
  field: TrackingSelectorField | undefined,
  condition: string,
) {
  if (!field?.operators?.length) return undefined;
  return field.operators.find(
    (op) => trackingOperatorValue(op) === condition,
  );
}

function conditionDisplayLabel(
  condition: string,
  field?: TrackingSelectorField,
): string {
  const op = findFieldOperator(field, condition);
  if (op) return trackingOperatorLabel(op);
  return (
    CONDITION_OPTIONS.find((c) => c.value === condition)?.label || condition
  );
}

function upsertSelectorSource(
  tree: TrackingSelectorSource[],
  next: TrackingSelectorSource,
): TrackingSelectorSource[] {
  const without = tree.filter((s) => s.id !== next.id);
  const existing = tree.find((s) => s.id === next.id);
  if (!existing) return [...without, next];

  const fieldMap = new Map(
    existing.fields.map((f) => [f.id, { ...f, operators: [...f.operators] }]),
  );
  for (const field of next.fields) {
    const prev = fieldMap.get(field.id);
    if (prev) {
      fieldMap.set(field.id, {
        ...prev,
        fieldName: field.fieldName || prev.fieldName,
        fieldKey: field.fieldKey || prev.fieldKey,
        dataType: field.dataType || prev.dataType,
        displayOrder: field.displayOrder ?? prev.displayOrder,
        operators:
          field.operators?.length > 0 ? field.operators : prev.operators,
      });
    } else {
      fieldMap.set(field.id, { ...field });
    }
  }

  return [
    ...without,
    {
      ...existing,
      name: next.name || existing.name,
      code: next.code || existing.code,
      sourceType: next.sourceType || existing.sourceType,
      fields: Array.from(fieldMap.values()).sort(
        (a, b) => a.displayOrder - b.displayOrder,
      ),
    },
  ];
}

export default function OfferTrackingStep({
  trackingSources = [],
  onTrackingSourcesChange,
}: OfferTrackingStepProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(
    trackingSources.length > 0 ? trackingSources[0].id : null,
  );
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [editingRule, setEditingRule] = useState<OfferTrackingRule | null>(
    null,
  );
  const [ruleModalError, setRuleModalError] = useState("");
  /** Active engine attribution catalog from GET /tracking-sources */
  const [engineSources, setEngineSources] = useState<EngineTrackingSource[]>(
    [],
  );
  /** Sources → Fields → Operators from GET /tracking-sources/selector-config */
  const [selectorTree, setSelectorTree] = useState<TrackingSelectorSource[]>(
    [],
  );
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [sourceActionError, setSourceActionError] = useState("");
  const [sourceSearch, setSourceSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("all");
  const [pendingEngineIds, setPendingEngineIds] = useState<string[]>([]);
  const [enrichedEngineIds, setEnrichedEngineIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [enrichingEngineIds, setEnrichingEngineIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [loadingRuleParams, setLoadingRuleParams] = useState(false);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const getEngineFields = (engineId: number | undefined): TrackingSelectorField[] => {
    if (engineId == null) return [];
    return engineTrackingSourceService.getFieldsForSource(selectorTree, engineId);
  };

  const fieldCountForEngine = (engineId: number): number => {
    const fromTree = getEngineFields(engineId).length;
    if (fromTree > 0) return fromTree;
    const fromList = engineSources.find((s) => s.id === engineId);
    return (fromList?.fields || []).filter((f) => f.isActive !== false).length;
  };

  const markEngineEnriched = (engineId: number) => {
    setEnrichedEngineIds((prev) => {
      if (prev.has(engineId)) return prev;
      const next = new Set(prev);
      next.add(engineId);
      return next;
    });
  };

  const enrichEngineSource = async (
    engineId: number,
    options?: { force?: boolean },
  ): Promise<TrackingSelectorField[]> => {
    const existing = getEngineFields(engineId);
    if (existing.length > 0 && !options?.force) {
      markEngineEnriched(engineId);
      return existing;
    }
    if (enrichedEngineIds.has(engineId) && !options?.force) {
      return getEngineFields(engineId);
    }
    if (enrichingEngineIds.has(engineId) && !options?.force) {
      return existing;
    }

    setEnrichingEngineIds((prev) => new Set(prev).add(engineId));
    try {
      const detail = await engineTrackingSourceService.getSelectorSourceById(
        engineId,
      );
      setSelectorTree((prev) => upsertSelectorSource(prev, detail));
      setEngineSources((prev) => {
        const idx = prev.findIndex((s) => s.id === engineId);
        if (idx < 0) return prev;
        const current = prev[idx];
        if (current.fields?.length) return prev;
        const next = [...prev];
        next[idx] = {
          ...current,
          fields: detail.fields.map((f) => ({
            id: f.id,
            trackingSourceId: engineId,
            fieldName: f.fieldName,
            fieldKey: f.fieldKey,
            dataType: f.dataType,
            isRequired: false,
            isPrimaryKey: false,
            isAmountField: false,
            isRevenueField: false,
            isProductField: false,
            displayOrder: f.displayOrder,
            isActive: true,
          })),
        };
        return next;
      });
      markEngineEnriched(engineId);
      return detail.fields;
    } catch {
      markEngineEnriched(engineId);
      return getEngineFields(engineId);
    } finally {
      setEnrichingEngineIds((prev) => {
        const next = new Set(prev);
        next.delete(engineId);
        return next;
      });
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingCatalog(true);
      setCatalogError("");
      try {
        const [engines, selector] = await Promise.all([
          engineTrackingSourceService.getAll({ is_active: true, limit: 500 }),
          engineTrackingSourceService.getSelectorConfig(),
        ]);
        if (cancelled) return;

        const mergedTree = mergeSourcesIntoSelectorTree(selector, engines);
        setEngineSources(engines);
        setSelectorTree(mergedTree);
      } catch {
        if (!cancelled) {
          setEngineSources([]);
          setSelectorTree([]);
          setCatalogError(
            "Could not load tracking sources from /tracking-sources. Check that the API is available.",
          );
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

  const usedEngineIds = useMemo(() => {
    return new Set(
      trackingSources
        .map((s) => s.engine_tracking_source_id)
        .filter((id) => id != null)
        .map(String),
    );
  }, [trackingSources]);

  const availableEngineSources = useMemo(() => {
    return engineSources.filter((s) => !usedEngineIds.has(String(s.id)));
  }, [engineSources, usedEngineIds]);

  /** When the picker opens, backfill real field counts for sources still missing params */
  useEffect(() => {
    if (!showSourceModal || loadingCatalog) return;
    let cancelled = false;

    const missingIds = availableEngineSources
      .filter((engine) => fieldCountForEngine(engine.id) === 0)
      .filter((engine) => !enrichedEngineIds.has(engine.id))
      .filter((engine) => !enrichingEngineIds.has(engine.id))
      .map((engine) => engine.id);

    if (missingIds.length === 0) return;

    (async () => {
      setEnrichingEngineIds((prev) => {
        const next = new Set(prev);
        for (const id of missingIds) next.add(id);
        return next;
      });

      const details = await Promise.all(
        missingIds.map(async (id) => {
          try {
            return await engineTrackingSourceService.getSelectorSourceById(id);
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;

      setSelectorTree((prev) => {
        let next = prev;
        for (const detail of details) {
          if (detail?.fields?.length) {
            next = upsertSelectorSource(next, detail);
          }
        }
        return next;
      });
      setEngineSources((prev) =>
        prev.map((engine) => {
          const detail = details.find((d) => d?.id === engine.id);
          if (!detail?.fields?.length || engine.fields?.length) return engine;
          return {
            ...engine,
            fields: detail.fields.map((f) => ({
              id: f.id,
              trackingSourceId: engine.id,
              fieldName: f.fieldName,
              fieldKey: f.fieldKey,
              dataType: f.dataType,
              isRequired: false,
              isPrimaryKey: false,
              isAmountField: false,
              isRevenueField: false,
              isProductField: false,
              displayOrder: f.displayOrder,
              isActive: true,
            })),
          };
        }),
      );
      setEnrichedEngineIds((prev) => {
        const next = new Set(prev);
        for (const id of missingIds) next.add(id);
        return next;
      });
      setEnrichingEngineIds((prev) => {
        const next = new Set(prev);
        for (const id of missingIds) next.delete(id);
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSourceModal, loadingCatalog, availableEngineSources]);

  const filteredModalSources = useMemo(() => {
    const q = sourceSearch.trim().toLowerCase();
    return availableEngineSources.filter((s) => {
      if (
        sourceTypeFilter !== "all" &&
        String(s.sourceType) !== sourceTypeFilter
      ) {
        return false;
      }
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        String(s.sourceType).toLowerCase().includes(q) ||
        (s.description || "").toLowerCase().includes(q)
      );
    });
  }, [availableEngineSources, sourceSearch, sourceTypeFilter]);

  const typeFilterOptions = useMemo(() => {
    const types = new Set(
      availableEngineSources.map((s) => String(s.sourceType)).filter(Boolean),
    );
    return [
      { value: "all", label: "All Types" },
      ...ENGINE_TRACKING_SOURCE_TYPE_OPTIONS.filter((t) => types.has(t.value)),
      ...[...types]
        .filter(
          (t) => !ENGINE_TRACKING_SOURCE_TYPE_OPTIONS.some((o) => o.value === t),
        )
        .map((t) => ({ value: t, label: t })),
    ];
  }, [availableEngineSources]);

  /** Dropdown: current engine link + unused engine sources */
  const trackingSourceSelectOptions = useMemo(() => {
    if (!selectedSource) return [];
    const current = trackingSources.find((s) => s.id === selectedSource);
    const options = availableEngineSources.map((s) => ({
      value: String(s.id),
      label: `${s.name} (${s.code})`,
    }));
    if (current?.engine_tracking_source_id != null) {
      const id = String(current.engine_tracking_source_id);
      if (!options.some((o) => o.value === id)) {
        const linked = engineSources.find((s) => String(s.id) === id);
        options.unshift({
          value: id,
          label: linked
            ? `${linked.name} (${linked.code})`
            : current.name || `Source #${id}`,
        });
      }
    }
    return options;
  }, [selectedSource, trackingSources, availableEngineSources, engineSources]);

  const selectedSourceData = trackingSources.find(
    (s) => s.id === selectedSource,
  );

  const trackingPriorityOptions = useMemo(
    () =>
      editingRule
        ? getAvailablePrioritySelectOptions(
            selectedSourceData?.rules || [],
            editingRule.id,
            editingRule.priority,
          )
        : [],
    [editingRule, selectedSourceData?.rules],
  );

  const selectedEngineFields = useMemo(
    () => getEngineFields(selectedSourceData?.engine_tracking_source_id),
    [selectedSourceData?.engine_tracking_source_id, selectorTree],
  );

  // Enrich selected source fields/operators when selector-config is sparse
  useEffect(() => {
    const engineId = selectedSourceData?.engine_tracking_source_id;
    if (engineId == null) return;
    if (getEngineFields(engineId).length > 0) {
      markEngineEnriched(engineId);
      return;
    }
    if (enrichedEngineIds.has(engineId) || enrichingEngineIds.has(engineId)) {
      return;
    }
    void enrichEngineSource(engineId);
    // Intentionally keyed off selection + tree completeness only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSourceData?.engine_tracking_source_id,
    selectorTree,
    enrichedEngineIds,
    enrichingEngineIds,
  ]);

  const parameterOptionsForSelected = useMemo(() => {
    if (!selectedSourceData) return [];
    const opts = selectedEngineFields.map((f) => ({
      value: f.fieldKey,
      label:
        f.fieldName || formatTrackingKeyLabel(f.fieldKey, PARAMETER_LABELS),
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
  }, [selectedSourceData, selectedEngineFields, editingRule?.parameter]);

  const conditionOptionsForParameter = useMemo(() => {
    const param = editingRule?.parameter || "";
    const field = selectedEngineFields.find((f) => f.fieldKey === param);
    return conditionsForEngineField(field, param);
  }, [selectedEngineFields, editingRule?.parameter]);

  const editingParameterType: TrackingParameterValueType = useMemo(() => {
    const param = editingRule?.parameter || "";
    const field = selectedEngineFields.find((f) => f.fieldKey === param);
    if (field?.dataType) return dataTypeToValueType(field.dataType);
    return getParameterValueType(param);
  }, [editingRule?.parameter, selectedEngineFields]);

  const editingOperator = useMemo(() => {
    if (!editingRule) return undefined;
    const field = selectedEngineFields.find(
      (f) => f.fieldKey === editingRule.parameter,
    );
    return findFieldOperator(field, editingRule.condition);
  }, [editingRule, selectedEngineFields]);

  const editingNeedsListValue =
    (editingOperator
      ? trackingOperatorIsList(editingOperator)
      : isListCondition(editingRule?.condition || "")) ||
    editingRule?.condition === "is_any_of";

  const editingNeedsRangeValue = editingOperator
    ? trackingOperatorRequiresTwoValues(editingOperator)
    : isBetweenCondition(editingRule?.condition || "");

  const editingNeedsValue = editingOperator
    ? editingOperator.requiresValue !== false
    : true;

  const applyParameterChange = (nextParameter: string) => {
    if (!editingRule) return;
    const prevField = selectedEngineFields.find(
      (f) => f.fieldKey === editingRule.parameter,
    );
    const nextField = selectedEngineFields.find(
      (f) => f.fieldKey === nextParameter,
    );
    const prevType = prevField
      ? dataTypeToValueType(prevField.dataType)
      : getParameterValueType(editingRule.parameter);
    const nextType = nextField
      ? dataTypeToValueType(nextField.dataType)
      : getParameterValueType(nextParameter);

    const nextConditions = conditionsForEngineField(nextField, nextParameter);
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

  const isEngineIdInUse = (
    engineId: string,
    exceptInstanceId?: string,
  ): boolean => {
    return trackingSources.some(
      (s) =>
        s.engine_tracking_source_id != null &&
        String(s.engine_tracking_source_id) === String(engineId) &&
        s.id !== exceptInstanceId,
    );
  };

  const mapEngineToOfferSource = (
    engine: EngineTrackingSource,
    options?: {
      targetInstanceId?: string;
      existingRules?: OfferTrackingRule[];
      isDefault?: boolean;
    },
  ): OfferTrackingSource => ({
    id: options?.targetInstanceId || generateId(),
    name: engine.name,
    type: String(engine.sourceType),
    code: engine.code,
    enabled: true,
    rules: options?.existingRules ?? [],
    engine_tracking_source_id: engine.id,
    is_default: options?.isDefault === true,
  });

  const applyEngineSource = (
    engineId: string,
    targetInstanceId?: string,
  ) => {
    const engine = engineSources.find((s) => String(s.id) === engineId);
    if (!engine) return;

    if (isEngineIdInUse(engineId, targetInstanceId)) {
      setSourceActionError(
        `"${engine.name}" is already added. Each tracking source can only be used once.`,
      );
      return;
    }

    setSourceActionError("");
    const existing = targetInstanceId
      ? trackingSources.find((s) => s.id === targetInstanceId)
      : undefined;

    const mapped = mapEngineToOfferSource(engine, {
      targetInstanceId,
      existingRules: existing?.rules || [],
      isDefault: existing?.is_default === true,
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
    setPendingEngineIds([]);
    setShowSourceModal(true);
  };

  const togglePendingEngine = (engineId: string) => {
    setPendingEngineIds((prev) =>
      prev.includes(engineId)
        ? prev.filter((id) => id !== engineId)
        : [...prev, engineId],
    );
  };

  const confirmPendingEngineSources = () => {
    if (pendingEngineIds.length === 0) return;

    const toAdd = pendingEngineIds
      .map((id) => engineSources.find((s) => String(s.id) === id))
      .filter((s): s is EngineTrackingSource => Boolean(s))
      .filter((s) => !isEngineIdInUse(String(s.id)));

    if (toAdd.length === 0) {
      setSourceActionError(
        "Selected tracking sources are already on this offer.",
      );
      return;
    }

    const hasDefault = trackingSources.some((s) => s.is_default);
    let nextSources = [...trackingSources];
    let firstNewId: string | null = null;

    toAdd.forEach((engine, index) => {
      const makeDefault = !hasDefault && index === 0;
      const mapped = mapEngineToOfferSource(engine, {
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
    setPendingEngineIds([]);
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

  const addRule = async () => {
    if (selectedSourceData?.engine_tracking_source_id == null) {
      setSourceActionError(
        "Select an engine tracking source before adding rules.",
      );
      return;
    }

    const engineId = selectedSourceData.engine_tracking_source_id;
    setLoadingRuleParams(true);
    setSourceActionError("");
    try {
      let fields = getEngineFields(engineId);
      if (fields.length === 0) {
        fields = await enrichEngineSource(engineId, { force: true });
      } else {
        // Refresh once so nested operators from detail/selector are available
        const hasOperators = fields.some((f) => f.operators?.length);
        if (!hasOperators && !enrichedEngineIds.has(engineId)) {
          fields = await enrichEngineSource(engineId, { force: true });
        }
      }

      const defaultParam = fields[0]?.fieldKey || "";
      if (!defaultParam) {
        setSourceActionError(
          "This tracking source has no fields/parameters yet. Add fields under Configuration → Tracking Sources.",
        );
        return;
      }

      const nextPriority = getNextAvailableTrackingRulePriority(
        selectedSourceData?.rules || [],
      );
      if (nextPriority == null) {
        setSourceActionError(
          `This source already has rules for every priority (${TRACKING_RULE_PRIORITY_MIN}–${TRACKING_RULE_PRIORITY_MAX}). Remove or change an existing rule first.`,
        );
        return;
      }

      const defaultField = fields.find((f) => f.fieldKey === defaultParam);
      const defaultConditions = conditionsForEngineField(
        defaultField,
        defaultParam,
      );
      const defaultCondition =
        defaultConditions[0]?.value ||
        getDefaultConditionForParameter(defaultParam);

      setEditingRule({
        id: generateId(),
        name: "New Rule",
        priority: nextPriority,
        parameter: defaultParam,
        condition: defaultCondition as OfferTrackingRule["condition"],
        value: "",
        enabled: true,
      });
      setRuleModalError("");
      setShowRuleModal(true);
    } finally {
      setLoadingRuleParams(false);
    }
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
    const engineFields = getEngineFields(source.engine_tracking_source_id);
    const engineField =
      engineFields.find((f) => f.fieldKey === parameter) ||
      engineFields.find(
        (f) => normalizeParameterKey(f.fieldKey) === parameter,
      );
    const valueType = engineField?.dataType
      ? dataTypeToValueType(engineField.dataType)
      : getParameterValueType(parameter);
    const allowedConditions = conditionsForEngineField(engineField, parameter);
    const condition = allowedConditions.some((c) => c.value === rule.condition)
      ? rule.condition
      : ((allowedConditions[0]?.value as OfferTrackingRule["condition"]) ||
        getDefaultConditionForParameter(parameter));

    const op = findFieldOperator(engineField, condition);
    const isList = op
      ? trackingOperatorIsList(op)
      : isListCondition(condition);
    const isBetween = op
      ? trackingOperatorRequiresTwoValues(op)
      : isBetweenCondition(condition);

    const serializedValue =
      op?.requiresValue === false
        ? ""
        : isList || isBetween
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
      valueType,
      {
        requiresValue: op?.requiresValue,
        requiresTwoValues:
          op != null ? trackingOperatorRequiresTwoValues(op) : undefined,
      },
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

  const openEditRule = async (rule: OfferTrackingRule) => {
    const engineId = selectedSourceData?.engine_tracking_source_id;
    if (engineId != null && getEngineFields(engineId).length === 0) {
      setLoadingRuleParams(true);
      try {
        await enrichEngineSource(engineId, { force: true });
      } finally {
        setLoadingRuleParams(false);
      }
    }
    setEditingRule({
      ...rule,
      parameter: normalizeParameterKey(rule.parameter) || rule.parameter,
    });
    setRuleModalError("");
    setShowRuleModal(true);
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
          {!loadingCatalog && availableEngineSources.length === 0 ? (
            <p className={`mt-3 text-xs ${tw.textSecondary}`}>
              No active tracking sources available. Create one under
              Configuration → Tracking Sources.
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
                    Each engine tracking source can only be added once per
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
                        selectedSourceData.engine_tracking_source_id != null
                          ? String(selectedSourceData.engine_tracking_source_id)
                          : ""
                      }
                      onChange={(value) => {
                        if (value) {
                          applyEngineSource(
                            String(value),
                            selectedSourceData.id,
                          );
                        }
                      }}
                      placeholder={
                        trackingSourceSelectOptions.length === 0
                          ? "No tracking sources available"
                          : "Select tracking source..."
                      }
                      disabled={trackingSourceSelectOptions.length === 0}
                      className="w-full text-sm"
                    />
                    {sourceActionError ? (
                      <p className="mt-1 text-xs text-red-600">
                        {sourceActionError}
                      </p>
                    ) : selectedSourceData.engine_tracking_source_id != null ? (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        {selectedSourceData.code
                          ? `${selectedSourceData.code} · `
                          : ""}
                        {selectedEngineFields.length} parameter
                        {selectedEngineFields.length !== 1 ? "s" : ""} from
                        engine catalog
                      </p>
                    ) : (
                      <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                        Link this instance to an engine tracking source to
                        configure rules from its fields.
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
                        onClick={() => void addRule()}
                        disabled={
                          selectedSourceData.engine_tracking_source_id == null ||
                          loadingRuleParams
                        }
                        className={`inline-flex items-center shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium text-white ${tw.rounded} hover:opacity-90 transition-all disabled:opacity-50`}
                        style={{ backgroundColor: color.primary.action }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {loadingRuleParams ? "Loading…" : "Add Rule"}
                      </button>
                    </div>

                    {selectedSourceData.rules.length === 0 ? (
                      <div
                        className={`text-center py-8 border-2 border-dashed border-gray-200 ${tw.rounded}`}
                      >
                        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm mb-1">
                          {selectedSourceData.engine_tracking_source_id == null
                            ? "Select a tracking source before adding rules"
                            : "No rules configured — optional"}
                        </p>
                        {selectedSourceData.engine_tracking_source_id != null ? (
                          <>
                            <p className={`text-xs mb-4 ${tw.textSecondary}`}>
                              You can continue without rules. Fulfilment will
                              use this source as-is; add rules only when you need
                              parameter conditions.
                            </p>
                            <button
                              type="button"
                              onClick={() => void addRule()}
                              disabled={loadingRuleParams}
                              className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} disabled:opacity-50`}
                              style={{ backgroundColor: color.primary.action }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              {loadingRuleParams ? "Loading…" : "Add Rule"}
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
                                  onClick={() => void openEditRule(rule)}
                                  disabled={loadingRuleParams}
                                  className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
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
                              {conditionDisplayLabel(
                                rule.condition,
                                selectedEngineFields.find(
                                  (f) => f.fieldKey === rule.parameter,
                                ),
                              ).toLowerCase()}{" "}
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
              <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-200 flex-shrink-0">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Select Tracking Sources
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Choose engine attribution sources for this offer. Parameters
                    come from each source&apos;s fields. Each source can only be
                    added once.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSourceModal(false);
                    setPendingEngineIds([]);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
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

              {pendingEngineIds.length > 0 ? (
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
                        {pendingEngineIds.length} source
                        {pendingEngineIds.length !== 1 ? "s" : ""} selected
                      </span>
                      <button
                        type="button"
                        onClick={() => setPendingEngineIds([])}
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
                      {availableEngineSources.length === 0
                        ? "No unused tracking sources available. Create one under Configuration → Tracking Sources, or remove a source from this offer."
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
                          const checked = pendingEngineIds.includes(id);
                          return (
                            <tr
                              key={id}
                              className={`cursor-pointer hover:bg-gray-50 ${
                                checked ? "bg-gray-50" : ""
                              }`}
                              onClick={() => togglePendingEngine(id)}
                            >
                              <td className="px-4 py-3">
                                <div
                                  className="flex items-center"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    id={`engine-source-${id}`}
                                    checked={checked}
                                    onChange={() => togglePendingEngine(id)}
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
                                  <div>
                                    <div>{source.name}</div>
                                    <div className="text-xs text-gray-400 font-mono">
                                      {source.code}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {trackingTypeLabel(String(source.sourceType))}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {enrichingEngineIds.has(source.id) &&
                                fieldCountForEngine(source.id) === 0
                                  ? "…"
                                  : fieldCountForEngine(source.id)}
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
                  {pendingEngineIds.length} of {filteredModalSources.length}{" "}
                  shown source
                  {filteredModalSources.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSourceModal(false);
                      setPendingEngineIds([]);
                    }}
                    className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmPendingEngineSources}
                    disabled={pendingEngineIds.length === 0}
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
                  <HeadlessSelect
                    label="Priority"
                    options={trackingPriorityOptions}
                    value={
                      Number.isInteger(editingRule.priority)
                        ? String(editingRule.priority)
                        : ""
                    }
                    onChange={(value) => {
                      const parsed = parseInt(String(value), 10);
                      if (!Number.isFinite(parsed)) return;
                      setEditingRule({
                        ...editingRule,
                        priority: parsed,
                      });
                    }}
                    placeholder={
                      trackingPriorityOptions.length === 0
                        ? "No priorities available"
                        : "Select priority"
                    }
                    error={Boolean(
                      validateTrackingRulePriority(
                        editingRule.priority,
                        selectedSourceData.rules || [],
                        editingRule.id,
                      ),
                    )}
                    disabled={trackingPriorityOptions.length === 0}
                    className="w-full text-sm"
                    zIndex={zIndex.popover}
                  />
                  <p className={`mt-1 text-xs ${tw.textSecondary}`}>
                    Must be unique on this source (
                    {TRACKING_RULE_PRIORITY_MIN}–{TRACKING_RULE_PRIORITY_MAX}).
                    Taken priorities are omitted. Lower priority is evaluated
                    first.
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

                {!editingNeedsValue ? (
                  <p className={`text-xs ${tw.textMuted}`}>
                    This operator does not require a comparison value.
                  </p>
                ) : editingNeedsListValue ? (
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
                ) : editingNeedsRangeValue ? (
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="From"
                      type={
                        editingParameterType === "number" ? "number" : "text"
                      }
                      placeholder="Min"
                      value={splitTrackingRangeValue(editingRule.value)[0]}
                      onChange={(value) => {
                        const [, to] = splitTrackingRangeValue(
                          editingRule.value,
                        );
                        setEditingRule({
                          ...editingRule,
                          value: joinTrackingRangeValue(String(value), to),
                        });
                      }}
                    />
                    <Input
                      label="To"
                      type={
                        editingParameterType === "number" ? "number" : "text"
                      }
                      placeholder="Max"
                      value={splitTrackingRangeValue(editingRule.value)[1]}
                      onChange={(value) => {
                        const [from] = splitTrackingRangeValue(
                          editingRule.value,
                        );
                        setEditingRule({
                          ...editingRule,
                          value: joinTrackingRangeValue(from, String(value)),
                        });
                      }}
                    />
                  </div>
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
                {editingNeedsListValue ? (
                  <p className="text-xs text-gray-500 -mt-2">
                    Comma-separated list (IN / NOT IN).
                  </p>
                ) : editingNeedsRangeValue ? (
                  <p className="text-xs text-gray-500 -mt-2">
                    BETWEEN requires both bounds.
                  </p>
                ) : editingParameterType === "datetime" ||
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
