import React, { useState, useEffect } from "react";
import { tw } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import HeadlessMultiSelect from "../../../../shared/components/ui/HeadlessMultiSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import type { MetadataField } from "./ConfigurationManager";

interface CustomFieldsRendererProps {
  fields: MetadataField[];
  formData: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
}

function MultiselectFieldControl({
  field,
  formData,
  onFieldChange,
}: {
  field: MetadataField;
  formData: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
}) {
  const [loadedOptions, setLoadedOptions] = useState<
    { value: string | number; label: string }[] | null
  >(null);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [customDraft, setCustomDraft] = useState("");

  useEffect(() => {
    if (!field.loadOptions) {
      setLoadedOptions(null);
      return;
    }
    let cancelled = false;
    setIsLoadingOptions(true);
    field
      .loadOptions(formData)
      .then((opts) => {
        if (!cancelled) setLoadedOptions(opts);
      })
      .catch(() => {
        if (!cancelled) setLoadedOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-load when type (or other deps) change — formData.type is the common driver
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.key, field.loadOptions, formData.type, formData.dataSource]);

  const baseOptions = (field.options || loadedOptions || []).map((o) => ({
    value: o.value as string | number,
    label: o.label,
  }));

  const selected: (string | number)[] = Array.isArray(formData[field.key])
    ? formData[field.key]
    : [];

  // Ensure selected custom values appear as options
  const optionValues = new Set(baseOptions.map((o) => String(o.value)));
  const mergedOptions = [
    ...baseOptions,
    ...selected
      .filter((v) => !optionValues.has(String(v)))
      .map((v) => ({ value: v, label: String(v) })),
  ];

  const addCustomValue = () => {
    const trimmed = customDraft.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase().replace(/\s+/g, "_");
    if (!selected.map(String).includes(key)) {
      onFieldChange(field.key, [...selected, key]);
    }
    setCustomDraft("");
  };

  return (
    <div className="flex flex-col gap-2">
      <label className={`text-sm font-medium ${tw.textPrimary}`}>
        {field.label}
        {field.required && formData.type !== "custom" ? " *" : ""}
      </label>
      <HeadlessMultiSelect
        options={mergedOptions}
        value={selected}
        onChange={(value) => onFieldChange(field.key, value)}
        placeholder={
          isLoadingOptions
            ? "Loading..."
            : field.placeholder || `Select ${field.label.toLowerCase()}...`
        }
        disabled={isLoadingOptions}
        searchable
        className="w-full"
      />
      {field.allowCustomValues ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <Input
              label="Add custom key"
              type="text"
              value={customDraft}
              onChange={setCustomDraft}
              placeholder="e.g. custom_field_key"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomValue();
                }
              }}
            />
          </div>
          <button
            type="button"
            onClick={addCustomValue}
            className="inline-flex items-center justify-center h-10 px-3 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 shrink-0 self-center"
          >
            Add
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function CustomFieldsRenderer({
  fields,
  formData,
  onFieldChange,
}: CustomFieldsRendererProps) {
  // Group fields by row
  const fieldsByRow = fields.reduce(
    (acc, field) => {
      const rowNum = field.row ?? 0;
      if (!acc[rowNum]) acc[rowNum] = [];
      acc[rowNum].push(field);
      return acc;
    },
    {} as Record<number, MetadataField[]>,
  );

  const renderField = (field: MetadataField) => {
    const [loadedOptions, setLoadedOptions] = useState<
      { value: string | number; label: string }[] | null
    >(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
      if (field.type === "select" && field.loadOptions && !field.options) {
        setIsLoadingOptions(true);
        field
          .loadOptions(formData)
          .then((opts) => setLoadedOptions(opts))
          .catch(() => setLoadedOptions([]))
          .finally(() => setIsLoadingOptions(false));
      }
    }, [field, formData]);

    const shouldShow = field.condition ? field.condition(formData) : true;
    if (!shouldShow) return null;

    const selectOptions = field.options || loadedOptions || [];

    return (
      <div key={field.key} className="flex flex-col flex-1">
        {field.type === "text" && (
          <Input
            label={`${field.label}${field.required ? " *" : ""}`}
            type="text"
            value={formData[field.key] || ""}
            onChange={(value) => onFieldChange(field.key, value)}
            placeholder={field.placeholder}
            required={field.required}
          />
        )}

        {field.type === "number" && (
          <Input
            label={`${field.label}${field.required ? " *" : ""}`}
            type="number"
            value={formData[field.key] || ""}
            onChange={(value) =>
              onFieldChange(field.key, value ? Number(value) : "")
            }
            placeholder={field.placeholder}
            required={field.required}
          />
        )}

        {field.type === "date" && (
          <Input
            label={`${field.label}${field.required ? " *" : ""}`}
            type="date"
            value={formData[field.key] || ""}
            onChange={(value) => onFieldChange(field.key, value)}
            required={field.required}
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            label={`${field.label}${field.required ? " *" : ""}`}
            value={formData[field.key] || ""}
            onChange={(value) => onFieldChange(field.key, value)}
            placeholder={field.placeholder}
            rows={3}
            required={field.required}
          />
        )}

        {field.type === "select" && selectOptions.length > 0 && (
          <HeadlessSelect
            label={`${field.label}${field.required ? " *" : ""}`}
            options={
              selectOptions as Array<{
                value: string | number;
                label: string;
              }>
            }
            value={formData[field.key] || ""}
            onChange={(value) => onFieldChange(field.key, value)}
            placeholder={
              isLoadingOptions
                ? "Loading..."
                : field.placeholder || "Select..."
            }
            disabled={isLoadingOptions}
            className="w-full"
          />
        )}

        {field.type === "multiselect" && (
          <MultiselectFieldControl
            field={field}
            formData={formData}
            onFieldChange={onFieldChange}
          />
        )}

        {field.type === "toggle" && (
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() =>
              onFieldChange(field.key, !(formData[field.key] ?? false))
            }
          >
            <Checkbox
              id={`field-${field.key}`}
              checked={formData[field.key] ?? false}
              onChange={() =>
                onFieldChange(field.key, !(formData[field.key] ?? false))
              }
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <label htmlFor={`field-${field.key}`} className="text-sm">
              {field.label}
            </label>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {Object.entries(fieldsByRow)
        .sort(([rowA], [rowB]) => Number(rowA) - Number(rowB))
        .map(([row, rowFields]) => (
          <div key={row} className="flex gap-4 flex-wrap sm:flex-nowrap">
            {rowFields.map((field) => renderField(field))}
          </div>
        ))}
    </>
  );
}
