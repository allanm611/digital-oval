import { useEffect, useRef } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import Input from "../../../../shared/components/ui/Input";
import RewardSchemaFieldControl from "./RewardSchemaFieldControl";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw } from "../../../../shared/utils/utils";
import type { RewardProviderSchemaField } from "../../types/rewardProvider";
import { isSchemaFieldEditable, patchFieldForTypeChange } from "./rewardSchemaFieldUtils";
import CommaSeparatedOptionsInput from "../CommaSeparatedOptionsInput";

const FIELD_TYPES: {
  value: RewardProviderSchemaField["type"];
  label: string;
}[] = [
  { value: "text", label: "Text" },
  { value: "password", label: "Password" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
];

interface RewardProviderFieldSchemaEditorProps {
  title: string;
  description: string;
  schemaErrorKey: string;
  fields: RewardProviderSchemaField[];
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (fields: RewardProviderSchemaField[]) => void;
}

function emptyField(): RewardProviderSchemaField {
  return {
    name: "",
    label: "",
    type: "text",
    required: false,
    is_editable: true,
    placeholder: "",
    options: [],
  };
}

function AddFieldButton({
  disabled,
  onClick,
  variant = "header",
  schemaTitle,
}: {
  disabled?: boolean;
  onClick: () => void;
  variant?: "header" | "footer";
  schemaTitle?: string;
}) {
  const isFooter = variant === "footer";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={schemaTitle ? `Add field to ${schemaTitle}` : "Add field"}
      className={
        isFooter
          ? `w-full inline-flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium border border-dashed border-gray-300 ${tw.rounded} disabled:opacity-60 hover:bg-gray-50`
          : "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-60"
      }
      style={isFooter ? undefined : { backgroundColor: color.primary.action }}
    >
      <Plus className="w-4 h-4" />
      Add field
    </button>
  );
}

export function slugifyRewardFieldName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function validateRewardFieldSchema(
  fields: RewardProviderSchemaField[],
  schemaKey: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();

  if (fields.length === 0) {
    errors[schemaKey] = "Add at least one field";
  }

  fields.forEach((field, index) => {
    const prefix = `${schemaKey}_${index}`;
    const name = field.name?.trim() || "";
    const label = field.label?.trim() || "";

    if (!name) {
      errors[`${prefix}_name`] = "Field key is required";
    } else if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      errors[`${prefix}_name`] =
        "Use lowercase letters, numbers, underscores (must start with a letter)";
    } else if (seen.has(name)) {
      errors[`${prefix}_name`] = "Field key must be unique";
    } else {
      seen.add(name);
    }

    if (!label) {
      errors[`${prefix}_label`] = "Label is required";
    }

    if (field.type === "select") {
      const options = (field.options || []).map((o) => o.trim()).filter(Boolean);
      if (options.length === 0) {
        errors[`${prefix}_options`] =
          "Select fields need at least one option (comma-separated)";
      } else if (
        field.default !== undefined &&
        field.default !== "" &&
        !options.includes(String(field.default))
      ) {
        errors[`${prefix}_default`] = "Default must be one of the select options";
      }
    }

    if (
      field.type === "number" &&
      field.default !== undefined &&
      field.default !== ""
    ) {
      const n = Number(field.default);
      if (!Number.isFinite(n)) {
        errors[`${prefix}_default`] = "Default must be a valid number";
      }
    }
  });

  return errors;
}

