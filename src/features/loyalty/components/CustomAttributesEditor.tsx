import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { tw } from "../../../shared/utils/utils";
import LoyaltyAddButton from "./LoyaltyAddButton";
import type {
  AttributeConditionOperator,
  AttributeFieldOption,
  AttributeSourceType,
} from "../types/loyaltyProgram";
import { validateCombinationFormula } from "../utils/formulaValidation";
import { formatSourceType } from "../utils/loyaltyProgramMapper";
import {
  createEmptyAttribute,
  createEmptyOperand,
  nextOperandKey,
  type AttributeDraft,
} from "../utils/loyaltyProgramForm";

const SOURCE_OPTIONS: Array<{ value: AttributeSourceType; label: string }> = [
  { value: "numeric_profile", label: "Numeric profile" },
  { value: "usage_metric", label: "Usage metric" },
  { value: "static_field", label: "Static field" },
];

const CONDITION_OPTIONS: Array<{
  value: AttributeConditionOperator;
  label: string;
}> = [
  { value: "greater_than", label: "Greater than" },
  { value: "greater_than_or_equal", label: "Greater than or equal to" },
  { value: "less_than", label: "Less than" },
  { value: "less_than_or_equal", label: "Less than or equal to" },
  { value: "equals", label: "Equals" },
  { value: "between", label: "Between" },
];

const deleteIconClass =
  "inline-flex shrink-0 items-center justify-center rounded text-gray-400 transition-colors hover:bg-red-50 hover:text-red-400 disabled:opacity-40";

export function attributeFieldOptions(
  sources: AttributeFieldOption[],
  attributes: AttributeDraft[],
): AttributeFieldOption[] {
  const byId = new Map(sources.map((source) => [source.id, source]));
  attributes.forEach((attribute) => {
    attribute.operands.forEach((operand) => {
      if (operand.fieldId && !byId.has(operand.fieldId)) {
        byId.set(operand.fieldId, {
          id: operand.fieldId,
          numericId: Number(operand.fieldId) || null,
          name: operand.fieldName || "Saved field",
          fieldValue: operand.fieldValue,
          sourceType: operand.sourceType,
        });
      }
    });
  });
  return [...byId.values()];
}

export function AddCustomAttributeButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <LoyaltyAddButton
      label="Add custom attribute"
      disabled={disabled}
      onClick={onClick}
    />
  );
}

interface CustomAttributesEditorProps {
  attributes: AttributeDraft[];
  sources: AttributeFieldOption[];
  sourcesLoading: boolean;
  sourcesError: string | null;
  sourcesNote?: string | null;
  errors: string[];
  disabled?: boolean;
  onChange: (attributes: AttributeDraft[]) => void;
}

