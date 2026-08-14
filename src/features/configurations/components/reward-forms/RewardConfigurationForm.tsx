import { useEffect, useMemo, useState } from "react";
import Input from "../../../../shared/components/ui/Input";
import RewardSchemaFieldControl from "./RewardSchemaFieldControl";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import { color, tw, button, getButtonStyles } from "../../../../shared/utils/utils";
import { RewardProvider } from "../../services/rewardProviderService";
import { RewardProviderSchemaField } from "../../types/rewardProvider";
import {
  coerceConfigValue,
  isSchemaFieldEditable,
  normalizeConfigValueForApi,
  validateRequiredSchemaValue,
} from "./rewardSchemaFieldUtils";
import {
  CreateRewardConfigurationRequest,
  RewardConfiguration,
  UpdateRewardConfigurationRequest,
} from "../../types/rewardConfiguration";

interface RewardConfigurationFormProps {
  mode: "create" | "edit";
  isLoading: boolean;
  providers: RewardProvider[];
  providersLoading?: boolean;
  initialData?: RewardConfiguration | null;
  initialProvider?: RewardProvider | null;
  onCancel: () => void;
  onSave: (
    payload:
      | CreateRewardConfigurationRequest
      | UpdateRewardConfigurationRequest,
  ) => void;
}

function buildInitialConfigValues(
  fields: RewardProviderSchemaField[],
  existing?: Record<string, unknown>,
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  fields.forEach((field) => {
    if (existing && existing[field.name] !== undefined) {
      values[field.name] = coerceConfigValue(field, existing[field.name]);
      return;
    }
    if (field.default !== undefined && field.default !== "") {
      values[field.name] = coerceConfigValue(field, field.default);
      return;
    }
    values[field.name] = coerceConfigValue(field, undefined);
  });
  return values;
}

