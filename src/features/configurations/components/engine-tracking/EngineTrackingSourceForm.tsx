import { useEffect, useState } from "react";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import {
  button,
  color,
  getButtonStyles,
  tw,
} from "../../../../shared/utils/utils";
import type {
  CreateEngineTrackingSourcePayload,
  EngineTrackingSource,
  EngineTrackingSourceType,
  UpdateEngineTrackingSourcePayload,
} from "../../types/engineTrackingSource";
import { ENGINE_TRACKING_SOURCE_TYPE_OPTIONS } from "../../types/engineTrackingSource";
import EngineTrackingSourceFieldEditor from "./EngineTrackingSourceFieldEditor";
import {
  deriveTrackingSourceCode,
  emptyDraftField,
  parseCsvCodes,
  validateDraftFields,
  validateTrackingSourceBasics,
  type EngineTrackingDraftField,
} from "./engineTrackingFieldUtils";

interface EngineTrackingSourceFormProps {
  mode: "create" | "edit";
  isLoading: boolean;
  initialData?: EngineTrackingSource | null;
  onCancel: () => void;
  onSave: (
    payload:
      | CreateEngineTrackingSourcePayload
      | UpdateEngineTrackingSourcePayload,
  ) => void;
}

function draftFromSource(
  source: EngineTrackingSource,
): EngineTrackingDraftField[] {
  return (source.fields || []).map((f, i) => ({
    key: `existing-${f.id}`,
    fieldName: f.fieldName,
    fieldKey: f.fieldKey,
    dataType: (f.dataType as EngineTrackingDraftField["dataType"]) || "text",
    isRequired: f.isRequired,
    isPrimaryKey: f.isPrimaryKey,
    isAmountField: f.isAmountField,
    isRevenueField: f.isRevenueField,
    isProductField: f.isProductField,
    displayOrder: f.displayOrder ?? i,
    description: f.description || "",
  }));
}

