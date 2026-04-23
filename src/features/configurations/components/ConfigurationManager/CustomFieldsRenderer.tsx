import React from "react";
import { tw } from "../../../../shared/utils/utils";
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
  return (
    <>
      {fields.map((field) => {
        const shouldShow = field.condition ? field.condition(formData) : true;

        if (!shouldShow) return null;

        return (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.label} {field.required && "*"}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={formData[field.key] || ""}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                required={field.required}
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={formData[field.key] || ""}
                onChange={(e) => onFieldChange(field.key, e.target.value ? Number(e.target.value) : "")}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                required={field.required}
              />
            )}

            {field.type === "date" && (
              <input
                type="date"
                value={formData[field.key] || ""}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                required={field.required}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={formData[field.key] || ""}
                onChange={(e) => onFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                rows={3}
                required={field.required}
              />
            )}

            {field.type === "select" && field.options && (
              <HeadlessSelect
                options={
                  field.options as Array<{
                    value: string | number;
                    label: string;
                  }>
                }
                value={formData[field.key] || ""}
                onChange={(value) => onFieldChange(field.key, value)}
                placeholder={field.placeholder || "Select..."}
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
      })}
    </>
  );
}
