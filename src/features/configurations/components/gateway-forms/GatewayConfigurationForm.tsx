import { useEffect, useMemo, useState } from "react";
import Input from "../../../../shared/components/ui/Input";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw, button, getButtonStyles } from "../../../../shared/utils/utils";
import {
  GatewayProvider,
  GatewayProviderField,
} from "../../services/gatewayProviderService";
import {
  CreateGatewayConfigurationRequest,
  GatewayConfiguration,
  UpdateGatewayConfigurationRequest,
} from "../../types/gatewayConfiguration";

interface ChannelOption {
  value: string;
  label: string;
}

interface GatewayConfigurationFormProps {
  mode: "create" | "edit";
  isLoading: boolean;
  channels: ChannelOption[];
  providers: GatewayProvider[];
  providersLoading?: boolean;
  initialData?: GatewayConfiguration | null;
  selectedChannelId: string;
  onChannelChange: (channelId: string) => void;
  onCancel: () => void;
  onSave: (
    payload:
      | CreateGatewayConfigurationRequest
      | UpdateGatewayConfigurationRequest,
  ) => void;
}

function buildInitialConfigValues(
  fields: GatewayProviderField[],
  existing?: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (existing && existing[field.name] !== undefined) {
      values[field.name] = existing[field.name];
      return;
    }
    if (field.type === "boolean") {
      values[field.name] = false;
    } else if (field.type === "number") {
      values[field.name] = "";
    } else {
      values[field.name] = "";
    }
  });
  return values;
}

