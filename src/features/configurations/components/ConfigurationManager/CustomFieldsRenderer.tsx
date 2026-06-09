import React, { useState, useEffect } from "react";
import { tw } from "../../../../shared/utils/utils";
import Input from "../../../../shared/components/ui/Input";
import Textarea from "../../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import type { MetadataField } from "./ConfigurationManager";

interface CustomFieldsRendererProps {
  fields: MetadataField[];
  formData: Record<string, any>;
  onFieldChange: (key: string, value: any) => void;
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
    {} as Record<number, MetadataField[]>
  );

  const renderField = (field: MetadataField) => {
    const [loadedOptions, setLoadedOptions] = useState<{ value: string | number; label: string }[] | null>(null);
    const [isLoadingOptions, setIsLoadingOptions] = useState(false);

    useEffect(() => {
      if (field.type === "select" && field.loadOptions && !field.options) {
        setIsLoadingOptions(true);
        field.loadOptions()
          .then((opts) => setLoadedOptions(opts))
          .catch(() => setLoadedOptions([]))
          .finally(() => setIsLoadingOptions(false));
      }
    }, [field]);

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
                onChange={(value) => onFieldChange(field.key, value ? Number(value) : "")}
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
                options={
                  selectOptions as Array<{
                    value: string | number;
                    label: string;
                  }>
                }
                value={formData[field.key] || ""}
                onChange={(value) => onFieldChange(field.key, value)}
                placeholder={isLoadingOptions ? "Loading..." : field.placeholder || "Select..."}
                disabled={isLoadingOptions}
                className="w-full"
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
          <div key={row} className="flex gap-4">
            {rowFields.map((field) => renderField(field))}
          </div>
        ))}
    </>
  );
}
