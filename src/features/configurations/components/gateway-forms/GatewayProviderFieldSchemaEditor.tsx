import { Plus, Trash2, GripVertical } from "lucide-react";
import Input from "../../../../shared/components/ui/Input";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw } from "../../../../shared/utils/utils";
import { GatewayProviderField } from "../../services/gatewayProviderService";
import {
  getGatewayProtocol,
  gatewayProtocolLabel,
  isProtocolOwnedField,
} from "../../constants/gatewayProtocol";
import CommaSeparatedOptionsInput from "../CommaSeparatedOptionsInput";

const FIELD_TYPES: { value: GatewayProviderField["type"]; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "password", label: "Password" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "select", label: "Select" },
];

interface GatewayProviderFieldSchemaEditorProps {
  fields: GatewayProviderField[];
  protocol?: string;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (fields: GatewayProviderField[]) => void;
  onResetToProtocolDefaults?: () => void;
}

function emptyField(): GatewayProviderField {
  return {
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
  };
}

/** Normalize field name to a config-key safe identifier. */
export function slugifyFieldName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

export function validateFieldSchema(
  fields: GatewayProviderField[],
  protocol?: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const seen = new Set<string>();
  const definition = getGatewayProtocol(protocol);

  if (!protocol) {
    errors.schema = "Select a protocol to load the connection fields";
  } else if (fields.length === 0) {
    errors.schema =
      protocol === "custom"
        ? "Add at least one configuration field for this provider"
        : `No fields defined. Reset to ${gatewayProtocolLabel(protocol)} defaults or add fields.`;
  } else if (definition && protocol !== "custom") {
    const names = new Set(
      fields.map((f) => f.name?.trim()).filter((n): n is string => Boolean(n)),
    );
    const missing = definition.fields.filter(
      (f) => f.required && !names.has(f.name),
    );
    if (missing.length > 0) {
      errors.schema = `Missing required ${definition.label} fields: ${missing
        .map((f) => f.label)
        .join(", ")}. Reset to protocol defaults or add them.`;
    }
  }

  fields.forEach((field, index) => {
    const prefix = `field_${index}`;
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
      }
    }
  });

  return errors;
}

export default function GatewayProviderFieldSchemaEditor({
  fields,
  protocol,
  errors = {},
  disabled = false,
  onChange,
  onResetToProtocolDefaults,
}: GatewayProviderFieldSchemaEditorProps) {
  const protocolDef = getGatewayProtocol(protocol);
  const canReset =
    Boolean(protocol) &&
    protocol !== "custom" &&
    Boolean(onResetToProtocolDefaults);

  const updateField = (index: number, patch: Partial<GatewayProviderField>) => {
    onChange(
      fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const addField = () => {
    onChange([...fields, emptyField()]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-sm font-semibold ${tw.textPrimary}`}>
            Connection fields
          </h2>
          <p className={`text-xs ${tw.textSecondary} mt-1`}>
            {protocolDef && protocol !== "custom"
              ? `${protocolDef.label} fields are seeded from the protocol. Add extra keys only for vendor-specific parameters.`
              : "These fields appear when creating a gateway configuration for this provider."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canReset && (
            <button
              type="button"
              onClick={onResetToProtocolDefaults}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm font-medium ${tw.rounded} border border-gray-200 disabled:opacity-60`}
            >
              Reset to {protocolDef?.label} defaults
            </button>
          )}
          <button
            type="button"
            onClick={addField}
            disabled={disabled || !protocol}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md disabled:opacity-60"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            Add field
          </button>
        </div>
      </div>

      {errors.schema && (
        <p className="text-red-500 text-xs">{errors.schema}</p>
      )}

      {fields.length === 0 ? (
        <div
          className={`border border-dashed border-gray-300 ${tw.rounded} p-8 text-center`}
        >
          <p className={`text-sm ${tw.textMuted}`}>
            {!protocol
              ? "Select a protocol to load the connection fields for this provider."
              : protocol === "custom"
                ? "No fields yet. Add fields such as host, port, api_key, or username."
                : `No ${gatewayProtocolLabel(protocol)} fields yet. Reset to protocol defaults or add fields.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => {
            const prefix = `field_${index}`;
            const protocolOwned = isProtocolOwnedField(protocol, field.name);
            return (
              <div
                key={protocolOwned ? field.name : `${field.name || "new"}-${index}`}
                className={`border border-gray-200 ${tw.rounded} bg-gray-50/60 p-4`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className={`w-4 h-4 ${tw.textMuted}`} />
                    <span className={`text-xs font-semibold ${tw.textMuted}`}>
                      Field {index + 1}
                    </span>
                    {protocolOwned && (
                      <span
                        className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 ${tw.rounded} bg-gray-200 ${tw.textSecondary}`}
                      >
                        {gatewayProtocolLabel(protocol)}
                      </span>
                    )}
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
                        updateField(index, { name: slugifyFieldName(v) })
                      }
                      placeholder="e.g. api_key"
                      disabled={disabled || protocolOwned}
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
                      placeholder="e.g. API Key"
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
                          type: v as GatewayProviderField["type"],
                          options:
                            v === "select" ? field.options || [] : undefined,
                        })
                      }
                      options={FIELD_TYPES}
                      disabled={disabled || protocolOwned}
                    />
                  </div>
                  <div>
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
                      placeholder="e.g. production, staging, sandbox"
                      disabled={disabled || protocolOwned}
                      hasError={!!errors[`${prefix}_options`]}
                      error={errors[`${prefix}_options`]}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer mt-3">
                  <Checkbox
                    id={`field-required-${index}`}
                    checked={!!field.required}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateField(index, { required: e.target.checked })
                    }
                    disabled={disabled}
                  />
                  <span className={`text-sm font-medium ${tw.textPrimary}`}>
                    Required when creating a configuration
                  </span>
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
