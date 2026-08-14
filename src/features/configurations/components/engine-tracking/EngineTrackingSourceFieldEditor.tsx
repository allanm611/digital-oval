import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw } from "../../../../shared/utils/utils";
import {
  ENGINE_FIELD_DATA_TYPE_OPTIONS,
  ENGINE_OPERATOR_CATALOG,
  operatorAppliesToDataType,
  trackingOperatorLabel,
} from "../../types/engineTrackingSource";
import type {
  EngineFieldDataType,
  TrackingSelectorOperator,
} from "../../types/engineTrackingSource";
import {
  deriveFieldKey,
  emptyDraftField,
  type EngineTrackingDraftField,
} from "./engineTrackingFieldUtils";
import SelectOperatorsModal from "./SelectOperatorsModal";

const FLAG_OPTIONS = [
  ["isRequired", "Required"],
  ["isPrimaryKey", "Primary key"],
  ["isAmountField", "Amount field"],
  ["isRevenueField", "Revenue field"],
  ["isProductField", "Product field"],
] as const;

interface EngineTrackingSourceFieldEditorProps {
  title?: string;
  description?: string;
  fields: EngineTrackingDraftField[];
  errors?: Record<string, string>;
  disabled?: boolean;
  operatorCatalog?: TrackingSelectorOperator[];
  onChange: (fields: EngineTrackingDraftField[]) => void;
}