export default function RewardProviderFieldSchemaEditor({
  title,
  description,
  schemaErrorKey,
  fields,
  errors = {},
  disabled = false,
  onChange,
}: RewardProviderFieldSchemaEditorProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const shouldFocusNewField = useRef(false);

  const updateField = (
    index: number,
    patch: Partial<RewardProviderSchemaField>,
  ) => {
    onChange(
      fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    shouldFocusNewField.current = true;
    onChange([...fields, emptyField()]);
  };

  useEffect(() => {
    if (!shouldFocusNewField.current) return;
    shouldFocusNewField.current = false;
    const cards = listRef.current?.querySelectorAll<HTMLElement>(
      "[data-schema-field]",
    );
    const lastCard = cards?.[cards.length - 1];
    lastCard?.scrollIntoView({ behavior: "smooth", block: "center" });
    const firstInput = lastCard?.querySelector<HTMLInputElement>(
      "input:not([type='checkbox'])",
    );
    firstInput?.focus();
  }, [fields.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-sm font-semibold ${tw.textPrimary}`}>{title}</h2>
          <p className={`text-xs ${tw.textSecondary} mt-1`}>{description}</p>
        </div>
        <AddFieldButton
          disabled={disabled}
          onClick={addField}
          schemaTitle={title}
        />
      </div>

      {errors[schemaErrorKey] && (
        <p className="text-red-500 text-xs">{errors[schemaErrorKey]}</p>
      )}

      {fields.length === 0 ? (
        <div
          className={`border border-dashed border-gray-300 ${tw.rounded} p-8 text-center space-y-3`}
        >
          <p className={`text-sm ${tw.textMuted}`}>No fields yet.</p>
          <AddFieldButton
            disabled={disabled}
            onClick={addField}
            schemaTitle={title}
          />
        </div>
      ) : (
        <div ref={listRef} className="space-y-4">
          {fields.map((field, index) => {
            const prefix = `${schemaErrorKey}_${index}`;
            return (
              <div
                key={index}
                data-schema-field=""
                className={`border border-gray-200 ${tw.rounded} bg-gray-50/60 p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className={`w-4 h-4 ${tw.textMuted}`} />
                    <span className={`text-xs font-semibold ${tw.textMuted}`}>
                      Field {index + 1}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    disabled={disabled}
                    className={`p-1 icon-delete ${tw.rounded} disabled:opacity-60`}
                    title="Remove field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Field key *"
                      value={field.name}
                      onChange={(v) =>
                        updateField(index, { name: slugifyRewardFieldName(v) })
                      }
                      placeholder="e.g. username"
                      disabled={disabled}
                      hasError={!!errors[`${prefix}_name`]}
                    />
                    {errors[`${prefix}_name`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${prefix}_name`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      label="Label *"
                      value={field.label}
                      onChange={(v) => updateField(index, { label: v })}
                      placeholder="e.g. Username"
                      disabled={disabled}
                      hasError={!!errors[`${prefix}_label`]}
                    />
                    {errors[`${prefix}_label`] && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors[`${prefix}_label`]}
                      </p>
                    )}
                  </div>
                  <div>
                    <HeadlessSelect
                      label="Type *"
                      value={field.type}
                      onChange={(v) =>
                        updateField(index, {
                          ...patchFieldForTypeChange(
                            field,
                            v as RewardProviderSchemaField["type"],
                          ),
                        })
                      }
                      options={FIELD_TYPES}
                      disabled={disabled}
                    />
                  </div>
                  <div>
                    <RewardSchemaFieldControl
                      field={field}
                      controlLabel="Default value"
                      value={field.default}
                      onChange={(v) => updateField(index, { default: v })}
                      disabled={disabled}
                      allowEmptyDefault
                      error={errors[`${prefix}_default`]}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      label="Placeholder"
                      value={field.placeholder || ""}
                      onChange={(v) => updateField(index, { placeholder: v })}
                      placeholder="Optional hint text"
                      disabled={disabled || field.type === "boolean"}
                    />
                  </div>
                </div>

                {field.type === "select" && (
                  <div className="mt-3">
                    <CommaSeparatedOptionsInput
                      value={field.options || []}
                      onChange={(options) => updateField(index, { options })}
                      placeholder="e.g. days, hours, months"
                      disabled={disabled}
                      hasError={!!errors[`${prefix}_options`]}
                      error={errors[`${prefix}_options`]}
                    />
                  </div>
                )}

                <div className="mt-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      id={`reward-field-required-${schemaErrorKey}-${index}`}
                      checked={!!field.required}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateField(index, { required: e.target.checked })
                      }
                      disabled={disabled}
                    />
                    <span className={`text-sm font-medium ${tw.textPrimary}`}>
                      Required when creating a reward template
                    </span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      id={`reward-field-editable-${schemaErrorKey}-${index}`}
                      checked={isSchemaFieldEditable(field)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateField(index, { is_editable: e.target.checked })
                      }
                      disabled={disabled}
                    />
                    <span>
                      <span
                        className={`text-sm font-medium ${tw.textPrimary} block`}
                      >
                        Editable after configuration is created
                      </span>
                      
                    </span>
                  </label>
                </div>
              </div>
            );
          })}
          <AddFieldButton
            variant="footer"
            disabled={disabled}
            onClick={addField}
            schemaTitle={title}
          />
        </div>
      )}
    </div>
  );
}