export default function CustomAttributesEditor({
  attributes,
  sources,
  sourcesLoading,
  sourcesError,
  sourcesNote = null,
  errors,
  disabled = false,
  onChange,
}: CustomAttributesEditorProps) {
  const options = useMemo(
    () => attributeFieldOptions(sources, attributes),
    [attributes, sources],
  );

  const canAdd = !disabled && !sourcesLoading && !sourcesError && options.length > 0;

  const updateAttribute = (
    clientId: string,
    patch: Partial<AttributeDraft>,
  ) => {
    onChange(
      attributes.map((attribute) =>
        attribute.clientId === clientId ? { ...attribute, ...patch } : attribute,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <p className={`text-sm ${tw.textSecondary}`}>
        Combine numeric profile, usage metric, or static fields into a formula
        for this program only. K1 and K2 are required. Each added field becomes
        the next K attribute.
      </p>

      {sourcesLoading && (
        <p className={`text-sm ${tw.textSecondary}`}>Loading numeric fields…</p>
      )}
      {sourcesError && <p className="text-sm text-red-600">{sourcesError}</p>}
      {sourcesNote && (
        <p className={`text-sm ${tw.textSecondary}`}>{sourcesNote}</p>
      )}
      {!sourcesLoading && !sourcesError && options.length === 0 && (
        <p className={`text-sm ${tw.textSecondary}`}>
          No numeric fields are available yet. Custom attributes need numeric
          profile, usage metric, or static fields from the profile dictionary.
        </p>
      )}

      {attributes.map((attribute, index) => {
        const formula = attribute.formula.trim()
          ? validateCombinationFormula(
              attribute.formula,
              attribute.operands.map((operand) => operand.key),
            )
          : null;

        return (
          <div
            key={attribute.clientId}
            className="space-y-4 rounded-md border border-gray-200 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Custom attribute {index + 1}
              </h3>
              <button
                type="button"
                disabled={disabled}
                className={`${deleteIconClass} h-8 w-8`}
                title="Remove custom attribute"
                onClick={() =>
                  onChange(
                    attributes.filter((item) => item.clientId !== attribute.clientId),
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <Input
              label="Custom attribute name"
              value={attribute.name}
              disabled={disabled}
              onChange={(next) =>
                updateAttribute(attribute.clientId, { name: String(next) })
              }
            />

            <div className="space-y-3">
              {attribute.operands.map((operand) => {
                const fieldOptions = options
                  .filter((option) => option.sourceType === operand.sourceType)
                  .map((option) => ({ value: option.id, label: option.name }));

                return (
                  <div
                    key={operand.clientId}
                    className="grid grid-cols-1 gap-3 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
                  >
                    <div className="pb-2 text-sm font-semibold text-gray-800">
                      {operand.key}
                    </div>
                    <HeadlessSelect
                      label="Attribute type"
                      value={operand.sourceType}
                      disabled={disabled}
                      options={SOURCE_OPTIONS}
                      onChange={(next) => {
                        const sourceType = String(next) as AttributeSourceType;
                        updateAttribute(attribute.clientId, {
                          operands: attribute.operands.map((item) =>
                            item.clientId === operand.clientId
                              ? {
                                  ...item,
                                  sourceType,
                                  fieldId: "",
                                  fieldName: "",
                                  fieldValue: "",
                                }
                              : item,
                          ),
                        });
                      }}
                    />
                    <HeadlessSelect
                      label={formatSourceType(operand.sourceType)}
                      value={operand.fieldId}
                      disabled={disabled || fieldOptions.length === 0}
                      placeholder="Select a field"
                      searchable
                      options={fieldOptions}
                      onChange={(next) => {
                        const selected = options.find(
                          (option) => option.id === String(next),
                        );
                        updateAttribute(attribute.clientId, {
                          operands: attribute.operands.map((item) =>
                            item.clientId === operand.clientId
                              ? {
                                  ...item,
                                  fieldId: String(next),
                                  fieldName: selected?.name ?? item.fieldName,
                                  fieldValue: selected?.fieldValue ?? item.fieldValue,
                                }
                              : item,
                          ),
                        });
                      }}
                    />
                    <button
                      type="button"
                      className={`${deleteIconClass} h-10 w-10`}
                      disabled={disabled || attribute.operands.length <= 2}
                      title="Remove attribute"
                      onClick={() =>
                        updateAttribute(attribute.clientId, {
                          operands: attribute.operands.filter(
                            (item) => item.clientId !== operand.clientId,
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <LoyaltyAddButton
              label="Add K attribute"
              disabled={disabled}
              onClick={() =>
                updateAttribute(attribute.clientId, {
                  operands: [
                    ...attribute.operands,
                    createEmptyOperand(nextOperandKey(attribute.operands)),
                  ],
                })
              }
            />

            <div>
              <Input
                label="Combination formula"
                value={attribute.formula}
                disabled={disabled}
                placeholder="K1/K2"
                hasError={Boolean(formula && !formula.valid)}
                onChange={(next) =>
                  updateAttribute(attribute.clientId, { formula: String(next) })
                }
              />
              <p className={`mt-1 text-xs ${formula && !formula.valid ? "text-red-600" : tw.textMuted}`}>
                {formula && !formula.valid
                  ? formula.error
                  : "Example: if K1 is data contribution and K2 is total revenue, enter K1/K2."}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <HeadlessSelect
                label="Condition"
                value={attribute.operator}
                disabled={disabled}
                options={CONDITION_OPTIONS}
                onChange={(next) =>
                  updateAttribute(attribute.clientId, {
                    operator: String(next) as AttributeConditionOperator,
                  })
                }
              />
              <Input
                label={attribute.operator === "between" ? "From" : "Value"}
                type="number"
                value={attribute.value}
                disabled={disabled}
                onChange={(next) =>
                  updateAttribute(attribute.clientId, { value: String(next) })
                }
              />
              {attribute.operator === "between" && (
                <Input
                  label="To"
                  type="number"
                  value={attribute.valueTo}
                  disabled={disabled}
                  onChange={(next) =>
                    updateAttribute(attribute.clientId, { valueTo: String(next) })
                  }
                />
              )}
            </div>
          </div>
        );
      })}

      <AddCustomAttributeButton
        disabled={!canAdd}
        onClick={() => onChange([...attributes, createEmptyAttribute()])}
      />

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-red-600">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
