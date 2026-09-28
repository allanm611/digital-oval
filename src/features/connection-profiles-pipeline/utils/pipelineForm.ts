import {
  DatabaseQuerySourceConfig,
  FieldMapping,
  FieldMappingDraft,
  FtpFileSourceConfig,
  PipelineFormState,
  PipelineSourceType,
  PipelineWritePayload,
  RestApiSourceConfig,
  ConnectionProfilePipeline,
} from "../types/pipeline";

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function createMappingKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `map-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyFtpConfig(): FtpFileSourceConfig {
  return {
    remote_path: "/",
    file_pattern: "*.csv",
    file_format: "csv",
    delimiter: ",",
    has_header: true,
    encoding: "utf-8",
    archive_after_read: false,
    archive_path: "",
  };
}

export function emptyDatabaseConfig(): DatabaseQuerySourceConfig {
  return {
    query: "",
    incremental_column: "",
    incremental_type: "none",
    parameters_json: "",
  };
}

export function emptyRestConfig(): RestApiSourceConfig {
  return {
    endpoint: "",
    method: "GET",
    response_path: "",
    pagination: "none",
    page_param: "page",
    size_param: "pageSize",
    page_size: 100,
    query_params_json: "",
    headers_json: "",
    body_template: "",
  };
}

export function emptyMapping(): FieldMappingDraft {
  return {
    key: createMappingKey(),
    source_field: "",
    target_column: "",
    data_type: "string",
    conversion: "none",
    format: "",
    default_value: "",
    required: false,
    is_upsert_key: false,
  };
}

export function emptyPipelineForm(
  profileId?: string | number | null,
): PipelineFormState {
  return {
    connection_profile_id: profileId ? String(profileId) : "",
    pipeline_name: "",
    action_type: "PULL",
    source_type: "DATABASE_QUERY",
    ftp: emptyFtpConfig(),
    database: emptyDatabaseConfig(),
    rest: emptyRestConfig(),
    mappings: [emptyMapping()],
    target_schema: "cvm",
    target_table: "",
    load_strategy: "BATCH_INSERT",
    batch_size: "1000",
    is_active: true,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function asString(value: unknown, fallback = ""): string {
  if (value === undefined || value === null) return fallback;
  return String(value);
}

function asBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function parseJsonObject(
  raw: string,
): { ok: true; value: Record<string, unknown> } | { ok: false } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: {} };
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false };
    }
    return { ok: true, value: parsed as Record<string, unknown> };
  } catch {
    return { ok: false };
  }
}

function jsonToEditor(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  if (Object.keys(value as object).length === 0) return "";
  return JSON.stringify(value, null, 2);
}

export function hydrateSourceConfig(
  sourceType: PipelineSourceType,
  sourceConfig: Record<string, unknown>,
): Pick<PipelineFormState, "ftp" | "database" | "rest"> {
  const ftp = emptyFtpConfig();
  const database = emptyDatabaseConfig();
  const rest = emptyRestConfig();

  if (sourceType === "FTP_FILE") {
    ftp.remote_path = asString(sourceConfig.remote_path, "/");
    ftp.file_pattern = asString(sourceConfig.file_pattern, "*.csv");
    ftp.file_format =
      (asString(sourceConfig.file_format, "csv") as FtpFileSourceConfig["file_format"]) ||
      "csv";
    ftp.delimiter = asString(sourceConfig.delimiter, ",");
    ftp.has_header = asBoolean(sourceConfig.has_header, true);
    ftp.encoding = asString(sourceConfig.encoding, "utf-8");
    ftp.archive_after_read = asBoolean(sourceConfig.archive_after_read, false);
    ftp.archive_path = asString(sourceConfig.archive_path);
  }

  if (sourceType === "DATABASE_QUERY") {
    database.query = asString(sourceConfig.query);
    database.incremental_column = asString(sourceConfig.incremental_column);
    const incrementalType = asString(sourceConfig.incremental_type, "none");
    database.incremental_type =
      incrementalType === "timestamp" || incrementalType === "numeric"
        ? incrementalType
        : "none";
    database.parameters_json = jsonToEditor(sourceConfig.parameters);
  }

  if (sourceType === "REST_API") {
    rest.endpoint = asString(sourceConfig.endpoint);
    rest.method = asString(sourceConfig.method, "GET") === "POST" ? "POST" : "GET";
    rest.response_path = asString(sourceConfig.response_path);
    const pagination = asString(sourceConfig.pagination, "none");
    rest.pagination =
      pagination === "offset" || pagination === "page" || pagination === "cursor"
        ? pagination
        : "none";
    rest.page_param = asString(sourceConfig.page_param, "page");
    rest.size_param = asString(sourceConfig.size_param, "pageSize");
    rest.page_size = Number(sourceConfig.page_size ?? 100) || 100;
    rest.query_params_json = jsonToEditor(sourceConfig.query_params);
    rest.headers_json = jsonToEditor(sourceConfig.headers);
    rest.body_template = asString(sourceConfig.body_template);
  }

  return { ftp, database, rest };
}

export function formFromPipeline(
  pipeline: ConnectionProfilePipeline,
): PipelineFormState {
  const source = hydrateSourceConfig(pipeline.source_type, pipeline.source_config);
  const mappings =
    pipeline.field_mappings.length > 0
      ? pipeline.field_mappings.map((mapping) => ({
          ...mapping,
          key: createMappingKey(),
          format: mapping.format ?? "",
          default_value: mapping.default_value ?? "",
        }))
      : [emptyMapping()];

  return {
    connection_profile_id: String(pipeline.connection_profile_id),
    pipeline_name: pipeline.pipeline_name,
    action_type: pipeline.action_type,
    source_type: pipeline.source_type,
    ...source,
    mappings,
    target_schema: pipeline.target_schema || "cvm",
    target_table: pipeline.target_table,
    load_strategy: pipeline.load_strategy,
    batch_size: String(pipeline.batch_size || 1000),
    is_active: pipeline.is_active,
  };
}

export function buildSourceConfig(
  form: PipelineFormState,
): Record<string, unknown> {
  if (form.source_type === "FTP_FILE") {
    const config: Record<string, unknown> = {
      remote_path: form.ftp.remote_path.trim(),
      file_pattern: form.ftp.file_pattern.trim(),
      file_format: form.ftp.file_format,
      delimiter: form.ftp.delimiter,
      has_header: form.ftp.has_header,
      encoding: form.ftp.encoding.trim() || "utf-8",
      archive_after_read: form.ftp.archive_after_read,
    };
    if (form.ftp.archive_path.trim()) {
      config.archive_path = form.ftp.archive_path.trim();
    }
    return config;
  }

  if (form.source_type === "DATABASE_QUERY") {
    const parameters = parseJsonObject(form.database.parameters_json);
    const config: Record<string, unknown> = {
      query: form.database.query.trim(),
      incremental_type: form.database.incremental_type,
      parameters: parameters.ok ? parameters.value : {},
    };
    if (form.database.incremental_column.trim()) {
      config.incremental_column = form.database.incremental_column.trim();
    }
    return config;
  }

  const queryParams = parseJsonObject(form.rest.query_params_json);
  const headers = parseJsonObject(form.rest.headers_json);
  const config: Record<string, unknown> = {
    endpoint: form.rest.endpoint.trim(),
    method: form.rest.method,
    response_path: form.rest.response_path.trim(),
    pagination: form.rest.pagination,
    query_params: queryParams.ok ? queryParams.value : {},
    headers: headers.ok ? headers.value : {},
  };
  if (form.rest.pagination !== "none") {
    config.page_param = form.rest.page_param.trim() || "page";
    config.size_param = form.rest.size_param.trim() || "pageSize";
    config.page_size = Number(form.rest.page_size) || 100;
  }
  if (form.rest.body_template.trim()) {
    config.body_template = form.rest.body_template;
  }
  return config;
}

export function buildFieldMappings(form: PipelineFormState): FieldMapping[] {
  return form.mappings
    .filter(
      (mapping) =>
        mapping.source_field.trim() || mapping.target_column.trim(),
    )
    .map((mapping) => {
      const next: FieldMapping = {
        source_field: mapping.source_field.trim(),
        target_column: mapping.target_column.trim(),
        data_type: mapping.data_type,
        conversion: mapping.conversion,
        required: mapping.required,
        is_upsert_key: mapping.is_upsert_key,
      };
      if (mapping.format?.trim()) next.format = mapping.format.trim();
      if (mapping.default_value?.trim()) {
        next.default_value = mapping.default_value.trim();
      }
      return next;
    });
}

export function buildPipelinePayload(
  form: PipelineFormState,
): PipelineWritePayload {
  return {
    connection_profile_id: Number(form.connection_profile_id),
    pipeline_name: form.pipeline_name.trim(),
    action_type: form.action_type,
    source_type: form.source_type,
    source_config: buildSourceConfig(form),
    field_mappings: buildFieldMappings(form),
    target_schema: form.target_schema.trim() || "cvm",
    target_table: form.target_table.trim(),
    load_strategy: form.load_strategy,
    batch_size: Number(form.batch_size),
    is_active: form.is_active,
  };
}

export function validatePipelineForm(
  form: PipelineFormState,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.connection_profile_id) {
    errors.connection_profile_id = "Select the connection profile this pipeline uses.";
  }

  const name = form.pipeline_name.trim();
  if (!name) errors.pipeline_name = "Pipeline name is required.";
  else if (name.length > 150) {
    errors.pipeline_name = "Pipeline name must be 150 characters or fewer.";
  }

  if (form.source_type === "FTP_FILE") {
    if (!form.ftp.remote_path.trim()) {
      errors.remote_path = "Remote path is required.";
    }
    if (!form.ftp.file_pattern.trim()) {
      errors.file_pattern = "File pattern is required.";
    }
  }

  if (form.source_type === "DATABASE_QUERY") {
    if (!form.database.query.trim()) {
      errors.query = "SQL query is required.";
    }
    if (!parseJsonObject(form.database.parameters_json).ok) {
      errors.parameters_json = "Parameters must be a JSON object, for example {\"status\": \"active\"}.";
    }
  }

  if (form.source_type === "REST_API") {
    if (!form.rest.endpoint.trim()) {
      errors.endpoint = "Endpoint path is required.";
    }
    if (!parseJsonObject(form.rest.query_params_json).ok) {
      errors.query_params_json = "Query parameters must be a JSON object.";
    }
    if (!parseJsonObject(form.rest.headers_json).ok) {
      errors.headers_json = "Headers must be a JSON object.";
    }
    if (
      form.rest.pagination !== "none" &&
      (!Number.isInteger(Number(form.rest.page_size)) ||
        Number(form.rest.page_size) < 1)
    ) {
      errors.page_size = "Page size must be a whole number greater than 0.";
    }
  }

  const schema = form.target_schema.trim() || "cvm";
  if (!IDENTIFIER.test(schema) || schema.length > 50) {
    errors.target_schema = "Use a schema name such as cvm.";
  }

  const table = form.target_table.trim();
  if (!table) errors.target_table = "Target table is required.";
  else if (!IDENTIFIER.test(table) || table.length > 100) {
    errors.target_table =
      "Enter the table name only, such as tracking_events. Keep the schema in its own field.";
  }

  const batch = Number(form.batch_size);
  if (!Number.isInteger(batch) || batch < 1 || batch > 100000) {
    errors.batch_size = "Batch size must be a whole number from 1 to 100000.";
  }

  const seen = new Set<string>();
  form.mappings.forEach((mapping, index) => {
    const source = mapping.source_field.trim();
    const target = mapping.target_column.trim();
    if (!source && !target) return;
    if (!source) {
      errors[`mapping_${index}_source`] = "Source field is required.";
    }
    if (!target) {
      errors[`mapping_${index}_target`] = "Target column is required.";
    } else if (!IDENTIFIER.test(target)) {
      errors[`mapping_${index}_target`] = "Use a column name without spaces or dots.";
    } else if (seen.has(target.toLowerCase())) {
      errors[`mapping_${index}_target`] = "This target column is already mapped.";
    } else {
      seen.add(target.toLowerCase());
    }
  });

  const persisted = buildFieldMappings(form);
  if (
    form.load_strategy === "UPSERT" &&
    !persisted.some((mapping) => mapping.is_upsert_key)
  ) {
    errors.load_strategy =
      "Upsert needs at least one mapped field marked as the match key.";
  }

  return errors;
}

export function normalizeFieldMappings(value: unknown): FieldMapping[] {
  let rows: unknown = value;
  if (typeof value === "string") {
    try {
      rows = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => {
      const mapping = row as Record<string, unknown>;
      return {
        source_field: asString(mapping.source_field),
        target_column: asString(mapping.target_column),
        data_type: (asString(mapping.data_type, "string") ||
          "string") as FieldMapping["data_type"],
        conversion: (asString(mapping.conversion, "none") ||
          "none") as FieldMapping["conversion"],
        format: asString(mapping.format) || undefined,
        default_value: asString(mapping.default_value) || undefined,
        required: asBoolean(mapping.required, false),
        is_upsert_key: asBoolean(mapping.is_upsert_key, false),
      };
    });
}

export function normalizeSourceConfig(value: unknown): Record<string, unknown> {
  return asRecord(value);
}
