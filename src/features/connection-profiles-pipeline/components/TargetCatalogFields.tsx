import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { tw, color } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { connectionProfilePipelineService } from "../services/pipelineService";
import { PipelineFormState } from "../types/pipeline";
import {
  DiscoveredColumn,
  DiscoveredTable,
  isBlankMappingSet,
  mappingsFromColumns,
  resolveCatalogSelection,
  tablesFromSampleFile,
} from "../utils/sourceColumns";

interface TargetCatalogFieldsProps {
  form: PipelineFormState;
  errors: Record<string, string>;
  onChange: (
    patch: Partial<PipelineFormState>,
    columns: DiscoveredColumn[],
  ) => void;
}

function uniqueOptions(
  values: string[],
): Array<{ value: string; label: string }> {
  const seen = new Set<string>();
  return values.flatMap((value) => {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) return [];
    seen.add(key);
    return [{ value: trimmed, label: trimmed }];
  });
}

export default function TargetCatalogFields({
  form,
  errors,
  onChange,
}: TargetCatalogFieldsProps) {
  const { error: showError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [tables, setTables] = useState<DiscoveredTable[]>([]);
  const [origin, setOrigin] = useState<"database" | "file" | "">("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");

  const columnsForTable = async (
    schema: string,
    table: string,
  ): Promise<DiscoveredColumn[]> => {
    if (!form.connection_profile_id || !schema || !table) return [];
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema) || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(table)) {
      return [];
    }
    try {
      return await connectionProfilePipelineService.previewQueryColumns({
        connection_profile_id: Number(form.connection_profile_id),
        query: `SELECT * FROM ${schema}.${table}`,
      });
    } catch (error) {
      console.error("Failed to load columns for the target table", error);
      return [];
    }
  };

  const applyTables = async (
    next: DiscoveredTable[],
    source: "database" | "file",
    request: number,
  ) => {
    setTables(next);
    setOrigin(source);
    const selection = resolveCatalogSelection(
      next,
      form.target_schema,
      form.target_table,
    );
    let columns = selection.columns;
    if (
      source === "database" &&
      columns.length === 0 &&
      selection.schema &&
      selection.table
    ) {
      columns = await columnsForTable(selection.schema, selection.table);
      if (request !== requestRef.current) return;
    }
    const mappings =
      source === "file" && isBlankMappingSet(form.mappings) && columns.length > 0
        ? mappingsFromColumns(columns)
        : undefined;
    onChange(
      {
        target_schema: selection.schema,
        target_table: selection.table,
        ...(mappings ? { mappings } : {}),
      },
      columns,
    );
    const schemaCount = new Set(next.map((table) => table.schema.toLowerCase())).size;
    const tableLabel = `${next.length} table${next.length === 1 ? "" : "s"}`;
    const schemaLabel = `${schemaCount} schema${schemaCount === 1 ? "" : "s"}`;
    if (source === "database") {
      const columnNote =
        selection.table && columns.length === 0
          ? " Column names for that table were not returned, so target columns still follow the source sample."
          : "";
      setNotice(
        selection.table
          ? `Loaded ${schemaLabel} and ${tableLabel}. ${selection.schema}.${selection.table} is selected.${columnNote}`
          : `Loaded ${schemaLabel} and ${tableLabel}. Choose the warehouse table.`,
      );
      return;
    }
    setNotice(
      selection.table
        ? `Read ${tableLabel} from the sample file under schema ${selection.schema}. The file stays in this browser.`
        : `Read ${tableLabel} from the sample file. Choose the table to map.`,
    );
  };

  const loadFromDatabase = async (manual: boolean) => {
    if (!form.connection_profile_id) {
      if (manual) {
        showError(
          "Select a connection profile",
          "Schema and table names are read through that profile.",
        );
      }
      return;
    }
    const request = ++requestRef.current;
    setLoading(true);
    if (manual) setNotice("");
    try {
      const discovered = await connectionProfilePipelineService.previewTables({
        connection_profile_id: Number(form.connection_profile_id),
      });
      if (request !== requestRef.current) return;
      await applyTables(discovered, "database", request);
    } catch (error) {
      if (request !== requestRef.current) return;
      console.error("Failed to load database tables", error);
      const message = extractBackendError(
        error,
        "Schema and table names could not be loaded from this connection profile.",
      );
      setNotice(message);
      if (manual) showError("Unable to load tables", message);
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    setTables([]);
    setOrigin("");
    setNotice("");
    if (form.source_type !== "DATABASE_QUERY" || !form.connection_profile_id) {
      return;
    }
    void loadFromDatabase(false);
    return () => {
      requestRef.current += 1;
    };
    // Reload when the profile or source changes. The loader reads the latest form through its closure on each run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.connection_profile_id, form.source_type]);

  const loadFromFile = async (file: File) => {
    const request = ++requestRef.current;
    setLoading(true);
    setNotice("");
    try {
      const discovered = await tablesFromSampleFile(file, {
        schema: form.target_schema || "cvm",
        delimiter: form.ftp.delimiter || ",",
        hasHeaders: form.ftp.has_headers,
        responsePath: form.rest.response_path,
      });
      if (request !== requestRef.current) return;
      await applyTables(discovered, "file", request);
    } catch (error) {
      if (request !== requestRef.current) return;
      console.error("Failed to read table names from sample file", error);
      const message =
        error instanceof Error
          ? error.message
          : "Table names could not be read from the sample file.";
      setNotice(message);
      showError("Unable to read the sample file", message);
    } finally {
      if (request === requestRef.current) setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const schemaOptions = uniqueOptions([
    form.target_schema,
    ...tables.map((table) => table.schema),
  ]);
  const tableOptions = uniqueOptions([
    form.target_table,
    ...tables
      .filter(
        (table) =>
          table.schema.toLowerCase() === form.target_schema.trim().toLowerCase(),
      )
      .map((table) => table.name),
  ]);

  const selectSchema = (value: string) => {
    const inSchema = tables.filter(
      (table) => table.schema.toLowerCase() === value.toLowerCase(),
    );
    const current = inSchema.find(
      (table) => table.name.toLowerCase() === form.target_table.trim().toLowerCase(),
    );
    const nextTable = current?.name || (inSchema.length === 1 ? inSchema[0].name : "");
    void selectTable(nextTable, value);
  };

  const selectTable = async (value: string, schema = form.target_schema) => {
    const chosen = tables.find(
      (table) =>
        table.schema.toLowerCase() === schema.trim().toLowerCase() &&
        table.name.toLowerCase() === value.toLowerCase(),
    );
    const request = ++requestRef.current;
    let columns = chosen?.columns ?? [];
    if (columns.length === 0 && value && origin !== "file") {
      setLoading(true);
      columns = await columnsForTable(chosen?.schema || schema, chosen?.name || value);
      if (request === requestRef.current) setLoading(false);
      if (request !== requestRef.current) return;
    }
    const mappings =
      origin === "file" && isBlankMappingSet(form.mappings) && columns.length > 0
        ? mappingsFromColumns(columns)
        : undefined;
    onChange(
      {
        target_schema: chosen?.schema || schema,
        target_table: chosen?.name || value,
        ...(mappings ? { mappings } : {}),
      },
      columns,
    );
  };

  return (
    <div className="contents">
      <div className="md:col-span-2 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadFromDatabase(true)}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white ${tw.rounded} disabled:opacity-50`}
            style={{ backgroundColor: color.primary.action }}
          >
            {loading && <LoadingSpinner size="sm" color="white" />}
            Load tables from database
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls,.json,text/csv,application/json"
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
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 ${tw.rounded} disabled:opacity-50`}
          >
            <Upload className="w-4 h-4" />
            Upload sample file
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {form.source_type === "DATABASE_QUERY"
            ? "Schemas and tables load from the selected connection profile. A workbook uses each sheet name as a table. A CSV or JSON file uses the file name."
            : "A workbook uses each sheet name as a table under the current schema. A CSV or JSON file uses the file name. The sample stays in this browser."}
        </p>
        {notice && <p className="text-sm text-gray-600">{notice}</p>}
      </div>
      <div>
        <HeadlessSelect
          label="Target schema*"
          searchable
          searchPlaceholder="Search schemas..."
          value={form.target_schema}
          error={!!errors.target_schema}
          disabled={schemaOptions.length === 0}
          placeholder="Load schemas first"
          options={schemaOptions}
          onChange={(value) => selectSchema(String(value))}
        />
        {errors.target_schema && (
          <p className="mt-1 text-xs text-red-600">{errors.target_schema}</p>
        )}
      </div>
      <div>
        <HeadlessSelect
          label="Target table*"
          searchable
          searchPlaceholder="Search tables..."
          value={form.target_table}
          error={!!errors.target_table}
          disabled={tableOptions.length === 0}
          placeholder={
            tableOptions.length === 0 ? "Load tables first" : "Select a table"
          }
          options={tableOptions}
          onChange={(value) => {
            void selectTable(String(value));
          }}
        />
        {errors.target_table && (
          <p className="mt-1 text-xs text-red-600">{errors.target_table}</p>
        )}
      </div>
    </div>
  );
}
