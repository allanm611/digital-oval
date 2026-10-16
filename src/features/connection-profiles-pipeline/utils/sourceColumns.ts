import * as XLSX from "xlsx";
import {
  FieldDataType,
  FieldMappingDraft,
  InferredFieldMapping,
} from "../types/pipeline";
import { emptyMapping } from "./pipelineForm";

export interface DiscoveredColumn {
  name: string;
  dataType: FieldDataType;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function isBlankMappingSet(mappings: FieldMappingDraft[]): boolean {
  return mappings.every(
    (mapping) => !mapping.source_field.trim() && !mapping.target_column.trim(),
  );
}

export function toColumnIdentifier(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 100);
  if (!cleaned) return "column";
  return /^[0-9]/.test(cleaned) ? `c_${cleaned}`.slice(0, 100) : cleaned;
}

export function fieldDataTypeFromInference(typeName?: string): FieldDataType {
  const type = String(typeName || "").toLowerCase();
  if (type.includes("bool")) return "boolean";
  if (type.includes("int")) return "integer";
  if (
    type.includes("numeric") ||
    type.includes("decimal") ||
    type.includes("float") ||
    type.includes("double") ||
    type === "number"
  ) {
    return "number";
  }
  if (type === "date") return "date";
  if (type.includes("time") || type.includes("datetime")) return "timestamp";
  if (type.includes("json")) return "json";
  return "string";
}

export function columnsFromInferredMappings(
  mappings: InferredFieldMapping[],
): DiscoveredColumn[] {
  return mappings.flatMap((mapping) => {
    const name = String(mapping.source_field || "").trim();
    if (!name) return [];
    return [
      {
        name,
        dataType: fieldDataTypeFromInference(mapping.data_type),
      },
    ];
  });
}

export function draftsFromInferredMappings(
  mappings: InferredFieldMapping[],
): FieldMappingDraft[] {
  const used = new Set<string>();
  return mappings.flatMap((mapping) => {
    const name = String(mapping.source_field || "").trim();
    if (!name) return [];
    let target = toColumnIdentifier(mapping.target_field || name);
    const base = target;
    let suffix = 2;
    while (used.has(target.toLowerCase())) {
      target = `${base}_${suffix}`.slice(0, 100);
      suffix += 1;
    }
    used.add(target.toLowerCase());
    return [
      {
        ...emptyMapping(),
        source_field: name,
        target_column: target,
        data_type: fieldDataTypeFromInference(mapping.data_type),
        required: mapping.required === true,
        default_value:
          mapping.default_value === undefined || mapping.default_value === null
            ? ""
            : String(mapping.default_value),
      },
    ];
  });
}

export function mappingsFromColumns(
  columns: DiscoveredColumn[],
): FieldMappingDraft[] {
  const used = new Set<string>();
  return columns.map((column) => {
    let target = toColumnIdentifier(column.name);
    const base = target;
    let suffix = 2;
    while (used.has(target.toLowerCase())) {
      target = `${base}_${suffix}`.slice(0, 100);
      suffix += 1;
    }
    used.add(target.toLowerCase());
    return {
      ...emptyMapping(),
      source_field: column.name,
      target_column: target,
      data_type: column.dataType,
    };
  });
}

export function selectOptions(
  columns: DiscoveredColumn[],
  selected: string[],
): Array<{ value: string; label: string }> {
  const seen = new Set<string>();
  const options: Array<{ value: string; label: string }> = [];
  const push = (value: string, label = value) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    options.push({ value: trimmed, label });
  };
  columns.forEach((column) => push(column.name));
  selected.forEach((value) => push(value));
  return options;
}

