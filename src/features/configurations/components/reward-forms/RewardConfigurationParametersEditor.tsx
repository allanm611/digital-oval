import { useEffect, useRef, useState } from "react";
import { tw } from "../../../../shared/utils/utils";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import { rewardConfigurationService } from "../../services/rewardConfigurationService";
import { rewardProviderService } from "../../services/rewardProviderService";
import type { RewardConfiguration } from "../../types/rewardConfiguration";
import type { RewardProviderSchemaField } from "../../types/rewardProvider";
import RewardSchemaFieldControl from "./RewardSchemaFieldControl";
import {
  buildInitialConfigValues,
  collectSchemaFieldErrors,
  normalizeConfigFields,
} from "./rewardSchemaFieldUtils";

export interface RewardConfigurationParameterValues {
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
}

interface RewardConfigurationParametersEditorProps {
  configurationId: number | null;
  value?: Partial<RewardConfigurationParameterValues>;
  onChange: (values: RewardConfigurationParameterValues) => void;
  onValidationChange?: (valid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function SchemaFieldsSection({
  title,
  description,
  sectionKey,
  fields,
  values,
  errors,
  disabled,
  onFieldChange,
}: {
  title: string;
  description: string;
  sectionKey: "auth" | "payload";
  fields: RewardProviderSchemaField[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  disabled?: boolean;
  onFieldChange: (fieldName: string, value: unknown) => void;
}) {
  return (
    <div>
      <h4 className={`text-xs font-semibold ${tw.textMuted} uppercase tracking-wide mb-1`}>
        {title}
      </h4>
      <p className={`text-xs ${tw.textMuted} mb-4`}>{description}</p>
      {fields.length === 0 ? (
        <p className={`text-sm ${tw.textMuted}`}>No fields defined for this section.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <RewardSchemaFieldControl
              key={`${sectionKey}-${field.name}`}
              field={field}
              value={values[field.name]}
              onChange={(v) => onFieldChange(field.name, v)}
              disabled={disabled}
              error={errors[`${sectionKey}.${field.name}`]}
              showFieldLabel
            />
          ))}
        </div>
      )}
    </div>
  );
}

/** Editable auth/payload parameters for a selected reward configuration (runtime overrides). */
export default function RewardConfigurationParametersEditor({
  configurationId,
  value,
  onChange,
  onValidationChange,
  disabled = false,
  className = "",
}: RewardConfigurationParametersEditorProps) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [config, setConfig] = useState<RewardConfiguration | null>(null);
  const [authFields, setAuthFields] = useState<RewardProviderSchemaField[]>([]);
  const [payloadFields, setPayloadFields] = useState<RewardProviderSchemaField[]>(
    [],
  );
  const [authValues, setAuthValues] = useState<Record<string, unknown>>({});
  const [payloadValues, setPayloadValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!configurationId) {
      setConfig(null);
      setAuthFields([]);
      setPayloadFields([]);
      setAuthValues({});
      setPayloadValues({});
      setLoadError(null);
      setErrors({});
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const found = await rewardConfigurationService.getById(configurationId);
        if (cancelled) return;

        const provider = await rewardProviderService.getById(found.provider_id);
        if (cancelled) return;

        const authSchemaFields = provider.auth_schema?.fields || [];
        const payloadSchemaFields = provider.payload_schema?.fields || [];

        const nextAuth = buildInitialConfigValues(
          authSchemaFields,
          (value?.auth_config as Record<string, unknown> | undefined) ??
            (found.auth_config as Record<string, unknown>),
        );
        const nextPayload = buildInitialConfigValues(
          payloadSchemaFields,
          (value?.payload_config as Record<string, unknown> | undefined) ??
            (found.payload_config as Record<string, unknown>),
        );

        setConfig(found);
        setAuthFields(authSchemaFields);
        setPayloadFields(payloadSchemaFields);
        setAuthValues(nextAuth);
        setPayloadValues(nextPayload);
        setErrors({});

        onChange({
          auth_config: normalizeConfigFields(authSchemaFields, nextAuth),
          payload_config: normalizeConfigFields(payloadSchemaFields, nextPayload),
        });
      } catch {
        if (!cancelled) {
          setConfig(null);
          setAuthFields([]);
          setPayloadFields([]);
          setLoadError("Could not load configuration parameters.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Re-load when configuration id changes; value prop used only on initial load for that id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configurationId]);

  const onValidationChangeRef = useRef(onValidationChange);
  onValidationChangeRef.current = onValidationChange;
  const lastValidRef = useRef<boolean | null>(null);

  useEffect(() => {
    const nextErrors = {
      ...collectSchemaFieldErrors(authFields, authValues, "auth"),
      ...collectSchemaFieldErrors(payloadFields, payloadValues, "payload"),
    };
    setErrors(nextErrors);
    const valid = Object.keys(nextErrors).length === 0;
    if (lastValidRef.current !== valid) {
      lastValidRef.current = valid;
      onValidationChangeRef.current?.(valid);
    }
  }, [authFields, payloadFields, authValues, payloadValues]);

  const emitChange = (
    section: "auth" | "payload",
    fieldName: string,
    fieldValue: unknown,
    authState: Record<string, unknown>,
    payloadState: Record<string, unknown>,
  ) => {
    const nextAuth =
      section === "auth"
        ? { ...authState, [fieldName]: fieldValue }
        : authState;
    const nextPayload =
      section === "payload"
        ? { ...payloadState, [fieldName]: fieldValue }
        : payloadState;

    if (section === "auth") {
      setAuthValues(nextAuth);
    } else {
      setPayloadValues(nextPayload);
    }

    onChange({
      auth_config: normalizeConfigFields(authFields, nextAuth),
      payload_config: normalizeConfigFields(payloadFields, nextPayload),
    });
  };

  if (!configurationId) {
    return null;
  }

  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-gray-50/80 p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className={`text-sm font-semibold ${tw.textPrimary}`}>
            Configuration parameters
          </h4>
          <p className={`text-xs ${tw.textMuted} mt-0.5`}>
            Adjust values for this grant or rule. Changes apply to this action
            only and do not update the master configuration.
          </p>
        </div>
        {config && (
          <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded shrink-0">
            {config.name}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="space-y-6">
          <SchemaFieldsSection
            title="Authentication"
            description="OAuth and API credentials for this delivery."
            sectionKey="auth"
            fields={authFields}
            values={authValues}
            errors={errors}
            disabled={disabled}
            onFieldChange={(name, v) =>
              emitChange("auth", name, v, authValues, payloadValues)
            }
          />
          <SchemaFieldsSection
            title="Payload"
            description="Parameters sent to the provider for this reward."
            sectionKey="payload"
            fields={payloadFields}
            values={payloadValues}
            errors={errors}
            disabled={disabled}
            onFieldChange={(name, v) =>
              emitChange("payload", name, v, authValues, payloadValues)
            }
          />
        </div>
      )}
    </div>
  );
}

export function validateConfigurationParameterValues(
  authFields: RewardProviderSchemaField[],
  payloadFields: RewardProviderSchemaField[],
  authValues: Record<string, unknown>,
  payloadValues: Record<string, unknown>,
): Record<string, string> {
  return {
    ...collectSchemaFieldErrors(authFields, authValues, "auth"),
    ...collectSchemaFieldErrors(payloadFields, payloadValues, "payload"),
  };
}
