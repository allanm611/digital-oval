import { useMemo, useState } from "react";
import { Copy, Loader2, Upload } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { pipelineRuntimeService } from "../services/pipelineRuntimeService";
import { ConnectionProfilePipeline, InboundAcceptance } from "../types/pipeline";

function EndpointRow({
  label,
  url,
  onCopy,
}: {
  label: string;
  url: string;
  onCopy: (url: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-600">{label}</p>
      <div className="flex items-start gap-2">
        <code className="min-w-0 flex-1 break-all text-xs text-gray-900">{url}</code>
        <button
          type="button"
          onClick={() => onCopy(url)}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium"
          style={{ color: color.primary.action }}
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
    </div>
  );
}

export default function PipelineInboundPanel({
  pipeline,
}: {
  pipeline: ConnectionProfilePipeline;
}) {
  const { success, error: showError } = useToast();
  const [payloadText, setPayloadText] = useState(
    '[\n  {\n    "msisdn": "256700000000",\n    "event": "sample"\n  }\n]',
  );
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [acceptance, setAcceptance] = useState<InboundAcceptance | null>(null);

  const jsonUrl = useMemo(
    () => pipelineRuntimeService.inboundJsonUrl(pipeline.id),
    [pipeline.id],
  );
  const jsonAliases = useMemo(
    () => pipelineRuntimeService.inboundJsonAliases(pipeline.id, pipeline.pipeline_name),
    [pipeline.id, pipeline.pipeline_name],
  );
  const fileUrl = useMemo(
    () => pipelineRuntimeService.inboundFileUrl(pipeline.id),
    [pipeline.id],
  );

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      success("Callback URL copied");
    } catch {
      showError("Unable to copy", "Copy the URL from the field instead.");
    }
  };

  const sendPayload = async () => {
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      showError("Invalid JSON", "The test payload must be a JSON object or array.");
      return;
    }
    if (
      payload === null ||
      (Array.isArray(payload) && payload.length === 0) ||
      (typeof payload === "object" && !Array.isArray(payload) && Object.keys(payload).length === 0)
    ) {
      showError("Empty payload", "Add at least one field before sending.");
      return;
    }
    setSending(true);
    try {
      const result = await pipelineRuntimeService.submitInboundPayload(pipeline.id, payload);
      setAcceptance(result);
      success("Payload accepted", result.tracking_id);
    } catch (error) {
      showError(
        "Unable to accept payload",
        extractBackendError(error, "The inbound callback rejected the payload."),
      );
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (file: File) => {
    setUploading(true);
    try {
      const result = await pipelineRuntimeService.submitInboundFile(pipeline.id, file);
      setAcceptance(result);
      success("File accepted", result.tracking_id);
    } catch (error) {
      showError(
        "Unable to accept file",
        extractBackendError(error, "The inbound file callback rejected the upload."),
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section
      className={`${tw.rounded} border border-gray-200 p-6 space-y-5`}
      style={{ backgroundColor: color.surface.cards }}
    >
      <div>
        <h2 className={`${tw.cardHeading} text-gray-900`}>Inbound callbacks</h2>
        <p className="mt-2 text-sm text-gray-600">
          External systems POST JSON or a file to this pipeline. The response is
          accepted immediately, then the saved field mappings load the rows into{" "}
          {pipeline.target_schema}.{pipeline.target_table}. The pipeline must be
          active.
        </p>
      </div>

      <EndpointRow label="JSON callback" url={jsonUrl} onCopy={copy} />
      {jsonAliases.map((url) => (
        <EndpointRow key={url} label="JSON alias" url={url} onCopy={copy} />
      ))}
      <EndpointRow label="File callback" url={fileUrl} onCopy={copy} />
      <p className="text-xs text-gray-500">
        File uploads use multipart field name <span className="font-medium">file</span>.
        CSV, TSV, and JSON are accepted.
      </p>

      <div className="space-y-2">
        <label className="text-sm text-gray-600" htmlFor="inbound-test-payload">
          Test JSON payload
        </label>
        <textarea
          id="inbound-test-payload"
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
          rows={8}
          className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-xs text-gray-900"
        />
        <button
          type="button"
          onClick={() => void sendPayload()}
          disabled={sending || !pipeline.is_active}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white ${tw.rounded} disabled:cursor-not-allowed disabled:opacity-50`}
          style={{ backgroundColor: color.primary.action }}
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send test payload
        </button>
      </div>

      <div>
        <input
          id="inbound-test-file"
          type="file"
          accept=".csv,.tsv,.json,.txt,text/csv,application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void sendFile(file);
          }}
        />
        <label
          htmlFor="inbound-test-file"
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium ${tw.rounded} border border-gray-300 ${
            uploading || !pipeline.is_active
              ? "pointer-events-none opacity-50"
              : "cursor-pointer"
          }`}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload test file
        </label>
      </div>

      {acceptance && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm text-gray-800">
          <p className="font-medium text-gray-900">{acceptance.status || "QUEUED"}</p>
          <p className="mt-1 break-all">Tracking ID: {acceptance.tracking_id}</p>
          {acceptance.filename && <p className="mt-1">File: {acceptance.filename}</p>}
        </div>
      )}
    </section>
  );
}