export function targetOptions(
  columns: DiscoveredColumn[],
  selected: string[],
): Array<{ value: string; label: string }> {
  const names = columns.map((column) => toColumnIdentifier(column.name));
  const unique: DiscoveredColumn[] = [];
  const seen = new Set<string>();
  names.forEach((name) => {
    const key = name.toLowerCase();
    if (seen.has(key) || !IDENTIFIER.test(name)) return;
    seen.add(key);
    unique.push({ name, dataType: "string" });
  });
  return selectOptions(unique, selected.filter((value) => IDENTIFIER.test(value)));
}

function dataTypeFromValue(value: unknown): FieldDataType {
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") {
    return Number.isInteger(value) ? "integer" : "number";
  }
  if (value && typeof value === "object") return "json";
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return "date";
    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(value)) return "timestamp";
  }
  return "string";
}

export function dataTypeFromSql(typeName?: string): FieldDataType {
  const type = String(typeName || "").toLowerCase();
  if (!type) return "string";
  if (type.includes("bool")) return "boolean";
  if (type.includes("timestamp") || type.includes("datetime")) return "timestamp";
  if (type === "date" || type.includes("date")) return "date";
  if (type.includes("int")) return "integer";
  if (
    type.includes("numeric") ||
    type.includes("decimal") ||
    type.includes("float") ||
    type.includes("double") ||
    type.includes("real") ||
    type.includes("number")
  ) {
    return "number";
  }
  if (type.includes("json")) return "json";
  return "string";
}

export function columnsFromRecords(records: unknown[]): DiscoveredColumn[] {
  const first = records.find((row) => row && typeof row === "object" && !Array.isArray(row));
  if (!first) return [];
  return Object.entries(first as Record<string, unknown>)
    .filter(([name]) => name.trim())
    .map(([name, value]) => ({
      name: name.trim(),
      dataType: dataTypeFromValue(value),
    }));
}

export interface DiscoveredTable {
  schema: string;
  name: string;
  columns: DiscoveredColumn[];
}

const SYSTEM_SCHEMAS = new Set([
  "information_schema",
  "pg_catalog",
  "pg_toast",
  "mysql",
  "performance_schema",
  "sys",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function unwrapPayload(payload: unknown): unknown {
  const record = asRecord(payload);
  if (record && "data" in record && record.data !== undefined) return record.data;
  return payload;
}

function columnList(value: unknown): DiscoveredColumn[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [{ name: item.trim(), dataType: "string" as FieldDataType }];
    }
    const row = asRecord(item);
    if (!row) return [];
    const name = String(row.name ?? row.column_name ?? row.field ?? "").trim();
    if (!name) return [];
    return [
      {
        name,
        dataType: dataTypeFromSql(
          String(row.data_type ?? row.type ?? row.dataType ?? ""),
        ),
      },
    ];
  });
}