export default function RewardConfigurationForm({
  mode,
  isLoading,
  providers,
  providersLoading = false,
  initialData,
  initialProvider,
  onCancel,
  onSave,
}: RewardConfigurationFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [providerId, setProviderId] = useState(
    initialData?.provider_id ? String(initialData.provider_id) : "",
  );
  const [isActive, setIsActive] = useState(initialData?.is_active !== false);
  const [authValues, setAuthValues] = useState<Record<string, unknown>>({});
  const [payloadValues, setPayloadValues] = useState<Record<string, unknown>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProvider = useMemo(() => {
    if (initialProvider && String(initialProvider.id) === providerId) {
      return initialProvider;
    }
    return providers.find((p) => String(p.id) === providerId) || null;
  }, [providers, providerId, initialProvider]);

  const authFields = useMemo(
    () => selectedProvider?.auth_schema?.fields || [],
    [selectedProvider],
  );

  const payloadFields = useMemo(
    () => selectedProvider?.payload_schema?.fields || [],
    [selectedProvider],
  );

  useEffect(() => {
    if (!initialData) return;
    setName(initialData.name || "");
    setProviderId(
      initialData.provider_id ? String(initialData.provider_id) : "",
    );
    setIsActive(initialData.is_active !== false);
  }, [initialData]);

  useEffect(() => {
    setAuthValues(
      buildInitialConfigValues(
        authFields,
        (initialData?.auth_config as Record<string, unknown>) || undefined,
      ),
    );
    setPayloadValues(
      buildInitialConfigValues(
        payloadFields,
        (initialData?.payload_config as Record<string, unknown>) || undefined,
      ),
    );
  }, [authFields, payloadFields, initialData?.id]);

  useEffect(() => {
    if (mode !== "create" || !providerId) return;
    if (initialData?.id) return;
    setAuthValues(buildInitialConfigValues(authFields));
    setPayloadValues(buildInitialConfigValues(payloadFields));
  }, [providerId, mode, authFields, payloadFields, initialData?.id]);

  const setFieldValue = (
    section: "auth" | "payload",
    fieldName: string,
    value: unknown,
    field: RewardProviderSchemaField,
  ) => {
    // Defense: ignore mutations to locked fields when editing an existing config.
    if (mode === "edit" && !isSchemaFieldEditable(field)) return;

    const setter = section === "auth" ? setAuthValues : setPayloadValues;
    const errorKey = `${section}.${fieldName}`;

    setter((prev) => ({ ...prev, [fieldName]: value }));
    setErrors((prev) => {
      if (!prev[errorKey]) return prev;
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  };

  const validateFields = (
    fields: RewardProviderSchemaField[],
    values: Record<string, unknown>,
    section: "auth" | "payload",
    next: Record<string, string>,
  ) => {
    fields.forEach((field) => {
      const message = validateRequiredSchemaValue(
        field,
        values[field.name],
      );
      if (message) {
        next[`${section}.${field.name}`] = message;
      }
    });
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Configuration name is required";
    else if (name.trim().length > 128) {
      next.name = "Name must be 128 characters or less";
    }

    if (mode === "create" && !providerId) {
      next.provider_id = "Reward provider is required";
    }

    validateFields(authFields, authValues, "auth", next);
    validateFields(payloadFields, payloadValues, "payload", next);

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /**
   * Build API config maps. On edit, locked fields are forced back to the
   * master configuration values so client-side tampering cannot change them.
   */
  const normalizeConfig = (
    fields: RewardProviderSchemaField[],
    values: Record<string, unknown>,
    existing?: Record<string, unknown>,
  ): Record<string, unknown> => {
    const config: Record<string, unknown> = {};
    fields.forEach((field) => {
      const sourceValue =
        mode === "edit" &&
        !isSchemaFieldEditable(field) &&
        existing &&
        existing[field.name] !== undefined
          ? existing[field.name]
          : values[field.name];
      config[field.name] = normalizeConfigValueForApi(field, sourceValue);
    });
    return config;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const auth_config = normalizeConfig(
      authFields,
      authValues,
      initialData?.auth_config as Record<string, unknown> | undefined,
    );
    const payload_config = normalizeConfig(
      payloadFields,
      payloadValues,
      initialData?.payload_config as Record<string, unknown> | undefined,
    );

    if (mode === "create") {
      onSave({
        name: name.trim(),
        provider_id: Number(providerId),
        auth_config,
        payload_config,
        is_active: isActive,
      } as CreateRewardConfigurationRequest);
      return;
    }

    onSave({
      name: name.trim(),
      auth_config,
      payload_config,
      is_active: isActive,
    } as UpdateRewardConfigurationRequest);
  };

  const activeProviders = providers.filter((p) => p.is_active !== false);
  const providerOptions = (
    mode === "edit" &&
    selectedProvider &&
    !activeProviders.some((p) => p.id === selectedProvider.id)
      ? [...activeProviders, selectedProvider]
      : activeProviders
  ).map((p) => ({
    value: String(p.id),
    label: `${p.name} (${p.reward_type})`,
  }));

  const renderSchemaField = (
    field: RewardProviderSchemaField,
    section: "auth" | "payload",
    values: Record<string, unknown>,
  ) => {
    const locked = mode === "edit" && !isSchemaFieldEditable(field);

    return (
      <div key={`${section}-${field.name}`}>
        <RewardSchemaFieldControl
          field={field}
          value={values[field.name]}
          onChange={(v) => setFieldValue(section, field.name, v, field)}
          showFieldLabel
          disabled={locked}
          error={errors[`${section}.${field.name}`]}
        />
        {locked && (
          <p className={`text-xs ${tw.textMuted} mt-1`}>
            
          </p>
        )}
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
          <div>
            <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
              Reward Provider *
            </label>
            <HeadlessSelect
              value={providerId}
              onChange={setProviderId}
              options={providerOptions}
              placeholder={
                providersLoading
                  ? "Loading providers..."
                  : "Select reward provider"
              }
              disabled={
                mode === "edit" || providersLoading || providerOptions.length === 0
              }
            />
            {errors.provider_id && (
              <p className="text-xs text-red-500 mt-1">{errors.provider_id}</p>
            )}
            {mode === "create" &&
              !providersLoading &&
              providerOptions.length === 0 && (
                <p className={`text-xs ${tw.textMuted} mt-1`}>
                  No active reward providers found. Create a reward provider
                  first.
                </p>
              )}
            {selectedProvider && (
              <p className={`text-xs ${tw.textMuted} mt-2`}>
                {selectedProvider.http_method} {selectedProvider.api_path}
              </p>
            )}
          </div>

          <div>
            <label className={`text-sm font-medium ${tw.textMuted} mb-2 block`}>
              Configuration Name *
            </label>
            <Input
              value={name}
              onChange={setName}
              placeholder="e.g., MICA Bonus Units Production"
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id="reward-config-active"
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
          Authentication Settings
        </h2>
        <p className={`text-xs ${tw.textMuted} mb-6`}>
          OAuth and API credentials defined by the provider&apos;s auth schema.
          {mode === "edit"
            ? " "
            : ""}
        </p>

        {!providerId ? (
          <p className={`text-sm ${tw.textMuted}`}>
            Select a reward provider to configure authentication.
          </p>
        ) : authFields.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>
            This provider has no auth fields defined.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {authFields.map((field) =>
              renderSchemaField(field, "auth", authValues),
            )}
          </div>
        )}
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className={`text-sm font-semibold ${tw.textPrimary} mb-2`}>
          Payload Settings
        </h2>
        <p className={`text-xs ${tw.textMuted} mb-6`}>
          Reward delivery parameters mapped into the provider&apos;s request
          template.
          {mode === "edit"
            ? " "
            : ""}
        </p>

        {!providerId ? (
          <p className={`text-sm ${tw.textMuted}`}>
            Select a reward provider to configure payload values.
          </p>
        ) : payloadFields.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>
            This provider has no payload fields defined.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payloadFields.map((field) =>
              renderSchemaField(field, "payload", payloadValues),
            )}
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
              ? "Create Template"
              : "Update Template"}
        </button>
      </div>
    </form>
  );
}
