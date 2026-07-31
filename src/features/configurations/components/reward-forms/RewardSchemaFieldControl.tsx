import type { ReactNode } from "react";
import Input from "../../../../shared/components/ui/Input";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import { tw } from "../../../../shared/utils/utils";
import type { RewardProviderSchemaField } from "../../types/rewardProvider";
import {
  BOOLEAN_SELECT_OPTIONS,
  OPTIONAL_DEFAULT_OPTION,
  booleanToSelectValue,
  parseBooleanValue,
} from "./rewardSchemaFieldUtils";

function inputTypeForField(
  type: RewardProviderSchemaField["type"],
): "text" | "number" | "password" {
  if (type === "password") return "password";
  if (type === "number") return "number";
  return "text";
}

interface RewardSchemaFieldControlProps {
  field: RewardProviderSchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  error?: string;
  /** Floating label on the inner control (e.g. schema editor default value). */
  controlLabel?: string;
  /** Renders the schema field label above the control (reward configuration form). */
  showFieldLabel?: boolean;
  /** When true, boolean/select allow clearing (schema defaults only). */
  allowEmptyDefault?: boolean;
}

export default function RewardSchemaFieldControl({
  field,
  value,
  onChange,
  disabled,
  error,
  controlLabel,
  showFieldLabel = false,
  allowEmptyDefault = false,
}: RewardSchemaFieldControlProps) {
  const fieldLabel = (
    <>
      {field.label}
      {field.required ? " *" : ""}
    </>
  );

  const wrap = (control: ReactNode) => (
    <div>
      {showFieldLabel && (
        <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
          {fieldLabel}
        </label>
      )}
      {control}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  if (field.type === "boolean") {
    const options = allowEmptyDefault
      ? [OPTIONAL_DEFAULT_OPTION, ...BOOLEAN_SELECT_OPTIONS]
      : [...BOOLEAN_SELECT_OPTIONS];

    return wrap(
      <HeadlessSelect
        label={controlLabel}
        value={booleanToSelectValue(value)}
        onChange={(v) => {
          if (v === "") {
            onChange(undefined);
            return;
          }
          onChange(parseBooleanValue(v));
        }}
        options={options.map((o) => ({ ...o }))}
        placeholder={
          allowEmptyDefault ? "No default" : field.placeholder || "Select value"
        }
        disabled={disabled}
        error={!!error}
      />,
    );
  }

  if (field.type === "select") {
    const selectOptions = (field.options || []).map((o) => ({
      value: o,
      label: o,
    }));
    const options = allowEmptyDefault
      ? [{ value: "", label: OPTIONAL_DEFAULT_OPTION.label }, ...selectOptions]
      : selectOptions;

    return wrap(
      <HeadlessSelect
        label={controlLabel}
        value={value != null ? String(value) : ""}
        onChange={(v) => onChange(v === "" ? undefined : v)}
        options={options}
        placeholder={
          field.placeholder ||
          (allowEmptyDefault ? "No default" : `Select ${field.label}`)
        }
        disabled={disabled}
        error={!!error}
      />,
    );
  }

  const isPassword = field.type === "password";

  return wrap(
    <Input
      label={controlLabel}
      type={inputTypeForField(field.type)}
      value={value != null ? String(value) : ""}
      onChange={(v) => onChange(v)}
      placeholder={
        controlLabel === "Default value"
          ? "Optional default"
          : field.placeholder || field.label
      }
      disabled={disabled}
      hasError={!!error}
      showPasswordToggle={isPassword ? true : false}
      autoComplete={isPassword ? "off" : undefined}
    />,
  );
}
