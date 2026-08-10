import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw } from "../../../../shared/utils/utils";
import type {
  CreateEngineTrackingSourceFieldPayload,
  CreateEngineTrackingSourcePayload,
  EngineFieldDataType,
  EngineTrackingSource,
  EngineTrackingSourceType,
  UpdateEngineTrackingSourcePayload,
} from "../../types/engineTrackingSource";
import {
  ENGINE_FIELD_DATA_TYPE_OPTIONS,
  ENGINE_TRACKING_SOURCE_TYPE_OPTIONS,
} from "../../types/engineTrackingSource";

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

interface DraftField {
  key: string;
  fieldName: string;
  fieldKey: string;
  dataType: EngineFieldDataType;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isAmountField: boolean;
  isRevenueField: boolean;
  isProductField: boolean;
  displayOrder: number;
  description: string;
}

function emptyField(order: number): DraftField {
  return {
    key: `f-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fieldName: "",
    fieldKey: "",
    dataType: "text",
    isRequired: false,
    isPrimaryKey: false,
    isAmountField: false,
    isRevenueField: false,
    isProductField: false,
    displayOrder: order,
    description: "",
  };
}

function deriveCode(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

function parseCsv(value: string): string[] | null {
  const parts = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
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
  const [fields, setFields] = useState<DraftField[]>(() => {
    if (initialData?.fields?.length) {
      return initialData.fields.map((f, i) => ({
        key: `existing-${f.id}`,
        fieldName: f.fieldName,
        fieldKey: f.fieldKey,
        dataType: (f.dataType as EngineFieldDataType) || "text",
        isRequired: f.isRequired,
        isPrimaryKey: f.isPrimaryKey,
        isAmountField: f.isAmountField,
        isRevenueField: f.isRevenueField,
        isProductField: f.isProductField,
        displayOrder: f.displayOrder ?? i,
        description: f.description || "",
      }));
    }
    return mode === "create" ? [emptyField(0)] : [];
  });
  const [formError, setFormError] = useState("");

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
      setFields(
        initialData.fields.map((f, i) => ({
          key: `existing-${f.id}`,
          fieldName: f.fieldName,
          fieldKey: f.fieldKey,
          dataType: (f.dataType as EngineFieldDataType) || "text",
          isRequired: f.isRequired,
          isPrimaryKey: f.isPrimaryKey,
          isAmountField: f.isAmountField,
          isRevenueField: f.isRevenueField,
          isProductField: f.isProductField,
          displayOrder: f.displayOrder ?? i,
          description: f.description || "",
        })),
      );
    }
  }, [initialData]);

  const handleNameChange = (value: string | number) => {
    const next = String(value);
    setName(next);
    if (!codeTouched && mode === "create") {
      setCode(deriveCode(next));
    }
  };

  const updateField = (key: string, patch: Partial<DraftField>) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, ...patch } : f)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedCode)) {
      setFormError(
        "Code must be lowercase snake_case (letters, numbers, underscores).",
      );
      return;
    }

    const attr = Number(attributionWindowHours);
    const cool = Number(cooldownHours);
    if (!Number.isFinite(attr) || attr < 1) {
      setFormError("Attribution window must be at least 1 hour.");
      return;
    }
    if (!Number.isFinite(cool) || cool < 0) {
      setFormError("Cooldown hours must be 0 or greater.");
      return;
    }

    const fieldPayloads: CreateEngineTrackingSourceFieldPayload[] = [];
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const fieldName = f.fieldName.trim();
      if (!fieldName && !f.fieldKey.trim()) continue;
      if (!fieldName) {
        setFormError(`Field ${i + 1}: name is required.`);
        return;
      }
      fieldPayloads.push({
        fieldName,
        ...(f.fieldKey.trim()
          ? { fieldKey: f.fieldKey.trim().toLowerCase() }
          : {}),
        dataType: f.dataType,
        isRequired: f.isRequired,
        isPrimaryKey: f.isPrimaryKey,
        isAmountField: f.isAmountField,
        isRevenueField: f.isRevenueField,
        isProductField: f.isProductField,
        displayOrder: f.displayOrder,
        description: f.description.trim() || null,
      });
    }

    const base = {
      name: trimmedName,
      code: trimmedCode,
      sourceType: sourceType as EngineTrackingSourceType,
      description: description.trim() || null,
      attributionWindowHours: attr,
      cooldownHours: cool,
      minAmount: minAmount.trim() === "" ? null : Number(minAmount),
      maxAmount: maxAmount.trim() === "" ? null : Number(maxAmount),
      includedProductCodes: parseCsv(includedProductCodes),
      excludedProductCodes: parseCsv(excludedProductCodes),
      isActive,
    };

    if (
      (base.minAmount != null && !Number.isFinite(base.minAmount)) ||
      (base.maxAmount != null && !Number.isFinite(base.maxAmount))
    ) {
      setFormError("Min/max amount must be valid numbers.");
      return;
    }

    if (mode === "create") {
      onSave({ ...base, fields: fieldPayloads });
    } else {
      onSave(base);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formError ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      ) : null}

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            value={name}
            onChange={handleNameChange}
            placeholder="Recharge Tracking"
            required
          />
          <div>
            <Input
              label="Code"
              value={code}
              onChange={(v) => {
                setCodeTouched(true);
                setCode(String(v));
              }}
              placeholder="recharge"
              required
              disabled={mode === "edit"}
            />
            <p className={`text-xs mt-1 ${tw.textMuted}`}>
              {mode === "edit"
                ? "Code cannot be changed after creation"
                : "Lowercase snake_case unique key"}
            </p>
          </div>
          <HeadlessSelect
            label="Source type"
            value={sourceType}
            onChange={setSourceType}
            options={ENGINE_TRACKING_SOURCE_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            placeholder="Select type"
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
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Attribution window (hours)"
            type="number"
            min={1}
            value={attributionWindowHours}
            onChange={(v) => setAttributionWindowHours(String(v))}
            required
          />
          <Input
            label="Cooldown (hours)"
            type="number"
            min={0}
            value={cooldownHours}
            onChange={(v) => setCooldownHours(String(v))}
            required
          />
          <Input
            label="Min amount"
            type="number"
            min={0}
            step="0.01"
            value={minAmount}
            onChange={(v) => setMinAmount(String(v))}
            placeholder="Optional"
          />
          <Input
            label="Max amount"
            type="number"
            min={0}
            step="0.01"
            value={maxAmount}
            onChange={(v) => setMaxAmount(String(v))}
            placeholder="Optional"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Included product codes"
            value={includedProductCodes}
            onChange={(v) => setIncludedProductCodes(String(v))}
            placeholder="Comma-separated, optional"
          />
          <Input
            label="Excluded product codes"
            value={excludedProductCodes}
            onChange={(v) => setExcludedProductCodes(String(v))}
            placeholder="Comma-separated, optional"
          />
        </div>
      </div>

      {mode === "create" ? (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-3`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-semibold ${tw.textPrimary}`}>
                Fields
              </h3>
              <p className={`text-xs ${tw.textMuted}`}>
                Optional fields created with the source for the rule selector.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFields((prev) => [...prev, emptyField(prev.length)])
              }
              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm border ${tw.rounded}`}
              style={{
                borderColor: color.primary.accent,
                color: color.primary.accent,
              }}
            >
              <Plus className="w-4 h-4" />
              Add field
            </button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.key}
              className={`border border-gray-200 ${tw.rounded} p-4 space-y-3`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${tw.textPrimary}`}>
                  Field {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setFields((prev) =>
                      prev.filter((f) => f.key !== field.key),
                    )
                  }
                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                  title="Remove field"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Field name"
                  value={field.fieldName}
                  onChange={(v) =>
                    updateField(field.key, { fieldName: String(v) })
                  }
                  placeholder="Recharge Amount"
                />
                <Input
                  label="Field key"
                  value={field.fieldKey}
                  onChange={(v) =>
                    updateField(field.key, { fieldKey: String(v) })
                  }
                  placeholder="amount (auto if empty)"
                />
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
                />
              </div>
              <div className="flex flex-wrap gap-4">
                {(
                  [
                    ["isRequired", "Required"],
                    ["isPrimaryKey", "Primary key"],
                    ["isAmountField", "Amount field"],
                    ["isRevenueField", "Revenue field"],
                    ["isProductField", "Product field"],
                  ] as const
                ).map(([prop, label]) => (
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
                    />
                    <span className={`text-sm ${tw.textPrimary}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-sm ${tw.textMuted}`}>
          Manage individual fields from the source details page after saving
          metadata.
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className={`px-4 py-2 border border-gray-300 ${tw.rounded} ${tw.textPrimary}`}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={`text-white px-4 py-2 ${tw.rounded} disabled:opacity-50`}
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading
            ? "Saving..."
            : mode === "create"
              ? "Create tracking source"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
