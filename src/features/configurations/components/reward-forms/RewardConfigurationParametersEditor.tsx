import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { tw } from "../../../../shared/utils/utils";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import { rewardConfigurationService } from "../../services/rewardConfigurationService";
import { rewardProviderService } from "../../services/rewardProviderService";
import type { RewardConfiguration } from "../../types/rewardConfiguration";
import type { RewardProviderSchemaField } from "../../types/rewardProvider";
import {
  buildVirtualDefaultRewardTemplate,
  isVirtualDefaultTemplateId,
  providerIdFromVirtualTemplateId,
} from "../../utils/rewardTemplateDefaults";
import RewardSchemaFieldControl from "./RewardSchemaFieldControl";
import {
  buildInitialConfigValues,
  collectSchemaFieldErrors,
  isSchemaFieldEditable,
  normalizeConfigValueForApi,
} from "./rewardSchemaFieldUtils";

export interface RewardConfigurationParameterValues {
  auth_config: Record<string, unknown>;
  payload_config: Record<string, unknown>;
}

/**
 * Normalize values for API while forcing locked schema fields back to the
 * master configuration (runtime overrides cannot change them).
 */
export function normalizeConfigFieldsWithEditability(
  fields: RewardProviderSchemaField[],
  values: Record<string, unknown>,
  masterValues?: Record<string, unknown>,
): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  fields.forEach((field) => {
    const sourceValue =
      !isSchemaFieldEditable(field) &&
      masterValues &&
      masterValues[field.name] !== undefined
        ? masterValues[field.name]
        : values[field.name];
    config[field.name] = normalizeConfigValueForApi(field, sourceValue);
  });
  return config;
}

interface RewardConfigurationParametersEditorProps {
  configurationId: number | null;
  value?: Partial<RewardConfigurationParameterValues>;
  onChange: (values: RewardConfigurationParameterValues) => void;
  onValidationChange?: (valid: boolean) => void;
  disabled?: boolean;
  className?: string;
}

function partitionSchemaFields(fields: RewardProviderSchemaField[]): {
  editable: RewardProviderSchemaField[];
  locked: RewardProviderSchemaField[];
} {
  const editable: RewardProviderSchemaField[] = [];
  const locked: RewardProviderSchemaField[] = [];
  fields.forEach((field) => {
    if (isSchemaFieldEditable(field)) {
      editable.push(field);
    } else {
      locked.push(field);
    }
  });
  return { editable, locked };
}

