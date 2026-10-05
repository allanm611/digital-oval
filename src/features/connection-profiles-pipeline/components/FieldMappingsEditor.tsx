import { useRef, useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw, button, color } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import {
  CONVERSION_OPTIONS,
  DATA_TYPE_OPTIONS,
} from "../constants/pipelineOptions";
import { connectionProfilePipelineService } from "../services/pipelineService";
import { FieldMappingDraft, PipelineFormState } from "../types/pipeline";
import { emptyMapping, parseJsonObject } from "../utils/pipelineForm";
import {
  columnsFromSampleFile,
  DiscoveredColumn,
  extractSelectColumns,
  isBlankMappingSet,
  mappingsFromColumns,
  selectOptions,
  targetOptions,
  toColumnIdentifier,
} from "../utils/sourceColumns";

interface FieldMappingsEditorProps {
  form: PipelineFormState;
  errors: Record<string, string>;
  warehouseColumns?: DiscoveredColumn[];
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
  form,
  errors,
  warehouseColumns = [],
  onChange,
}: FieldMappingsEditorProps) {
  const mappings = form.mappings;
  const { error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [columns, setColumns] = useState<DiscoveredColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const update = (key: string, patch: Partial<FieldMappingDraft>) => {
    onChange(
      mappings.map((mapping) =>
        mapping.key === key ? { ...mapping, ...patch } : mapping,
      ),
    );
  };

  const applyColumns = (next: DiscoveredColumn[], replace: boolean) => {
    setColumns(next);
    if (replace || isBlankMappingSet(mappings)) {
      onChange(mappingsFromColumns(next));
      setNotice(
        `${next.length} column${next.length === 1 ? "" : "s"} loaded. Each one is mapped onto a warehouse column.`,
      );
      return;
    }
    setNotice(
      `${next.length} columns are available in the lists. Existing mappings were kept.`,
    );
  };

  const loadFromQuery = async () => {
    const query = form.database.query.trim();
    if (!form.connection_profile_id) {
      showError("Select a connection profile", "The sample query runs through that profile.");
      return;
    }
    if (!query) {
      showError("Enter a SQL query", "Column names are read from that query.");
      return;
    }
    const parameters = parseJsonObject(form.database.parameters_json);
    setLoading(true);
    setNotice("");
    try {
      const discovered = await connectionProfilePipelineService.previewQueryColumns({
        connection_profile_id: Number(form.connection_profile_id),
        query,
        parameters: parameters.ok ? parameters.value : {},
      });
      applyColumns(discovered, false);
    } catch (error) {
      const status = (error as { status?: number }).status;
      const parsed = extractSelectColumns(query);
      if ((status === 404 || status === 501 || status === 405) && parsed.length > 0) {
        applyColumns(parsed, false);
        setNotice(
          "The server could not run the sample query. These names were taken from the SELECT list. SELECT * still needs the server.",
        );
        return;
      }
      console.error("Failed to load query columns", error);
      showError(
        "Unable to load columns",
        extractBackendError(
          error,
          parsed.length === 0
            ? "The sample query did not return column names. List the columns in the SELECT instead of using SELECT *."
            : "The sample query could not be run.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFromFile = async (file: File) => {
    setLoading(true);
    setNotice("");
    try {
      const discovered = await columnsFromSampleFile(file, {
        fileFormat:
          form.source_type === "REST_API" ? "json" : form.ftp.file_format,
        delimiter: form.ftp.delimiter || ",",
        hasHeaders: form.ftp.has_headers,
        responsePath: form.rest.response_path,
      });
      applyColumns(discovered, false);
    } catch (error) {
      console.error("Failed to read sample file", error);
      showError(
        "Unable to read the sample file",
        error instanceof Error ? error.message : "The file columns could not be read.",
      );
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const sourceChoices = selectOptions(
    columns,
    mappings.map((mapping) => mapping.source_field),
  );
  const targetChoices = targetOptions(
    warehouseColumns.length > 0 ? warehouseColumns : columns,
    mappings.map((mapping) => mapping.target_column),
  );
  const fileAccept =
    form.source_type === "REST_API"
      ? ".json,application/json"
      : form.ftp.file_format === "xlsx"
        ? ".xlsx,.xls"
        : form.ftp.file_format === "tsv"
          ? ".tsv,.txt,text/tab-separated-values"
          : form.ftp.file_format === "json"
            ? ".json,application/json"
            : ".csv,text/csv";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Load the source columns, then choose the source field. Target columns
        follow the selected warehouse table when that table's columns are known.
        Mark a match key when the load strategy is upsert.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {form.source_type === "DATABASE_QUERY" ? (
          <button
            type="button"
            onClick={loadFromQuery}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50`}
            style={{ backgroundColor: color.primary.action }}
          >
            {loading && <LoadingSpinner size="sm" color="white" />}
            Load columns from query
          </button>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={fileAccept}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void loadFromFile(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50`}
              style={{ backgroundColor: color.primary.action }}
            >
              {loading ? (
                <LoadingSpinner size="sm" color="white" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload sample file
            </button>
          </>
        )}
        {columns.length > 0 && !isBlankMappingSet(mappings) && (
          <button
            type="button"
            onClick={() => applyColumns(columns, true)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ${tw.rounded} border border-gray-300`}
          >
            Replace mappings with these columns
          </button>
        )}
      </div>
      {notice && <p className="text-sm text-gray-600">{notice}</p>}
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
              <HeadlessSelect
                label="Source field"
                searchable
                searchPlaceholder="Search columns..."
                value={mapping.source_field}
                error={!!errors[`mapping_${index}_source`]}
                disabled={sourceChoices.length === 0}
                placeholder={
                  sourceChoices.length === 0
                    ? "Load columns first"
                    : "Select a source field"
                }
                options={sourceChoices}
                onChange={(value) => {
                  const source = String(value);
                  const column = columns.find((item) => item.name === source);
                  const previousTarget = toColumnIdentifier(mapping.source_field);
                  const warehouseTarget = warehouseColumns
                    .map((item) => toColumnIdentifier(item.name))
                    .find(
                      (name) =>
                        name.toLowerCase() ===
                        toColumnIdentifier(source).toLowerCase(),
                    );
                  const keepTarget =
                    mapping.target_column &&
                    mapping.target_column !== mapping.source_field &&
                    mapping.target_column !== previousTarget;
                  const warehouseColumn = warehouseColumns.find(
                    (item) =>
                      toColumnIdentifier(item.name).toLowerCase() ===
                      (warehouseTarget || "").toLowerCase(),
                  );
                  update(mapping.key, {
                    source_field: source,
                    target_column: keepTarget
                      ? mapping.target_column
                      : warehouseColumns.length > 0
                        ? warehouseTarget || ""
                        : toColumnIdentifier(source),
                    data_type:
                      warehouseColumn?.dataType ||
                      column?.dataType ||
                      mapping.data_type,
                  });
                }}
              />
              {errors[`mapping_${index}_source`] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[`mapping_${index}_source`]}
                </p>
              )}
            </div>
            <div>
              <HeadlessSelect
                label="Target column"
                searchable
                searchPlaceholder="Search columns..."
                value={mapping.target_column}
                error={!!errors[`mapping_${index}_target`]}
                disabled={targetChoices.length === 0}
                placeholder={
                  targetChoices.length === 0
                    ? "Load columns first"
                    : "Select a target column"
                }
                options={targetChoices}
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
