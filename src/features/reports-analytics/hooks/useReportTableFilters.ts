import { useCallback, useMemo, useState } from "react";
import {
  createReportFilterRule,
  defaultOperatorForType,
  isCompleteReportFilter,
  serializeReportFilters,
  type ReportFilterField,
  type ReportFilterOperator,
  type ReportFilterRule,
} from "../utils/reportTableFilters";

export function useReportTableFilters(fields: ReportFilterField[]) {
  const [rules, setRules] = useState<ReportFilterRule[]>([]);

  const fieldById = useMemo(
    () => new Map(fields.map((field) => [field.id, field])),
    [fields],
  );

  const addRule = useCallback(() => {
    const field = fields[0];
    if (!field) return;
    setRules((prev) => [...prev, createReportFilterRule(field)]);
  }, [fields]);

  const updateRule = useCallback(
    (id: string, patch: Partial<ReportFilterRule>) => {
      setRules((prev) =>
        prev.map((rule) => {
          if (rule.id !== id) return rule;
          const next = { ...rule, ...patch };
          if (patch.field && patch.field !== rule.field) {
            const field = fieldById.get(patch.field);
            next.operator = field ? defaultOperatorForType(field.type) : "";
            next.value = "";
            next.valueTo = "";
          }
          return next;
        }),
      );
    },
    [fieldById],
  );

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  }, []);

  const clearRules = useCallback(() => setRules([]), []);

  const activeRules = useMemo(
    () =>
      rules.filter((rule) =>
        isCompleteReportFilter(rule, fieldById.get(rule.field)),
      ),
    [fieldById, rules],
  );

  const serializedFilters = useMemo(
    () => serializeReportFilters(activeRules, fields),
    [activeRules, fields],
  );

  const setOperator = useCallback(
    (id: string, operator: ReportFilterOperator | "") => {
      updateRule(id, { operator, valueTo: "" });
    },
    [updateRule],
  );

  return {
    rules,
    activeRules,
    serializedFilters,
    addRule,
    updateRule,
    setOperator,
    removeRule,
    clearRules,
    hasActiveFilters: activeRules.length > 0,
  };
}

export type ReportTableFiltersState = ReturnType<typeof useReportTableFilters>;