export function tablesFromApiPayload(payload: unknown): DiscoveredTable[] {
  const root = unwrapPayload(payload);
  const record = asRecord(root);
  const collected: DiscoveredTable[] = [];
  const seen = new Set<string>();

  const push = (schema: string, name: string, columns: DiscoveredColumn[]) => {
    const schemaName = toColumnIdentifier(schema || "cvm");
    const tableName = toColumnIdentifier(name);
    if (!IDENTIFIER.test(schemaName) || !IDENTIFIER.test(tableName)) return;
    const key = `${schemaName.toLowerCase()}.${tableName.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    collected.push({ schema: schemaName, name: tableName, columns });
  };

  const schemaList = record?.schemas ?? record?.schema_list;
  if (Array.isArray(schemaList)) {
    schemaList.forEach((item) => {
      const schema = asRecord(item);
      if (!schema) return;
      const schemaName = String(
        schema.name ?? schema.schema ?? schema.schema_name ?? schema.table_schema ?? "",
      );
      const tables = schema.tables ?? schema.table_names;
      if (!Array.isArray(tables)) return;
      tables.forEach((table) => {
        if (typeof table === "string") {
          push(schemaName, table, []);
          return;
        }
        const row = asRecord(table);
        if (!row) return;
        push(
          schemaName || String(row.table_schema ?? row.schema ?? ""),
          String(row.name ?? row.table_name ?? row.table ?? ""),
          columnList(row.columns ?? row.fields),
        );
      });
    });
  }

  const tableList =
    record?.tables ?? record?.table_names ?? (Array.isArray(root) ? root : undefined);
  if (Array.isArray(tableList)) {
    tableList.forEach((table) => {
      if (typeof table === "string") {
        const parts = table.split(".");
        const schema = parts.length > 1 ? parts[0] : "cvm";
        const name = parts.length > 1 ? parts.slice(1).join(".") : table;
        push(schema, name, []);
        return;
      }
      const row = asRecord(table);
      if (!row) return;
      push(
        String(row.table_schema ?? row.schema ?? row.schema_name ?? "cvm"),
        String(row.table_name ?? row.name ?? row.table ?? ""),
        columnList(row.columns ?? row.fields),
      );
    });
  }

  const rows = record?.rows ?? record?.records ?? record?.sample;
  if (Array.isArray(rows)) {
    rows.forEach((row) => {
      const recordRow = asRecord(row);
      if (!recordRow) return;
      const schema = String(
        recordRow.table_schema ??
          recordRow.TABLE_SCHEMA ??
          recordRow.schema_name ??
          recordRow.schema ??
          "",
      );
      const name = String(
        recordRow.table_name ?? recordRow.TABLE_NAME ?? recordRow.name ?? recordRow.table ?? "",
      );
      if (schema && name) push(schema, name, columnList(recordRow.columns));
    });
  }

  const userTables = collected.filter(
    (table) => !SYSTEM_SCHEMAS.has(table.schema.toLowerCase()),
  );
  return userTables.length > 0 ? userTables : collected;
}

export function resolveCatalogSelection(
  tables: DiscoveredTable[],
  currentSchema: string,
  currentTable: string,
): { schema: string; table: string; columns: DiscoveredColumn[] } {
  const schemas = [...new Set(tables.map((table) => table.schema))];
  const currentSchemaMatch = schemas.find(
    (schema) => schema.toLowerCase() === currentSchema.trim().toLowerCase(),
  );
  const schema =
    currentSchemaMatch ||
    (schemas.length === 1 ? schemas[0] : currentSchema.trim() || "cvm");
  const inSchema = tables.filter(
    (table) => table.schema.toLowerCase() === schema.toLowerCase(),
  );
  const currentTableMatch = inSchema.find(
    (table) => table.name.toLowerCase() === currentTable.trim().toLowerCase(),
  );
  const table = currentTableMatch
    ? currentTableMatch.name
    : currentTable.trim()
      ? currentTable.trim()
      : inSchema.length === 1
        ? inSchema[0].name
        : "";
  const chosen = inSchema.find(
    (item) => item.name.toLowerCase() === table.toLowerCase(),
  );
  return { schema, table, columns: chosen?.columns ?? [] };
}

export function columnsFromApiPayload(payload: unknown): DiscoveredColumn[] {
  const root =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data ?? payload
      : payload;
  if (!root || typeof root !== "object") return [];
  const body = root as Record<string, unknown>;
  const list = body.columns ?? body.fields ?? body.column_names;
  if (Array.isArray(list)) {
    return list
      .map((item) => {
        if (typeof item === "string") {
          return { name: item.trim(), dataType: "string" as FieldDataType };
        }
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const name = String(row.name ?? row.column_name ?? row.field ?? "").trim();
        if (!name) return null;
        return {
          name,
          dataType: dataTypeFromSql(
            String(row.data_type ?? row.type ?? row.dataType ?? ""),
          ),
        };
      })
      .filter((column): column is DiscoveredColumn => Boolean(column));
  }
  const rows = body.rows ?? body.records ?? body.sample;
  if (Array.isArray(rows)) return columnsFromRecords(rows);
  return [];
}

function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let current = "";
  let depth = 0;
  let quote: "'" | '"' | "`" | null = null;
  for (let index = 0; index < list.length; index += 1) {
    const char = list[index];
    if (quote) {
      current += char;
      if (char === quote) {
        if (list[index + 1] === quote) {
          current += list[index + 1];
          index += 1;
        } else {
          quote = null;
        }
      }
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      current += char;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      current += char;
      continue;
    }
    if (char === "," && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function selectList(sql: string): string {
  const source = sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--.*$/gm, " ");
  let depth = 0;
  let quote: "'" | '"' | "`" | null = null;
  let selectAt = -1;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === quote) {
        if (source[index + 1] === quote) index += 1;
        else quote = null;
      }
      continue;
    }
    if (char === "'" || char === '"' || char === "`") {
      quote = char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth !== 0) continue;
    const word = source.slice(index).match(/^[A-Za-z_]+/)?.[0]?.toLowerCase();
    if (word === "select" && selectAt < 0) {
      selectAt = index + word.length;
      index += word.length - 1;
      continue;
    }
    if (word === "from" && selectAt >= 0) {
      return source.slice(selectAt, index);
    }
  }
  return "";
}

