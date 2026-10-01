import { Plus, Trash2 } from "lucide-react";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import { tw, button } from "../../../shared/utils/utils";
import {
  CONVERSION_OPTIONS,
  DATA_TYPE_OPTIONS,
} from "../constants/pipelineOptions";
import { FieldMappingDraft } from "../types/pipeline";
import { emptyMapping } from "../utils/pipelineForm";

interface FieldMappingsEditorProps {
  mappings: FieldMappingDraft[];
  errors: Record<string, string>;
  onChange: (mappings: FieldMappingDraft[]) => void;
}

function needsFormat(conversion: FieldMappingDraft["conversion"]): boolean {
  return (
    conversion === "to_date" ||
    conversion === "to_timestamp" ||
    conversion === "json_extract"
  );
}

export default function FieldMappingsEditor({
  mappings,
  errors,
  onChange,
}: FieldMappingsEditorProps) {
  const update = (key: string, patch: Partial<FieldMappingDraft>) => {
    onChange(
      mappings.map((mapping) =>
        mapping.key === key ? { ...mapping, ...patch } : mapping,
      ),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Map each source field onto a warehouse column. Mark a match key when
        the load strategy is upsert. Leave the list empty to pass source
        columns through unchanged.
      </p>
      {mappings.map((mapping, index) => (
        <div
          key={mapping.key}
          className={`${tw.rounded} border border-gray-200 p-4 space-y-4`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Mapping {index + 1}
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium"
              style={{ color: button.delete.background }}
              onClick={() =>
                onChange(
                  mappings.length === 1
                    ? [emptyMapping()]
                    : mappings.filter((item) => item.key !== mapping.key),
                )
              }
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Source field"
                placeholder="event_time"
                value={mapping.source_field}
                hasError={!!errors[`mapping_${index}_source`]}
                onChange={(value) =>
                  update(mapping.key, { source_field: String(value) })
                }
              />
              {errors[`mapping_${index}_source`] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[`mapping_${index}_source`]}
                </p>
              )}
            </div>
            <div>
              <Input
                label="Target column"
                placeholder="event_time"
                value={mapping.target_column}
                hasError={!!errors[`mapping_${index}_target`]}
                onChange={(value) =>
                  update(mapping.key, { target_column: String(value) })
                }
              />
              {errors[`mapping_${index}_target`] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[`mapping_${index}_target`]}
                </p>
              )}
            </div>
            <HeadlessSelect
              label="Data type"
              value={mapping.data_type}
              options={DATA_TYPE_OPTIONS}
              onChange={(value) =>
                update(mapping.key, {
                  data_type: String(value) as FieldMappingDraft["data_type"],
                })
              }
            />
            <HeadlessSelect
              label="Conversion"
              value={mapping.conversion}
              options={CONVERSION_OPTIONS}
              onChange={(value) =>
                update(mapping.key, {
                  conversion: String(value) as FieldMappingDraft["conversion"],
                })
              }
            />
            {needsFormat(mapping.conversion) && (
              <Input
                label={
                  mapping.conversion === "json_extract"
                    ? "JSON path"
                    : "Format"
                }
                placeholder={
                  mapping.conversion === "json_extract"
                    ? "payload.msisdn"
                    : "YYYY-MM-DD HH:mm:ss"
                }
                value={mapping.format || ""}
                onChange={(value) =>
                  update(mapping.key, { format: String(value) })
                }
              />
            )}
            <Input
              label="Default when empty"
              value={mapping.default_value || ""}
              onChange={(value) =>
                update(mapping.key, { default_value: String(value) })
              }
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox
                checked={mapping.required}
                onChange={(event) =>
                  update(mapping.key, { required: event.target.checked })
                }
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <Checkbox
                checked={mapping.is_upsert_key}
                onChange={(event) =>
                  update(mapping.key, { is_upsert_key: event.target.checked })
                }
              />
              Match key
            </label>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...mappings, emptyMapping()])}
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ${tw.rounded} border border-black bg-black text-white transition-colors hover:bg-gray-800`}
      >
        <Plus className="w-4 h-4" />
        Add mapping
      </button>
    </div>
  );
}