export default function GatewayConfigurationForm({
  mode,
  isLoading,
  channels,
  providers,
  providersLoading = false,
  initialData,
  selectedChannelId,
  onChannelChange,
  onCancel,
  onSave,
}: GatewayConfigurationFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [providerId, setProviderId] = useState(
    initialData?.provider_id ? String(initialData.provider_id) : "",
  );
  const [isActive, setIsActive] = useState(initialData?.is_active !== false);
  const [configValues, setConfigValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProvider = useMemo(
    () => providers.find((p) => String(p.id) === providerId) || null,
    [providers, providerId],
  );

  const schemaFields: GatewayProviderField[] = useMemo(() => {
    if (selectedProvider?.field_schema?.fields?.length) {
      return selectedProvider.field_schema.fields;
    }
    if (initialData?.field_schema?.fields?.length) {
      return initialData.field_schema.fields;
    }
    return [];
  }, [selectedProvider, initialData]);

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name || "");
    setProviderId(
      initialData.provider_id ? String(initialData.provider_id) : "",
    );
    setIsActive(initialData.is_active !== false);
  }, [initialData]);

  useEffect(() => {
    setConfigValues(
      buildInitialConfigValues(
        schemaFields,
        (initialData?.config as Record<string, unknown>) || undefined,
      ),
    );
  }, [schemaFields, initialData?.id]);

  // When channel changes in create mode, clear provider selection
  useEffect(() => {
    if (mode === "create") {
      setProviderId("");
      setConfigValues({});
    }
  }, [selectedChannelId, mode]);

  const setFieldValue = (fieldName: string, value: unknown) => {
    setConfigValues((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Configuration name is required";
    else if (name.trim().length > 128) {
      next.name = "Name must be 128 characters or less";
    }

    if (mode === "create") {
      if (!selectedChannelId) next.channel_id = "Communication channel is required";
      if (!providerId) next.provider_id = "Gateway provider is required";
    }

    schemaFields.forEach((field) => {
      if (!field.required) return;
      const value = configValues[field.name];
      if (field.type === "boolean") return;
      if (value === undefined || value === null || String(value).trim() === "") {
        next[field.name] = `${field.label} is required`;
      }
    });

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const normalizeConfig = (): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    schemaFields.forEach((field) => {
      const raw = configValues[field.name];
      if (field.type === "boolean") {
        config[field.name] = Boolean(raw);
      } else if (field.type === "number") {
        const n = Number(raw);
        config[field.name] = Number.isFinite(n) ? n : raw;
      } else {
        config[field.name] = raw ?? "";
      }
    });
    return config;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const config = normalizeConfig();

    if (mode === "create") {
      onSave({
        name: name.trim(),
        provider_id: Number(providerId),
        config,
        is_active: isActive,
      } as CreateGatewayConfigurationRequest);
      return;
    }

    onSave({
      name: name.trim(),
      config,
      is_active: isActive,
    } as UpdateGatewayConfigurationRequest);
  };

  const activeProviders = providers.filter((p) => p.is_active !== false);
  const providerOptions = (
    mode === "edit" && selectedProvider && !activeProviders.some((p) => p.id === selectedProvider.id)
      ? [...activeProviders, selectedProvider]
      : activeProviders
  ).map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  const renderSchemaField = (field: GatewayProviderField) => {
    const value = configValues[field.name];
    const error = errors[field.name];

    if (field.type === "boolean") {
      return (
        <div key={field.name} className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id={`config-field-${field.name}`}
              checked={Boolean(value)}
              onChange={(e) => setFieldValue(field.name, e.target.checked)}
            />
            <span className={`text-sm font-medium ${tw.textPrimary}`}>
              {field.label}
            </span>
          </label>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.name}>
          <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
            {field.label}
            {field.required ? " *" : ""}
          </label>
          <HeadlessSelect
            value={value != null ? String(value) : ""}
            onChange={(v) => setFieldValue(field.name, v)}
            options={(field.options || []).map((o) => ({
              value: o,
              label: o,
            }))}
            placeholder={field.placeholder || `Select ${field.label}`}
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
      );
    }

    return (
      <div key={field.name}>
        <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
          {field.label}
          {field.required ? " *" : ""}
        </label>
        <Input
          type={
            field.type === "password"
              ? "password"
              : field.type === "number"
                ? "number"
                : "text"
          }
          value={value != null ? String(value) : ""}
          onChange={(v) => setFieldValue(field.name, v)}
          placeholder={field.placeholder || field.label}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
    );
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
              <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
                Communication Channel *
              </label>
              <HeadlessSelect
                value={selectedChannelId}
                onChange={onChannelChange}
                options={channels}
                placeholder="Select channel"
                disabled={mode === "edit"}
              />
              {errors.channel_id && (
                <p className="text-xs text-red-500 mt-1">{errors.channel_id}</p>
              )}
            </div>

            <div>
              <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
                Gateway Provider *
              </label>
              <HeadlessSelect
                value={providerId}
                onChange={setProviderId}
                options={providerOptions}
                placeholder={
                  providersLoading
                    ? "Loading providers..."
                    : selectedChannelId
                      ? "Select provider"
                      : "Select a channel first"
                }
                disabled={
                  mode === "edit" ||
                  !selectedChannelId ||
                  providersLoading ||
                  providerOptions.length === 0
                }
              />
              {errors.provider_id && (
                <p className="text-xs text-red-500 mt-1">{errors.provider_id}</p>
              )}
              {mode === "create" &&
                selectedChannelId &&
                !providersLoading &&
                providerOptions.length === 0 && (
                  <p className={`text-xs ${tw.textMuted} mt-1`}>
                    No active providers for this channel. Create a gateway
                    provider first.
                  </p>
                )}
            </div>
          </div>

          <div>
            <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
              Configuration Name *
            </label>
            <Input
              value={name}
              onChange={setName}
              placeholder="e.g., SendGrid Production"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="gateway-config-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
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
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
          Provider Credentials
        </h2>
        <p className={`text-xs ${tw.textMuted} mb-6`}>
          Fields are defined by the selected gateway provider&apos;s schema.
        </p>

        {!providerId ? (
          <p className={`text-sm ${tw.textMuted}`}>
            Select a gateway provider to configure credentials.
          </p>
        ) : schemaFields.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>
            This provider has no credential fields defined. You can still save
            the configuration with an empty config.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {schemaFields.map(renderSchemaField)}
          </div>
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
              ? "Create Configuration"
              : "Update Configuration"}
        </button>
      </div>
    </form>
  );
}
