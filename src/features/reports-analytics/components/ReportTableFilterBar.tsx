import { Filter, Plus, X } from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import { tw } from "../../../shared/utils/utils";
import type { ReportTableFiltersState } from "../hooks/useReportTableFilters";
import {
  operatorsForFilterType,
  type ReportFilterField,
  type ReportFilterOperator,
} from "../utils/reportTableFilters";

type ReportTableFilterBarProps = {
  fields: ReportFilterField[];
  filters: ReportTableFiltersState;
};

export default function ReportTableFilterBar({
  fields,
  filters,
}: ReportTableFilterBarProps) {
  const { rules, addRule, updateRule, setOperator, removeRule, clearRules, hasActiveFilters } =
    filters;

  return (
    <div className={`${tw.rounded} space-y-3 border border-gray-200 bg-white p-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" />
          Table filters
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearRules}
              className="text-xs font-medium text-gray-500 hover:text-gray-800"
            >
              Clear all
            </button>
          ) : null}
          <button
            type="button"
            onClick={addRule}
            className={`${tw.rounded} inline-flex items-center gap-1.5 border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:border-gray-300`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add filter
          </button>
        </div>
      </div>

      {rules.length === 0 ? (
        <p className="text-xs text-gray-500">
          Add one or more rules. Name contains / does not contain, last-run dates,
          and volume thresholds all apply together.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, index) => {
            const field = fields.find((item) => item.id === rule.field) || fields[0];
            const operators = operatorsForFilterType(field.type);
            const needsValue = !["is empty", "is not empty"].includes(rule.operator);
            const needsBetween = rule.operator === "is between";
            return (
              <div
                key={rule.id}
                className="grid gap-2 md:grid-cols-[5rem_minmax(9rem,1fr)_minmax(9rem,1fr)_minmax(9rem,1.2fr)_auto] md:items-end"
              >
                <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  {index === 0 ? "Where" : "And"}
                </span>
                <HeadlessSelect
                  value={rule.field}
                  onChange={(value) =>
                    updateRule(rule.id, { field: String(value) })
                  }
                  options={fields.map((item) => ({
                    value: item.id,
                    label: item.label,
                  }))}
                  placeholder="Field"
                />
                <HeadlessSelect
                  value={rule.operator}
                  onChange={(value) =>
                    setOperator(rule.id, String(value) as ReportFilterOperator)
                  }
                  options={operators}
                  placeholder="Operator"
                />
                {needsValue ? (
                  needsBetween ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="date"
                        variant="compact"
                        value={rule.value}
                        onChange={(value) =>
                          updateRule(rule.id, { value: String(value) })
                        }
                      />
                      <Input
                        type="date"
                        variant="compact"
                        value={rule.valueTo || ""}
                        onChange={(value) =>
                          updateRule(rule.id, { valueTo: String(value) })
                        }
                      />
                    </div>
                  ) : field.type === "select" ? (
                    <HeadlessSelect
                      value={rule.value}
                      onChange={(value) =>
                        updateRule(rule.id, { value: String(value) })
                      }
                      options={field.options || []}
                      placeholder="Value"
                    />
                  ) : (
                    <Input
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      variant="compact"
                      value={rule.value}
                      placeholder={
                        field.type === "text"
                          ? "Value"
                          : field.type === "number"
                            ? "Number"
                            : undefined
                      }
                      onChange={(value) =>
                        updateRule(rule.id, { value: String(value) })
                      }
                    />
                  )
                ) : (
                  <div className={`${tw.rounded} border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400`}>
                    No value needed
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className={`${tw.rounded} p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600`}
                  aria-label="Remove filter"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