export function extractSelectColumns(sql: string): DiscoveredColumn[] {
  const list = selectList(sql);
  if (!list.trim()) return [];
  const names: string[] = [];
  splitTopLevel(list).forEach((part) => {
    const expression = part.trim();
    if (!expression || expression === "*" || /\.\*\s*$/.test(expression)) return;
    const alias = expression.match(
      /\bas\s+(?:"([^"]+)"|`([^`]+)`|\[([^\]]+)\]|([A-Za-z_][\w$]*))\s*$/i,
    );
    const named = alias?.[1] || alias?.[2] || alias?.[3] || alias?.[4];
    if (named) {
      names.push(named);
      return;
    }
    const tail = expression.match(
      /(?:^|\.)(?:"([^"]+)"|`([^`]+)`|([A-Za-z_][\w$]*))\s*$/,
    );
    const column = tail?.[1] || tail?.[2] || tail?.[3];
    if (column && column.toLowerCase() !== "from") names.push(column);
  });
  const seen = new Set<string>();
  return names
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLowerCase();
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((name) => ({ name, dataType: "string" as FieldDataType }));
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function columnsFromHeaderRow(
  headers: string[],
  sample: unknown[] | undefined,
  hasHeaders: boolean,
): DiscoveredColumn[] {
  const width = Math.max(headers.length, sample?.length || 0);
  const columns: DiscoveredColumn[] = [];
  for (let index = 0; index < width; index += 1) {
    const header = hasHeaders ? String(headers[index] || "").trim() : "";
    const name = header || `column_${index + 1}`;
    columns.push({
      name,
      dataType: sample ? dataTypeFromValue(sample[index]) : "string",
    });
  }
  return columns.filter((column) => column.name);
}

