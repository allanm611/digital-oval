import { useEffect, useState } from "react";
import { tw } from "../../../../shared/utils/utils";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import { rewardConfigurationService } from "../../services/rewardConfigurationService";
import { rewardProviderService } from "../../services/rewardProviderService";
import type { RewardConfiguration } from "../../types/rewardConfiguration";
import type { RewardProviderSchemaField } from "../../types/rewardProvider";
import {
  applyProviderDefaultsToTemplate,
  isDefaultRewardTemplate,
} from "../../utils/rewardTemplateDefaults";

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return (
    lower.includes("password") ||
    lower.includes("secret") ||
    lower.includes("token") ||
    lower.includes("api_key") ||
    lower.includes("apikey")
  );
}

function maskValue(value: unknown): string {
  const str = String(value ?? "");
  if (!str) return "—";
  if (str.length <= 4) return "••••";
  return `${str.slice(0, 2)}${"•".repeat(Math.min(str.length - 2, 8))}`;
}

function ConfigValuesGrid({
  title,
  fields,
  values,
}: {
  title: string;
  fields: RewardProviderSchemaField[];
  values: Record<string, unknown>;
}) {
  const entries = Object.entries(values || {});

  return (
    <div>
      <h4 className={`text-xs font-semibold ${tw.textMuted} uppercase tracking-wide mb-3`}>
        {title}
      </h4>
      {entries.length === 0 ? (
        <p className={`text-sm ${tw.textMuted}`}>No values configured.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map(([key, value]) => {
            const schemaField = fields.find((f) => f.name === key);
            const label = schemaField?.label || key.replace(/_/g, " ");
            const sensitive =
              schemaField?.type === "password" || isSensitiveKey(key);

            let displayValue: string;
            if (typeof value === "boolean") {
              displayValue = value ? "True" : "False";
            } else if (sensitive) {
              displayValue = maskValue(value);
            } else {
              const strValue = String(value ?? "");
              displayValue =
                strValue.length > 60
                  ? `${strValue.substring(0, 57)}...`
                  : strValue || "—";
            }

            return (
              <div key={key} className="space-y-1">
                <span
                  className={`text-xs font-medium ${tw.textMuted} block`}
                >
                  {label}
                </span>
                <span className={`text-sm ${tw.textPrimary} break-words`}>
                  {displayValue}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface RewardConfigurationReadOnlyPanelProps {
  configurationId: number | null;
  className?: string;
}

/** Loads and displays auth/payload parameters for a reward configuration (read-only). */
export default function RewardConfigurationReadOnlyPanel({
  configurationId,
  className = "",
}: RewardConfigurationReadOnlyPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<RewardConfiguration | null>(null);
  const [authFields, setAuthFields] = useState<RewardProviderSchemaField[]>(
    [],
  );
  const [payloadFields, setPayloadFields] = useState<
    RewardProviderSchemaField[]
  >([]);

  useEffect(() => {
    if (!configurationId) {
      setConfig(null);
      setAuthFields([]);
      setPayloadFields([]);
      setError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const found = await rewardConfigurationService.getById(configurationId);
        if (cancelled) return;

        const provider = await rewardProviderService.getById(found.provider_id);
        if (cancelled) return;
        setAuthFields(provider.auth_schema?.fields || []);
        setPayloadFields(provider.payload_schema?.fields || []);
        setConfig(applyProviderDefaultsToTemplate(found, provider));
      } catch {
        if (!cancelled) {
          setConfig(null);
          setAuthFields([]);
          setPayloadFields([]);
          setError("Could not load configuration details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [configurationId]);

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
            {config && isDefaultRewardTemplate(config)
              ? "Values inherited from the current provider schema (default template)."
              : "Values stored on the selected reward template. Locked fields follow the provider."}
          </p>
        </div>
        {config && (
          <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded">
            {config.name}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : config ? (
        <div className="space-y-6">
          <ConfigValuesGrid
            title="Authentication"
            fields={authFields}
            values={(config.auth_config as Record<string, unknown>) || {}}
          />
          <ConfigValuesGrid
            title="Payload"
            fields={payloadFields}
            values={(config.payload_config as Record<string, unknown>) || {}}
          />
        </div>
      ) : null}
    </div>
  );
}
