import { useEffect, useMemo, useRef, useState } from "react";
import Input from "../../../../shared/components/ui/Input";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import {
  color,
  tw,
  button,
  getButtonStyles,
} from "../../../../shared/utils/utils";
import {
  GatewayProvider,
  GatewayProviderField,
  CreateGatewayProviderRequest,
  UpdateGatewayProviderRequest,
} from "../../services/gatewayProviderService";
import GatewayProviderFieldSchemaEditor, {
  validateFieldSchema,
} from "./GatewayProviderFieldSchemaEditor";
import {
  CUSTOM_PROTOCOL,
  applyProtocolFields,
  cloneProtocolFields,
  protocolSelectOptions,
  resolveGatewayProtocol,
} from "../../constants/gatewayProtocol";
import { useGatewayProtocols } from "../../hooks/useGatewayProtocols";

interface ChannelOption {
  value: string;
  label: string;
  code?: string;
}

interface GatewayProviderFormProps {
  mode: "create" | "edit";
  isLoading: boolean;
  channels: ChannelOption[];
  initialData?: GatewayProvider | null;
  onCancel: () => void;
  onSave: (
    payload: CreateGatewayProviderRequest | UpdateGatewayProviderRequest,
  ) => void;
}

function serializeFields(fields: GatewayProviderField[]): GatewayProviderField[] {
  return fields.map((field) => ({
    name: field.name.trim(),
    label: field.label.trim(),
    type: field.type,
    required: !!field.required,
    ...(field.placeholder?.trim()
      ? { placeholder: field.placeholder.trim() }
      : {}),
    ...(field.default !== undefined ? { default: field.default } : {}),
    ...(field.type === "select"
      ? {
          options: (field.options || []).map((o) => o.trim()).filter(Boolean),
        }
      : {}),
  }));
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

export default function GatewayProviderForm({
  mode,
  isLoading,
  channels,
  initialData,
  onCancel,
  onSave,
}: GatewayProviderFormProps) {
  const {
    catalog,
    loading: protocolsLoading,
    getProtocol,
    fetchPreset,
  } = useGatewayProtocols();

  const [name, setName] = useState(initialData?.name || "");
  const [channelId, setChannelId] = useState(
    initialData?.channel_id ? String(initialData.channel_id) : "",
  );
  const [protocol, setProtocol] = useState(
    resolveGatewayProtocol(initialData || {}),
  );
  const [isActive, setIsActive] = useState(initialData?.is_active !== false);
  const [fields, setFields] = useState<GatewayProviderField[]>(
    initialData?.field_schema?.fields?.length
      ? initialData.field_schema.fields
      : [],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [presetLoading, setPresetLoading] = useState(false);

  const fieldsRef = useRef(fields);
  const protocolRef = useRef(protocol);
  const presetRequestRef = useRef<AbortController | null>(null);

  fieldsRef.current = fields;
  protocolRef.current = protocol;

  useEffect(() => {
    return () => {
      presetRequestRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name || "");
    setChannelId(
      initialData.channel_id ? String(initialData.channel_id) : "",
    );
    setProtocol(resolveGatewayProtocol(initialData));
    setIsActive(initialData.is_active !== false);
    setFields(initialData.field_schema?.fields || []);
  }, [initialData]);

  const selectedChannel = useMemo(
    () => channels.find((ch) => ch.value === channelId),
    [channels, channelId],
  );

  const protocolOptions = useMemo(() => {
    const options = protocolSelectOptions(
      selectedChannel?.code,
      selectedChannel?.label,
      catalog,
    );
    if (protocol && !options.some((item) => item.value === protocol)) {
      const definition = getProtocol(protocol);
      options.push({
        value: protocol,
        label: definition?.label || protocol.toUpperCase(),
      });
    }
    return options;
  }, [selectedChannel, catalog, protocol, getProtocol]);

  const protocolDefinition = getProtocol(protocol);

  const handleChannelChange = (nextChannelId: string) => {
    setChannelId(nextChannelId);
    const nextChannel = channels.find((ch) => ch.value === nextChannelId);
    const allowed = protocolSelectOptions(
      nextChannel?.code,
      nextChannel?.label,
      catalog,
    );
    if (protocol && !allowed.some((p) => p.value === protocol)) {
      presetRequestRef.current?.abort();
      setProtocol("");
      setFields([]);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.channel_id;
      delete next.protocol;
      return next;
    });
  };

  const handleProtocolChange = async (nextProtocol: string) => {
    const previousProtocol = protocolRef.current;
    setProtocol(nextProtocol);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.protocol;
      delete next.schema;
      return next;
    });

    presetRequestRef.current?.abort();
    const controller = new AbortController();
    presetRequestRef.current = controller;
    setPresetLoading(true);

    try {
      const presetFields = await fetchPreset(nextProtocol, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setFields(
        applyProtocolFields(
          nextProtocol,
          fieldsRef.current,
          previousProtocol,
          catalog,
          presetFields,
        ),
      );
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      setFields(
        applyProtocolFields(
          nextProtocol,
          fieldsRef.current,
          previousProtocol,
          catalog,
        ),
      );
    } finally {
      if (!controller.signal.aborted) {
        setPresetLoading(false);
      }
    }
  };

  const handleResetToProtocolDefaults = async () => {
    if (!protocol || protocol === CUSTOM_PROTOCOL) return;

    presetRequestRef.current?.abort();
    const controller = new AbortController();
    presetRequestRef.current = controller;
    setPresetLoading(true);

    try {
      const preset = await fetchPreset(protocol, {
        signal: controller.signal,
        refresh: true,
      });
      if (controller.signal.aborted) return;
      const protocolKeys = new Set(preset.map((field) => field.name));
      const customFields = fieldsRef.current.filter(
        (field) => field.name?.trim() && !protocolKeys.has(field.name),
      );
      setFields([...cloneProtocolFields(preset), ...customFields]);
    } catch (error) {
      if (isAbortError(error) || controller.signal.aborted) return;
      const fallback = cloneProtocolFields(protocolDefinition?.fields || []);
      const protocolKeys = new Set(fallback.map((field) => field.name));
      const customFields = fieldsRef.current.filter(
        (field) => field.name?.trim() && !protocolKeys.has(field.name),
      );
      setFields([...fallback, ...customFields]);
    } finally {
      if (!controller.signal.aborted) {
        setPresetLoading(false);
      }
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Provider name is required";
    else if (name.trim().length > 100) {
      next.name = "Provider name must be 100 characters or less";
    }
    if (mode === "create" && !channelId) {
      next.channel_id = "Communication channel is required";
    }
    if (!protocol) {
      next.protocol = "Protocol is required";
    } else if (
      protocolOptions.length > 0 &&
      !protocolOptions.some((p) => p.value === protocol)
    ) {
      next.protocol = "Select a protocol that matches this channel";
    }

    Object.assign(
      next,
      validateFieldSchema(fields, protocol, protocolDefinition),
    );
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (presetLoading) return;
    if (!validate()) return;

    const field_schema = {
      protocol,
      fields: serializeFields(fields),
    };

    if (mode === "create") {
      onSave({
        name: name.trim(),
        channel_id: Number(channelId),
        protocol,
        field_schema,
        is_active: isActive,
      } as CreateGatewayProviderRequest);
      return;
    }

    onSave({
      name: name.trim(),
      protocol,
      field_schema,
      is_active: isActive,
    } as UpdateGatewayProviderRequest);
  };

  const fieldsBusy = isLoading || presetLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-6`}>
          Basic Information
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                label="Provider Name *"
                value={name}
                onChange={setName}
                placeholder="e.g. Infobip SMPP, Twilio WhatsApp"
                disabled={isLoading}
                hasError={!!errors.name}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>
            <div>
              <HeadlessSelect
                label="Communication Channel *"
                value={channelId}
                onChange={handleChannelChange}
                options={channels}
                placeholder="Select channel"
                disabled={isLoading || mode === "edit"}
                error={!!errors.channel_id}
              />
              {errors.channel_id && (
                <p className="text-red-500 text-xs mt-1">{errors.channel_id}</p>
              )}
              {mode === "edit" && (
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  Channel cannot be changed after creation.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <HeadlessSelect
                label="Protocol *"
                value={protocol}
                onChange={handleProtocolChange}
                options={protocolOptions}
                placeholder={
                  channelId || mode === "edit"
                    ? protocolsLoading
                      ? "Loading protocols..."
                      : "Select protocol"
                    : "Select a channel first"
                }
                disabled={
                  isLoading ||
                  protocolsLoading ||
                  presetLoading ||
                  (!channelId && mode === "create")
                }
                error={!!errors.protocol}
              />
              {errors.protocol && (
                <p className="text-red-500 text-xs mt-1">{errors.protocol}</p>
              )}
              {protocolDefinition && (
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  {protocolDefinition.description}
                </p>
              )}
              {mode === "edit" && (
                <p className={`text-xs ${tw.textSecondary} mt-1`}>
                  Changing protocol replaces the standard connection fields.
                  Custom fields are kept. Existing configurations may need
                  updating.
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="provider-active"
              checked={isActive}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setIsActive(e.target.checked)
              }
              disabled={isLoading}
            />
            <span className={`text-sm font-medium ${tw.textPrimary}`}>
              Active
            </span>
          </label>
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <GatewayProviderFieldSchemaEditor
          fields={fields}
          protocol={protocol}
          protocolDefinition={protocolDefinition}
          errors={errors}
          disabled={fieldsBusy}
          loading={presetLoading}
          onChange={setFields}
          onResetToProtocolDefaults={handleResetToProtocolDefaults}
        />
        {mode === "edit" && (
          <p className={`text-xs ${tw.textSecondary} mt-4`}>
            Changing field keys can break existing gateway configurations that
            already store values under the old keys. Prefer adding fields or
            updating labels when configs are in use.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="transition-colors disabled:opacity-60"
          style={getButtonStyles(button.bordered)}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || presetLoading}
          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-60"
          style={{ backgroundColor: color.primary.action }}
        >
          {isLoading
            ? mode === "create"
              ? "Creating..."
              : "Updating..."
            : mode === "create"
              ? "Create Provider"
              : "Update Provider"}
        </button>
      </div>
    </form>
  );
}
