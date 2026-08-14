import { useEffect, useState } from "react";
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

interface ChannelOption {
  value: string;
  label: string;
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
    setIsActive(initialData.is_active !== false);
    setFields(initialData.field_schema?.fields || []);
  }, [initialData]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Provider name is required";
    else if (name.trim().length > 100) {
      next.name = "Provider name must be 100 characters or less";
    }
    if (mode === "create" && !channelId) {
      next.channel_id = "Communication channel is required";
    }

    Object.assign(next, validateFieldSchema(fields));
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const field_schema = {
      fields: fields.map((field) => ({
        name: field.name.trim(),
        label: field.label.trim(),
        type: field.type,
        required: !!field.required,
        ...(field.placeholder?.trim()
          ? { placeholder: field.placeholder.trim() }
          : {}),
        ...(field.type === "select"
          ? {
              options: (field.options || [])
                .map((o) => o.trim())
                .filter(Boolean),
            }
          : {}),
      })),
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
                onChange={setChannelId}
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
          errors={errors}
          disabled={isLoading}
          onChange={setFields}
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