export default function EngineTrackingSourceForm({
  mode,
  isLoading,
  initialData,
  onCancel,
  onSave,
}: EngineTrackingSourceFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [code, setCode] = useState(initialData?.code || "");
  const [codeTouched, setCodeTouched] = useState(!!initialData?.code);
  const [sourceType, setSourceType] = useState<string>(
    initialData?.sourceType || "recharge",
  );
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [attributionWindowHours, setAttributionWindowHours] = useState(
    String(initialData?.attributionWindowHours ?? 72),
  );
  const [cooldownHours, setCooldownHours] = useState(
    String(initialData?.cooldownHours ?? 0),
  );
  const [minAmount, setMinAmount] = useState(
    initialData?.minAmount != null ? String(initialData.minAmount) : "",
  );
  const [maxAmount, setMaxAmount] = useState(
    initialData?.maxAmount != null ? String(initialData.maxAmount) : "",
  );
  const [includedProductCodes, setIncludedProductCodes] = useState(
    (initialData?.includedProductCodes || []).join(", "),
  );
  const [excludedProductCodes, setExcludedProductCodes] = useState(
    (initialData?.excludedProductCodes || []).join(", "),
  );
  const [isActive, setIsActive] = useState(initialData?.isActive !== false);
  const [fields, setFields] = useState<EngineTrackingDraftField[]>(() => {
    if (initialData?.fields?.length) return draftFromSource(initialData);
    return mode === "create" ? [emptyDraftField(0)] : [];
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name || "");
    setCode(initialData.code || "");
    setCodeTouched(true);
    setSourceType(initialData.sourceType || "recharge");
    setDescription(initialData.description || "");
    setAttributionWindowHours(String(initialData.attributionWindowHours ?? 72));
    setCooldownHours(String(initialData.cooldownHours ?? 0));
    setMinAmount(
      initialData.minAmount != null ? String(initialData.minAmount) : "",
    );
    setMaxAmount(
      initialData.maxAmount != null ? String(initialData.maxAmount) : "",
    );
    setIncludedProductCodes(
      (initialData.includedProductCodes || []).join(", "),
    );
    setExcludedProductCodes(
      (initialData.excludedProductCodes || []).join(", "),
    );
    setIsActive(initialData.isActive !== false);
    if (initialData.fields?.length) {
      setFields(draftFromSource(initialData));
    }
  }, [initialData]);

  const handleNameChange = (value: string | number) => {
    const next = String(value);
    setName(next);
    if (!codeTouched && mode === "create") {
      setCode(deriveTrackingSourceCode(next));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = validateTrackingSourceBasics({
      name,
      code,
      attributionWindowHours,
      cooldownHours,
      minAmount,
      maxAmount,
    });

    let fieldPayloads: ReturnType<typeof validateDraftFields>["payloads"] = [];
    if (mode === "create") {
      const fieldResult = validateDraftFields(fields);
      Object.assign(nextErrors, fieldResult.errors);
      fieldPayloads = fieldResult.payloads;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();
    const attr = Number(attributionWindowHours);
    const cool = Number(cooldownHours);

    const base = {
      name: trimmedName,
      code: trimmedCode,
      sourceType: sourceType as EngineTrackingSourceType,
      description: description.trim() || null,
      attributionWindowHours: attr,
      cooldownHours: cool,
      minAmount: minAmount.trim() === "" ? null : Number(minAmount),
      maxAmount: maxAmount.trim() === "" ? null : Number(maxAmount),
      includedProductCodes: parseCsvCodes(includedProductCodes),
      excludedProductCodes: parseCsvCodes(excludedProductCodes),
      isActive,
    };

    if (mode === "create") {
      onSave({ ...base, fields: fieldPayloads });
    } else {
      onSave(base);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
          Basic Information
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Name *"
                value={name}
                onChange={handleNameChange}
                placeholder="Recharge Tracking"
                required
                disabled={isLoading}
                hasError={!!errors.name}
              />
              {fieldError("name")}
            </div>
            <div>
              <Input
                label="Code *"
                value={code}
                onChange={(v) => {
                  setCodeTouched(true);
                  setCode(String(v));
                }}
                placeholder="recharge"
                required
                disabled={isLoading || mode === "edit"}
                hasError={!!errors.code}
              />
              {fieldError("code") || (
                <p className={`text-xs mt-1 ${tw.textMuted}`}>
                  {mode === "edit"
                    ? "Code cannot be changed after creation"
                    : "Lowercase snake_case unique key (auto from name)"}
                </p>
              )}
            </div>
            <HeadlessSelect
              label="Source type *"
              value={sourceType}
              onChange={setSourceType}
              options={ENGINE_TRACKING_SOURCE_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              placeholder="Select type"
              disabled={isLoading}
            />
            <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
              <Checkbox
                id="engine-ts-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isLoading}
              />
              <span className={`text-sm font-medium ${tw.textPrimary}`}>
                Active
              </span>
            </label>
          </div>

          <Textarea
            label="Description"
            value={description}
            onChange={setDescription}
            rows={3}
            placeholder="What events this source attributes"
            disabled={isLoading}
          />
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
          Attribution Rules
        </h2>
        <p className={`text-xs ${tw.textSecondary} mb-4`}>
          Window and amount bounds used when matching conversions to this
          source.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Attribution window (hours) *"
              type="number"
              min={1}
              value={attributionWindowHours}
              onChange={(v) => setAttributionWindowHours(String(v))}
              required
              disabled={isLoading}
              hasError={!!errors.attributionWindowHours}
            />
            {fieldError("attributionWindowHours")}
          </div>
          <div>
            <Input
              label="Cooldown (hours) *"
              type="number"
              min={0}
              value={cooldownHours}
              onChange={(v) => setCooldownHours(String(v))}
              required
              disabled={isLoading}
              hasError={!!errors.cooldownHours}
            />
            {fieldError("cooldownHours")}
          </div>
          <div>
            <Input
              label="Min amount"
              type="number"
              min={0}
              step="0.01"
              value={minAmount}
              onChange={(v) => setMinAmount(String(v))}
              placeholder="Optional"
              disabled={isLoading}
              hasError={!!errors.minAmount}
            />
            {fieldError("minAmount")}
          </div>
          <div>
            <Input
              label="Max amount"
              type="number"
              min={0}
              step="0.01"
              value={maxAmount}
              onChange={(v) => setMaxAmount(String(v))}
              placeholder="Optional"
              disabled={isLoading}
              hasError={!!errors.maxAmount}
            />
            {fieldError("maxAmount")}
          </div>
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
          Product Filters
        </h2>
        <p className={`text-xs ${tw.textSecondary} mb-4`}>
          Optional include/exclude lists. Leave blank to match all products.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Included product codes"
            value={includedProductCodes}
            onChange={(v) => setIncludedProductCodes(String(v))}
            placeholder="Comma-separated, optional"
            disabled={isLoading}
          />
          <Input
            label="Excluded product codes"
            value={excludedProductCodes}
            onChange={(v) => setExcludedProductCodes(String(v))}
            placeholder="Comma-separated, optional"
            disabled={isLoading}
          />
        </div>
      </div>

      {mode === "create" ? (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <EngineTrackingSourceFieldEditor
            fields={fields}
            errors={errors}
            disabled={isLoading}
            onChange={setFields}
          />
        </div>
      ) : (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
            Fields
          </h2>
          <p className={`text-sm ${tw.textMuted}`}>
            Field definitions are managed on the source details page so each
            field can be added, edited, or deactivated independently without
            rewriting source metadata.
          </p>
          {initialData?.fields && initialData.fields.length > 0 ? (
            <p className={`text-xs ${tw.textSecondary} mt-2`}>
              {
                initialData.fields.filter((f) => f.isActive !== false).length
              }{" "}
              active field
              {initialData.fields.filter((f) => f.isActive !== false)
                .length === 1
                ? ""
                : "s"}{" "}
              currently configured.
            </p>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Tracking Source"
              : "Update Tracking Source"}
        </button>
      </div>
    </form>
  );
}
