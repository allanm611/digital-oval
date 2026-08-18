import { useEffect, useMemo, useState } from "react";
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
  applyProtocolFields,
  cloneProtocolFields,
  getGatewayProtocol,
  protocolSelectOptions,
  resolveGatewayProtocol,
} from "../../constants/gatewayProtocol";

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

export default function GatewayProviderForm({
  mode,
  isLoading,
  channels,
  initialData,
  onCancel,
  onSave,
}: GatewayProviderFormProps) {
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

  const protocolOptions = useMemo(
    () => protocolSelectOptions(selectedChannel?.code, selectedChannel?.label),
    [selectedChannel],
  );

  const protocolDefinition = getGatewayProtocol(protocol);

  const handleChannelChange = (nextChannelId: string) => {
    setChannelId(nextChannelId);
    const nextChannel = channels.find((ch) => ch.value === nextChannelId);
    const allowed = protocolSelectOptions(nextChannel?.code, nextChannel?.label);
    if (protocol && !allowed.some((p) => p.value === protocol)) {
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

  const handleProtocolChange = (nextProtocol: string) => {
    setFields(applyProtocolFields(nextProtocol, fields, protocol));
    setProtocol(nextProtocol);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.protocol;
      delete next.schema;
      return next;
    });
  };

  const handleResetToProtocolDefaults = () => {
    const preset = cloneProtocolFields(protocolDefinition?.fields || []);
    const protocolKeys = new Set(preset.map((f) => f.name));
    const customFields = fields.filter(
      (f) => f.name?.trim() && !protocolKeys.has(f.name),
    );
    setFields([...preset, ...customFields]);
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

    Object.assign(next, validateFieldSchema(fields, protocol));
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const field_schema = {
      protocol,
      fields: serializeFields(fields),
    };

    if (mode === "create") {
      onSave({
        name: name.trim(),
        channel_id: Number(channelId),
        field_schema,
        is_active: isActive,
      } as CreateGatewayProviderRequest);
      return;
    }

    // Backend update does not allow changing channel_id
    onSave({
      name: name.trim(),
      field_schema,
      is_active: isActive,
    } as UpdateGatewayProviderRequest);
  };

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
                    ? "Select protocol"
                    : "Select a channel first"
                }
                disabled={isLoading || (!channelId && mode === "create")}
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
          errors={errors}
          disabled={isLoading}
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
          disabled={isLoading}
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