export default function EngineTrackingSourceFieldEditor({
  title = "Fields",
  description = "Fields power the tracking rule selector when this source is used on an offer. Operators nested on a field become the conditions offered in offer rules.",
  fields,
  errors = {},
  disabled = false,
  operatorCatalog = ENGINE_OPERATOR_CATALOG,
  onChange,
}: EngineTrackingSourceFieldEditorProps) {
  const [operatorModalFieldKey, setOperatorModalFieldKey] = useState<
    string | null
  >(null);
  const showLifecycle = fields.some((f) => f.existingId != null);
  const catalog = operatorCatalog.length
    ? operatorCatalog
    : ENGINE_OPERATOR_CATALOG;
  const operatorModalField = fields.find(
    (f) => f.key === operatorModalFieldKey,
  );

  const updateField = (
    key: string,
    patch: Partial<EngineTrackingDraftField>,
  ) => {
    onChange(fields.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  };

  const handleNameChange = (field: EngineTrackingDraftField, value: string) => {
    const patch: Partial<EngineTrackingDraftField> = { fieldName: value };
    if (
      field.existingId == null &&
      (!field.fieldKey || field.fieldKey === deriveFieldKey(field.fieldName))
    ) {
      patch.fieldKey = deriveFieldKey(value);
    }
    updateField(field.key, patch);
  };

  const replaceOperators = (
    field: EngineTrackingDraftField,
    operators: TrackingSelectorOperator[],
  ) => {
    updateField(field.key, { operators });
  };

  const removeOperator = (
    field: EngineTrackingDraftField,
    operatorId: number,
  ) => {
    updateField(field.key, {
      operators: field.operators.filter((op) => op.id !== operatorId),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-sm font-semibold ${tw.textPrimary}`}>{title}</h2>
          <p className={`text-xs ${tw.textSecondary} mt-1`}>{description}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange([...fields, emptyDraftField(fields.length)])
          }
          disabled={disabled}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          <Plus className="w-4 h-4" />
          Add field
        </button>
      </div>

      {errors.fields ? (
        <p className="text-red-500 text-xs">{errors.fields}</p>
      ) : null}

      {fields.length === 0 ? (
        <p className={`text-sm ${tw.textMuted}`}>
          No fields yet. Add at least one field so offer rules can select
          attributes from this source.
        </p>
      ) : (
        fields.map((field, index) => {
          const prefix = `fields_${index}`;

          return (
            <div
              key={field.key}
              className={`border border-gray-200 ${tw.rounded} p-4 space-y-3`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${tw.textPrimary}`}>
                    {field.fieldName.trim() || `Field ${index + 1}`}
                  </span>
                  {showLifecycle ? (
                    <span className={`text-[11px] ${tw.textMuted}`}>
                      {field.existingId != null ? "Saved" : "New"}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onChange(fields.filter((f) => f.key !== field.key))
                  }
                  disabled={disabled}
                  className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                  title={
                    field.existingId != null
                      ? "Deactivate field on save"
                      : "Remove field"
                  }
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Input
                    label="Field name *"
                    value={field.fieldName}
                    onChange={(v) => handleNameChange(field, String(v))}
                    placeholder="Recharge Amount"
                    disabled={disabled}
                    hasError={!!errors[`${prefix}_fieldName`]}
                  />
                  {errors[`${prefix}_fieldName`] ? (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`${prefix}_fieldName`]}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Input
                    label="Field key *"
                    value={field.fieldKey}
                    onChange={(v) =>
                      updateField(field.key, {
                        fieldKey: String(v).toLowerCase(),
                      })
                    }
                    placeholder="amount"
                    disabled={disabled || field.existingId != null}
                    hasError={!!errors[`${prefix}_fieldKey`]}
                  />
                  {errors[`${prefix}_fieldKey`] ? (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`${prefix}_fieldKey`]}
                    </p>
                  ) : (
                    <p className={`text-xs mt-1 ${tw.textMuted}`}>
                      {field.existingId != null
                        ? "Field key cannot be changed after creation"
                        : "Snake_case key used in rule selectors"}
                    </p>
                  )}
                </div>
                <HeadlessSelect
                  label="Data type"
                  value={field.dataType}
                  onChange={(v) =>
                    updateField(field.key, {
                      dataType: v as EngineFieldDataType,
                    })
                  }
                  options={ENGINE_FIELD_DATA_TYPE_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  }))}
                  disabled={disabled}
                />
              </div>

              <Textarea
                label="Description"
                value={field.description}
                onChange={(v) =>
                  updateField(field.key, { description: String(v) })
                }
                rows={2}
                placeholder="Optional helper text for this field"
                disabled={disabled}
              />

              <div className="flex flex-wrap gap-4">
                {FLAG_OPTIONS.map(([prop, label]) => (
                  <label
                    key={prop}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      id={`${field.key}-${prop}`}
                      checked={field[prop]}
                      onChange={(e) =>
                        updateField(field.key, { [prop]: e.target.checked })
                      }
                      disabled={disabled}
                    />
                    <span className={`text-sm ${tw.textPrimary}`}>{label}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className={`text-sm font-medium ${tw.textPrimary}`}>
                      Operators
                    </h3>
                    <p className={`text-xs ${tw.textMuted} mt-0.5`}>
                      Comparison operators used in offer rules. Recommended
                      operators match this field&apos;s data type; the full
                      catalog stays available.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOperatorModalFieldKey(field.key)}
                    disabled={disabled}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-60 shrink-0"
                    style={{ backgroundColor: color.primary.action }}
                  >
                    <Plus className="w-4 h-4" />
                    Add operator
                  </button>
                </div>

                {field.operators?.length ? (
                  <div className="space-y-2">
                    {field.operators.map((op) => (
                      <div
                        key={op.id}
                        className="flex items-center justify-between gap-3 border border-gray-200 rounded px-3 py-2 bg-gray-50/60"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono text-sm ${tw.textPrimary}`}
                            >
                              {op.symbol || op.code}
                            </span>
                            <span className={`text-sm ${tw.textSecondary}`}>
                              {trackingOperatorLabel(op)}
                            </span>
                            {!operatorAppliesToDataType(
                              op,
                              field.dataType,
                            ) ? (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                                Other type
                              </span>
                            ) : null}
                          </div>
                          <p className={`text-[11px] ${tw.textMuted} mt-0.5`}>
                            {op.requiresTwoValues
                              ? "Requires two values (BETWEEN)"
                              : op.requiresValue === false
                                ? "No comparison value"
                                : "Requires a value"}
                            {op.applicableFieldTypes?.length
                              ? ` · ${op.applicableFieldTypes.join(", ")}`
                              : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeOperator(field, op.id)}
                          disabled={disabled}
                          className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                          title="Remove operator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs ${tw.textMuted}`}>
                    No operators yet. Add at least one so offer rules do not
                    fall back to type defaults.
                  </p>
                )}

              </div>
            </div>
          );
        })
      )}

      <SelectOperatorsModal
        open={!!operatorModalField}
        fieldName={operatorModalField?.fieldName}
        dataType={operatorModalField?.dataType}
        catalog={catalog}
        selectedIds={(operatorModalField?.operators || []).map((op) => op.id)}
        onClose={() => setOperatorModalFieldKey(null)}
        onConfirm={(operators) => {
          if (operatorModalField) {
            replaceOperators(operatorModalField, operators);
          }
        }}
      />
    </div>
  );
}
