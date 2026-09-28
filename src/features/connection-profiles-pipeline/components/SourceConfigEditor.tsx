import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import FormField from "../../../shared/components/FormField";
import { FILE_FORMAT_OPTIONS } from "../constants/pipelineOptions";
import { PipelineFormState, PipelineSourceType } from "../types/pipeline";

interface SourceConfigEditorProps {
  sourceType: PipelineSourceType;
  form: PipelineFormState;
  errors: Record<string, string>;
  onChange: (patch: Partial<PipelineFormState>) => void;
}

export default function SourceConfigEditor({
  sourceType,
  form,
  errors,
  onChange,
}: SourceConfigEditorProps) {
  if (sourceType === "FTP_FILE") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField error={errors.remote_path}>
          <Input
            label="Remote path*"
            placeholder="/incoming/cdr"
            value={form.ftp.remote_path}
            hasError={!!errors.remote_path}
            onChange={(value) =>
              onChange({
                ftp: { ...form.ftp, remote_path: String(value) },
              })
            }
          />
        </FormField>
        <FormField error={errors.file_pattern}>
          <Input
            label="File pattern*"
            placeholder="voice_sms_*.csv"
            value={form.ftp.file_pattern}
            hasError={!!errors.file_pattern}
            onChange={(value) =>
              onChange({
                ftp: { ...form.ftp, file_pattern: String(value) },
              })
            }
          />
        </FormField>
        <HeadlessSelect
          label="File format"
          value={form.ftp.file_format}
          options={FILE_FORMAT_OPTIONS}
          onChange={(value) =>
            onChange({
              ftp: {
                ...form.ftp,
                file_format: String(value) as PipelineFormState["ftp"]["file_format"],
              },
            })
          }
        />
        <Input
          label="Delimiter"
          value={form.ftp.delimiter}
          onChange={(value) =>
            onChange({ ftp: { ...form.ftp, delimiter: String(value) } })
          }
        />
        <Input
          label="Encoding"
          value={form.ftp.encoding}
          onChange={(value) =>
            onChange({ ftp: { ...form.ftp, encoding: String(value) } })
          }
        />
        <Input
          label="Archive path"
          placeholder="/archive/cdr"
          value={form.ftp.archive_path}
          onChange={(value) =>
            onChange({ ftp: { ...form.ftp, archive_path: String(value) } })
          }
        />
        <label className="flex items-center gap-3 text-sm text-gray-700 md:col-span-2">
          <Checkbox
            checked={form.ftp.has_header}
            onChange={(event) =>
              onChange({
                ftp: { ...form.ftp, has_header: event.target.checked },
              })
            }
          />
          First row contains column names
        </label>
        <label className="flex items-center gap-3 text-sm text-gray-700 md:col-span-2">
          <Checkbox
            checked={form.ftp.archive_after_read}
            onChange={(event) =>
              onChange({
                ftp: { ...form.ftp, archive_after_read: event.target.checked },
              })
            }
          />
          Move the file after a successful read
        </label>
      </div>
    );
  }

  if (sourceType === "DATABASE_QUERY") {
    return (
      <div className="space-y-6">
        <FormField error={errors.query}>
          <Textarea
            label="SQL query*"
            rows={8}
            value={form.database.query}
            hasError={!!errors.query}
            placeholder="SELECT event_id, msisdn, event_time FROM source.events WHERE event_time > :watermark"
            onChange={(value) =>
              onChange({
                database: { ...form.database, query: value },
              })
            }
          />
        </FormField>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Incremental column"
            placeholder="event_time"
            value={form.database.incremental_column}
            onChange={(value) =>
              onChange({
                database: {
                  ...form.database,
                  incremental_column: String(value),
                },
              })
            }
          />
          <HeadlessSelect
            label="Incremental type"
            value={form.database.incremental_type}
            options={[
              { value: "none", label: "Full extract" },
              { value: "timestamp", label: "Timestamp watermark" },
              { value: "numeric", label: "Numeric watermark" },
            ]}
            onChange={(value) =>
              onChange({
                database: {
                  ...form.database,
                  incremental_type: String(
                    value,
                  ) as PipelineFormState["database"]["incremental_type"],
                },
              })
            }
          />
        </div>
        <FormField error={errors.parameters_json}>
          <Textarea
            label="Query parameters (JSON object)"
            rows={4}
            value={form.database.parameters_json}
            hasError={!!errors.parameters_json}
            placeholder={'{\n  "status": "active"\n}'}
            onChange={(value) =>
              onChange({
                database: { ...form.database, parameters_json: value },
              })
            }
          />
        </FormField>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField error={errors.endpoint}>
          <Input
            label="Endpoint path*"
            placeholder="/v1/events"
            value={form.rest.endpoint}
            hasError={!!errors.endpoint}
            onChange={(value) =>
              onChange({ rest: { ...form.rest, endpoint: String(value) } })
            }
          />
        </FormField>
        <HeadlessSelect
          label="Method"
          value={form.rest.method}
          options={[
            { value: "GET", label: "GET" },
            { value: "POST", label: "POST" },
          ]}
          onChange={(value) =>
            onChange({
              rest: {
                ...form.rest,
                method: String(value) === "POST" ? "POST" : "GET",
              },
            })
          }
        />
        <Input
          label="Response path"
          placeholder="data.items"
          value={form.rest.response_path}
          onChange={(value) =>
            onChange({
              rest: { ...form.rest, response_path: String(value) },
            })
          }
        />
        <HeadlessSelect
          label="Pagination"
          value={form.rest.pagination}
          options={[
            { value: "none", label: "None" },
            { value: "page", label: "Page number" },
            { value: "offset", label: "Offset" },
            { value: "cursor", label: "Cursor" },
          ]}
          onChange={(value) =>
            onChange({
              rest: {
                ...form.rest,
                pagination: String(value) as PipelineFormState["rest"]["pagination"],
              },
            })
          }
        />
      </div>
      {form.rest.pagination !== "none" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Page parameter"
            value={form.rest.page_param}
            onChange={(value) =>
              onChange({ rest: { ...form.rest, page_param: String(value) } })
            }
          />
          <Input
            label="Size parameter"
            value={form.rest.size_param}
            onChange={(value) =>
              onChange({ rest: { ...form.rest, size_param: String(value) } })
            }
          />
          <FormField error={errors.page_size}>
            <Input
              label="Page size"
              type="number"
              value={form.rest.page_size}
              hasError={!!errors.page_size}
              onChange={(value) =>
                onChange({
                  rest: { ...form.rest, page_size: Number(value) || 0 },
                })
              }
            />
          </FormField>
        </div>
      )}
      <FormField error={errors.query_params_json}>
        <Textarea
          label="Query parameters (JSON object)"
          rows={3}
          value={form.rest.query_params_json}
          hasError={!!errors.query_params_json}
          onChange={(value) =>
            onChange({ rest: { ...form.rest, query_params_json: value } })
          }
        />
      </FormField>
      <FormField error={errors.headers_json}>
        <Textarea
          label="Headers (JSON object)"
          rows={3}
          value={form.rest.headers_json}
          hasError={!!errors.headers_json}
          placeholder={'{\n  "Accept": "application/json"\n}'}
          onChange={(value) =>
            onChange({ rest: { ...form.rest, headers_json: value } })
          }
        />
      </FormField>
      {form.rest.method === "POST" && (
        <Textarea
          label="Request body template"
          rows={4}
          value={form.rest.body_template}
          onChange={(value) =>
            onChange({ rest: { ...form.rest, body_template: value } })
          }
        />
      )}
    </div>
  );
}