function valueAtPath(value: unknown, path: string): unknown {
  if (!path.trim()) return value;
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

export function columnsFromJsonSample(
  parsed: unknown,
  responsePath = "",
): DiscoveredColumn[] {
  const located = valueAtPath(parsed, responsePath);
  if (Array.isArray(located)) return columnsFromRecords(located);
  if (located && typeof located === "object") {
    return columnsFromRecords([located]);
  }
  if (Array.isArray(parsed)) return columnsFromRecords(parsed);
  if (parsed && typeof parsed === "object") return columnsFromRecords([parsed]);
  return [];
}

const SAMPLE_ROW_LIMIT = 20;

function recordsFromMatrix(
  rows: unknown[][],
  hasHeaders: boolean,
): Record<string, unknown>[] {
  const filled = rows.filter((row) =>
    row.some((cell) => String(cell || "").trim()),
  );
  if (filled.length === 0) return [];
  const header = (filled[0] || []).map((cell) => String(cell || "").trim());
  const dataRows = hasHeaders ? filled.slice(1) : filled;
  return dataRows.slice(0, SAMPLE_ROW_LIMIT).map((row) => {
    const record: Record<string, unknown> = {};
    const width = Math.max(header.length, row.length);
    for (let index = 0; index < width; index += 1) {
      const name = hasHeaders
        ? header[index] || `column_${index + 1}`
        : `column_${index + 1}`;
      record[name] = row[index] ?? "";
    }
    return record;
  });
}

function recordsFromJson(parsed: unknown, responsePath = ""): Record<string, unknown>[] {
  const located = valueAtPath(parsed, responsePath);
  const source = Array.isArray(located)
    ? located
    : located && typeof located === "object"
      ? [located]
      : Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object"
          ? [parsed]
          : [];
  return source
    .filter((row) => row && typeof row === "object" && !Array.isArray(row))
    .slice(0, SAMPLE_ROW_LIMIT) as Record<string, unknown>[];
}

export async function recordsFromSampleFile(
  file: File,
  options: {
    fileFormat: string;
    delimiter: string;
    hasHeaders: boolean;
    responsePath?: string;
  },
): Promise<Record<string, unknown>[]> {
  const format = options.fileFormat.toLowerCase();
  if (format === "parquet" || format === "fixed_width") {
    throw new Error(
      "This file format cannot be sampled in the browser. Upload CSV, TSV, JSON, or Excel.",
    );
  }

  if (format === "json") {
    const records = recordsFromJson(
      JSON.parse(await file.text()) as unknown,
      options.responsePath,
    );
    if (records.length === 0) {
      throw new Error("The sample JSON does not contain any records.");
    }
    return records;
  }

  if (format === "csv" || format === "tsv") {
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const delimiter = format === "tsv" ? "\t" : options.delimiter || ",";
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) throw new Error("The sample file is empty.");
    const matrix = lines.map((line) => splitCsvLine(line, delimiter));
    const records = recordsFromMatrix(matrix, options.hasHeaders);
    if (records.length === 0 && options.hasHeaders) {
      throw new Error("The sample file has headers but no data rows.");
    }
    return records;
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown[][];
  const records = recordsFromMatrix(rows, options.hasHeaders);
  if (records.length === 0) throw new Error("The sample workbook has no data rows.");
  return records;
}

export async function columnsFromSampleFile(
  file: File,
  options: {
    fileFormat: string;
    delimiter: string;
    hasHeaders: boolean;
    responsePath?: string;
  },
): Promise<DiscoveredColumn[]> {
  const format = options.fileFormat.toLowerCase();
  if (format === "parquet" || format === "fixed_width") {
    throw new Error(
      "This file format cannot be read in the browser. Upload a CSV or Excel file with the same columns.",
    );
  }

  if (format === "json") {
    const parsed = JSON.parse(await file.text()) as unknown;
    const columns = columnsFromJsonSample(parsed, options.responsePath);
    if (columns.length === 0) {
      throw new Error("The sample JSON does not contain any fields.");
    }
    return columns;
  }

  if (format === "csv" || format === "tsv") {
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const delimiter = format === "tsv" ? "\t" : options.delimiter || ",";
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) throw new Error("The sample file is empty.");
    const header = splitCsvLine(lines[0], delimiter);
    const sample = lines[1] ? splitCsvLine(lines[1], delimiter) : undefined;
    const columns = columnsFromHeaderRow(header, sample, options.hasHeaders);
    if (columns.length === 0) throw new Error("No columns were found in the sample file.");
    return columns;
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as unknown[][];
  const filled = rows.filter((row) => row.some((cell) => String(cell || "").trim()));
  if (filled.length === 0) throw new Error("The sample workbook is empty.");
  const header = (filled[0] || []).map((cell) => String(cell || "").trim());
  const columns = columnsFromHeaderRow(
    header,
    filled[1]?.map((cell) => String(cell || "")),
    options.hasHeaders,
  );
  if (columns.length === 0) throw new Error("No columns were found in the sample workbook.");
  return columns;
}

function columnsFromMatrix(
  rows: unknown[][],
  hasHeaders: boolean,
): DiscoveredColumn[] {
  const filled = rows.filter((row) =>
    row.some((cell) => String(cell || "").trim()),
  );
  if (filled.length === 0) return [];
  const header = (filled[0] || []).map((cell) => String(cell || "").trim());
  return columnsFromHeaderRow(
    header,
    filled[1]?.map((cell) => String(cell || "")),
    hasHeaders,
  );
}

function rememberTable(
  tables: DiscoveredTable[],
  schema: string,
  rawName: string,
  columns: DiscoveredColumn[],
): void {
  const used = new Set(tables.map((table) => table.name.toLowerCase()));
  let name = toColumnIdentifier(rawName);
  const base = name;
  let suffix = 2;
  while (used.has(name.toLowerCase())) {
    name = `${base}_${suffix}`.slice(0, 100);
    suffix += 1;
  }
  if (!IDENTIFIER.test(schema) || !IDENTIFIER.test(name) || columns.length === 0) return;
  tables.push({ schema, name, columns });
}

export async function tablesFromSampleFile(
  file: File,
  options: {
    schema: string;
    delimiter: string;
    hasHeaders: boolean;
    responsePath?: string;
  },
): Promise<DiscoveredTable[]> {
  const schema = toColumnIdentifier(options.schema || "cvm");
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  if (extension === "parquet") {
    throw new Error(
      "Parquet cannot be read in the browser. Upload a CSV or Excel file that uses the same table names.",
    );
  }

  if (extension === "json") {
    const parsed = JSON.parse(await file.text()) as unknown;
    const located = valueAtPath(parsed, options.responsePath || "");
    const record = asRecord(located ?? parsed);
    const tables: DiscoveredTable[] = [];
    if (record) {
      const entries = Object.entries(record).filter(
        ([, value]) => Array.isArray(value) && value.length > 0,
      );
      if (entries.length > 0 && entries.length === Object.keys(record).length) {
        entries.forEach(([key, value]) => {
          rememberTable(tables, schema, key, columnsFromRecords(value as unknown[]));
        });
      }
    }
    if (tables.length > 0) return tables;
    const columns = columnsFromJsonSample(parsed, options.responsePath);
    if (columns.length === 0) {
      throw new Error("The sample JSON does not contain any tables or fields.");
    }
    rememberTable(tables, schema, file.name.replace(/\.[^.]+$/, ""), columns);
    if (tables.length === 0) throw new Error("The file name is not a usable table name.");
    return tables;
  }

  if (extension === "csv" || extension === "tsv" || extension === "txt") {
    const text = (await file.text()).replace(/^\uFEFF/, "");
    const delimiter = extension === "tsv" ? "\t" : options.delimiter || ",";
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) throw new Error("The sample file is empty.");
    const header = splitCsvLine(lines[0], delimiter);
    const sample = lines[1] ? splitCsvLine(lines[1], delimiter) : undefined;
    const columns = columnsFromHeaderRow(header, sample, options.hasHeaders);
    const tables: DiscoveredTable[] = [];
    rememberTable(tables, schema, file.name.replace(/\.[^.]+$/, ""), columns);
    if (tables.length === 0) {
      throw new Error("No table name could be read from the sample file.");
    }
    return tables;
  }

  if (extension !== "xlsx" && extension !== "xls") {
    throw new Error("Upload a CSV, TSV, JSON, or Excel file.");
  }

  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const tables: DiscoveredTable[] = [];
  workbook.SheetNames.forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: "",
    }) as unknown[][];
    rememberTable(tables, schema, sheetName, columnsFromMatrix(rows, options.hasHeaders));
  });
  if (tables.length === 0) {
    throw new Error("The workbook has no sheets with column headers.");
  }
  return tables;
}