function FieldGrid({
  sectionKey,
  fields,
  values,
  errors,
  disabled,
  locked,
  onFieldChange,
}: {
  sectionKey: "auth" | "payload";
  fields: RewardProviderSchemaField[];
  values: Record<string, unknown>;
  errors: Record<string, string>;
  disabled?: boolean;
  locked?: boolean;
  onFieldChange: (fieldName: string, value: unknown) => void;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => {
        const fieldLocked = locked || !isSchemaFieldEditable(field);
        const fieldDisabled = disabled || fieldLocked;

        return (
          <div key={`${sectionKey}-${field.name}`}>
            <RewardSchemaFieldControl
              field={field}
              value={values[field.name]}
              onChange={(v) => {
                if (fieldLocked) return;
                onFieldChange(field.name, v);
              }}
              disabled={fieldDisabled}
              error={errors[`${sectionKey}.${field.name}`]}
              showFieldLabel
            />
            {fieldLocked && !disabled && (
              <p className={`text-xs ${tw.textMuted} mt-1`}>
                
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SchemaGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h4
        className={`text-xs font-semibold ${tw.textMuted} uppercase tracking-wide mb-1`}
      >
        {title}
      </h4>
      {description && (
        <p className={`text-xs ${tw.textMuted} mb-3`}>{description}</p>
      )}
      {children}
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
  const [masterAuthConfig, setMasterAuthConfig] = useState<
    Record<string, unknown>
  >({});
  const [masterPayloadConfig, setMasterPayloadConfig] = useState<
    Record<string, unknown>
  >({});
  const [authValues, setAuthValues] = useState<Record<string, unknown>>({});
  const [payloadValues, setPayloadValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLockedFields, setShowLockedFields] = useState(false);

  useEffect(() => {
    // Collapse locked accordion whenever the selected configuration changes.
    setShowLockedFields(false);
  }, [configurationId]);

  useEffect(() => {
    if (!configurationId) {
      setConfig(null);
      setAuthFields([]);
      setPayloadFields([]);
      setMasterAuthConfig({});
      setMasterPayloadConfig({});
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
        let found: RewardConfiguration;
        let provider;

        if (isVirtualDefaultTemplateId(configurationId)) {
          const providerId = providerIdFromVirtualTemplateId(configurationId);
          if (providerId == null) {
            throw new Error("Invalid default reward template");
          }
          provider = await rewardProviderService.getById(providerId);
          if (cancelled) return;
          found = buildVirtualDefaultRewardTemplate(provider);
        } else {
          found = await rewardConfigurationService.getById(configurationId);
          if (cancelled) return;
          provider = await rewardProviderService.getById(found.provider_id);
          if (cancelled) return;
        }

        const authSchemaFields = provider.auth_schema?.fields || [];
        const payloadSchemaFields = provider.payload_schema?.fields || [];
        // Virtual / default templates use provider schema defaults as master values.
        const foundAuth = (found.auth_config as Record<string, unknown>) || {};
        const foundPayload =
          (found.payload_config as Record<string, unknown>) || {};

        // Seed from parent override when present, but locked fields always use master.
        const overrideAuth = value?.auth_config as
          | Record<string, unknown>
          | undefined;
        const overridePayload = value?.payload_config as
          | Record<string, unknown>
          | undefined;

        const seedAuth: Record<string, unknown> = { ...foundAuth };
        const seedPayload: Record<string, unknown> = { ...foundPayload };
        authSchemaFields.forEach((field) => {
          if (
            isSchemaFieldEditable(field) &&
            overrideAuth &&
            overrideAuth[field.name] !== undefined
          ) {
            seedAuth[field.name] = overrideAuth[field.name];
          }
        });
        payloadSchemaFields.forEach((field) => {
          if (
            isSchemaFieldEditable(field) &&
            overridePayload &&
            overridePayload[field.name] !== undefined
          ) {
            seedPayload[field.name] = overridePayload[field.name];
          }
        });

        const nextAuth = buildInitialConfigValues(authSchemaFields, seedAuth);
        const nextPayload = buildInitialConfigValues(
          payloadSchemaFields,
          seedPayload,
        );

        setConfig(found);
        setAuthFields(authSchemaFields);
        setPayloadFields(payloadSchemaFields);
        setMasterAuthConfig(foundAuth);
        setMasterPayloadConfig(foundPayload);
        setAuthValues(nextAuth);
        setPayloadValues(nextPayload);
        setErrors({});

        onChange({
          auth_config: normalizeConfigFieldsWithEditability(
            authSchemaFields,
            nextAuth,
            foundAuth,
          ),
          payload_config: normalizeConfigFieldsWithEditability(
            payloadSchemaFields,
            nextPayload,
            foundPayload,
          ),
        });
      } catch {
        if (!cancelled) {
          setConfig(null);
          setAuthFields([]);
          setPayloadFields([]);
          setMasterAuthConfig({});
          setMasterPayloadConfig({});
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

  const { editable: editableAuth, locked: lockedAuth } = useMemo(
    () => partitionSchemaFields(authFields),
    [authFields],
  );
  const { editable: editablePayload, locked: lockedPayload } = useMemo(
    () => partitionSchemaFields(payloadFields),
    [payloadFields],
  );

  const editableCount = editableAuth.length + editablePayload.length;
  const lockedCount = lockedAuth.length + lockedPayload.length;
  const totalCount = authFields.length + payloadFields.length;

  // Surface locked section if it holds validation errors or there is nothing editable.
  const lockedHasErrors = useMemo(() => {
    const lockedKeys = new Set([
      ...lockedAuth.map((f) => `auth.${f.name}`),
      ...lockedPayload.map((f) => `payload.${f.name}`),
    ]);
    return Object.keys(errors).some((key) => lockedKeys.has(key));
  }, [errors, lockedAuth, lockedPayload]);

  const lockedExpanded =
    showLockedFields || lockedHasErrors || (editableCount === 0 && lockedCount > 0);

  const emitChange = (
    section: "auth" | "payload",
    fieldName: string,
    fieldValue: unknown,
    authState: Record<string, unknown>,
    payloadState: Record<string, unknown>,
  ) => {
    const fields = section === "auth" ? authFields : payloadFields;
    const field = fields.find((f) => f.name === fieldName);
    if (field && !isSchemaFieldEditable(field)) return;

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
      auth_config: normalizeConfigFieldsWithEditability(
        authFields,
        nextAuth,
        masterAuthConfig,
      ),
      payload_config: normalizeConfigFieldsWithEditability(
        payloadFields,
        nextPayload,
        masterPayloadConfig,
      ),
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
            Template parameters
          </h4>
          <p className={`text-xs ${tw.textMuted} mt-0.5`}>
            {config?.is_virtual
              ? "Provider default values — saved as a reward template when you save this rule."
              : "Override editable fields for this reward grant."}
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
      ) : totalCount === 0 ? (
        <p className={`text-sm ${tw.textMuted}`}>
          This provider has no auth or payload fields defined.
        </p>
      ) : (
        <div className="space-y-5">
          {editableCount > 0 ? (
            <div className="space-y-5">
              {/* Payload first: business overrides are the primary offer-time task */}
              {editablePayload.length > 0 && (
                <SchemaGroup
                  title="Payload"
                  description="Editable parameters sent to the provider for this reward."
                >
                  <FieldGrid
                    sectionKey="payload"
                    fields={editablePayload}
                    values={payloadValues}
                    errors={errors}
                    disabled={disabled}
                    onFieldChange={(name, v) =>
                      emitChange("payload", name, v, authValues, payloadValues)
                    }
                  />
                </SchemaGroup>
              )}
              {editableAuth.length > 0 && (
                <SchemaGroup
                  title="Authentication"
                  description="Editable credentials for this delivery."
                >
                  <FieldGrid
                    sectionKey="auth"
                    fields={editableAuth}
                    values={authValues}
                    errors={errors}
                    disabled={disabled}
                    onFieldChange={(name, v) =>
                      emitChange("auth", name, v, authValues, payloadValues)
                    }
                  />
                </SchemaGroup>
              )}
            </div>
          ) : (
            <p className={`text-sm ${tw.textMuted}`}>
              No editable overrides for this configuration. Master values are
              used for delivery.
            </p>
          )}

          {lockedCount > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <button
                type="button"
                onClick={() => setShowLockedFields((open) => !open)}
                className={`w-full flex items-center justify-between gap-3 py-2 px-1 text-left ${tw.rounded} hover:bg-gray-100/80 transition-colors`}
                aria-expanded={lockedExpanded}
              >
                <span>
                  <span
                    className={`text-sm font-medium ${tw.textPrimary} block`}
                  >
                    {lockedExpanded ? "Show less" : "Show more"}
                  </span>
                  
                </span>
                {lockedExpanded ? (
                  <ChevronUp className={`w-4 h-4 shrink-0 ${tw.textMuted}`} />
                ) : (
                  <ChevronDown className={`w-4 h-4 shrink-0 ${tw.textMuted}`} />
                )}
              </button>

              {lockedExpanded && (
                <div className="space-y-5 mt-3 pt-1">
                  {lockedAuth.length > 0 && (
                    <SchemaGroup
                      title="Authentication"
                      description="Locked OAuth and API credentials from the master configuration."
                    >
                      <FieldGrid
                        sectionKey="auth"
                        fields={lockedAuth}
                        values={authValues}
                        errors={errors}
                        disabled={disabled}
                        locked
                        onFieldChange={(name, v) =>
                          emitChange(
                            "auth",
                            name,
                            v,
                            authValues,
                            payloadValues,
                          )
                        }
                      />
                    </SchemaGroup>
                  )}
                  {lockedPayload.length > 0 && (
                    <SchemaGroup
                      title="Payload"
                      description="Locked delivery parameters from the master configuration."
                    >
                      <FieldGrid
                        sectionKey="payload"
                        fields={lockedPayload}
                        values={payloadValues}
                        errors={errors}
                        disabled={disabled}
                        locked
                        onFieldChange={(name, v) =>
                          emitChange(
                            "payload",
                            name,
                            v,
                            authValues,
                            payloadValues,
                          )
                        }
                      />
                    </SchemaGroup>
                  )}
                </div>
              )}
            </div>
          )}
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
