import { useCallback, useEffect, useMemo, useState } from "react";
import { rewardConfigurationService } from "../../features/configurations/services/rewardConfigurationService";
import { rewardProviderService } from "../../features/configurations/services/rewardProviderService";
import type { RewardConfiguration } from "../../features/configurations/types/rewardConfiguration";
import {
  buildVirtualDefaultRewardTemplate,
  ensureProviderDefaultTemplateDetailed,
  formatRewardTemplateOptionLabel,
  isDefaultRewardTemplate,
  isVirtualDefaultTemplateId,
  sortRewardTemplates,
} from "../../features/configurations/utils/rewardTemplateDefaults";
import {
  getRewardTypeMatchKeys,
  normalizeRewardTypeKey,
} from "../data/rewardProviders";

export interface UseRewardProviderConfigurationsOptions {
  /** Reward provider id (string or number); empty disables fetch */
  providerId?: string | number | null;
  /** When set, only configurations whose reward_type matches this UI type are returned */
  rewardType?: string | null;
  /** When false, skips loading (e.g. modal closed) */
  enabled?: boolean;
  /**
   * When true (default), ensures the provider has a default reward template
   * and includes it in the list (self-heals legacy providers).
   */
  ensureDefaultTemplate?: boolean;
}

function mergeTemplateIntoList(
  list: RewardConfiguration[],
  template: RewardConfiguration,
): RewardConfiguration[] {
  const hasDefault = list.some(isDefaultRewardTemplate);
  const templateIsDefault = isDefaultRewardTemplate(template);

  // Never introduce a second default (persisted or virtual).
  if (templateIsDefault && hasDefault) {
    return list.map((c) => {
      if (!isDefaultRewardTemplate(c)) return c;
      // Enrich the kept default if ensure returned the same row.
      if (c.id === template.id) {
        return {
          ...c,
          ...template,
          name: template.name?.trim() || c.name,
          is_default: true,
        };
      }
      return c;
    });
  }

  if (list.some((c) => c.id === template.id)) {
    return list.map((c) =>
      c.id === template.id
        ? {
            ...c,
            ...template,
            name: template.name?.trim() || c.name,
          }
        : c,
    );
  }

  return [...list, template];
}

export function useRewardProviderConfigurations(
  options: UseRewardProviderConfigurationsOptions = {},
) {
  const {
    providerId = null,
    rewardType = null,
    enabled = true,
    ensureDefaultTemplate = true,
  } = options;

  const normalizedProviderId = useMemo(() => {
    if (providerId == null || providerId === "") return "";
    return String(providerId);
  }, [providerId]);

  const [configurations, setConfigurations] = useState<RewardConfiguration[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedWarning, setSeedWarning] = useState<string | null>(null);

  const load = useCallback(
    async (pid: string) => {
      if (!pid) {
        setConfigurations([]);
        setError(null);
        setSeedWarning(null);
        return;
      }

      const providerIdNum = Number(pid);
      setLoading(true);
      setError(null);
      setSeedWarning(null);

      try {
        let list = (
          await rewardConfigurationService.getAll({
            provider_id: providerIdNum,
          })
        ).filter((c) => c.is_active !== false);

        if (ensureDefaultTemplate) {
          try {
            const { template, persistenceError } =
              await ensureProviderDefaultTemplateDetailed(providerIdNum);

            // Only surface real persistence problems — not "already has templates".
            if (
              persistenceError &&
              (template.is_virtual === true ||
                isVirtualDefaultTemplateId(template.id))
            ) {
              setSeedWarning(persistenceError);
            }

            if (template.is_active !== false) {
              list = mergeTemplateIntoList(list, template);
            }
          } catch (ensureErr) {
            if (!list.some(isDefaultRewardTemplate) && list.length === 0) {
              try {
                const provider =
                  await rewardProviderService.getById(providerIdNum);
                list = mergeTemplateIntoList(
                  list,
                  buildVirtualDefaultRewardTemplate(provider),
                );
                setSeedWarning(
                  ensureErr instanceof Error
                    ? ensureErr.message
                    : "Using provider schema defaults until a template can be saved.",
                );
              } catch {
                /* keep list */
              }
            }
          }
        }

        // Empty provider: always expose schema-default template.
        if (ensureDefaultTemplate && list.length === 0) {
          try {
            const provider = await rewardProviderService.getById(providerIdNum);
            list = [buildVirtualDefaultRewardTemplate(provider)];
            setSeedWarning(
              (prev) =>
                prev ||
                "Showing provider default template (not yet saved as a reward template).",
            );
          } catch (providerErr) {
            setError(
              providerErr instanceof Error
                ? providerErr.message
                : "Failed to load provider default template",
            );
          }
        }

        setConfigurations(sortRewardTemplates(list));
      } catch (err) {
        if (ensureDefaultTemplate) {
          try {
            const provider = await rewardProviderService.getById(providerIdNum);
            setConfigurations(
              sortRewardTemplates([
                buildVirtualDefaultRewardTemplate(provider),
              ]),
            );
            setError(null);
            setSeedWarning(
              err instanceof Error
                ? err.message
                : "Could not load saved templates; showing provider defaults.",
            );
            return;
          } catch {
            /* fall through */
          }
        }
        setConfigurations([]);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load reward templates",
        );
      } finally {
        setLoading(false);
      }
    },
    [ensureDefaultTemplate],
  );

  useEffect(() => {
    if (!enabled) {
      setConfigurations([]);
      setLoading(false);
      setError(null);
      setSeedWarning(null);
      return;
    }
    void load(normalizedProviderId);
  }, [enabled, normalizedProviderId, load]);

  const filteredConfigurations = useMemo(() => {
    if (!rewardType) return configurations;
    const matchKeys = getRewardTypeMatchKeys(rewardType);
    if (matchKeys.length === 0) return configurations;
    return configurations.filter((c) => {
      if (isDefaultRewardTemplate(c) || c.is_virtual) return true;
      if (!c.reward_type) return true;
      return matchKeys.includes(normalizeRewardTypeKey(c.reward_type));
    });
  }, [configurations, rewardType]);

  const templateOptions = useMemo(() => {
    // Final safety net: unique values, one default label.
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [];
    for (const c of filteredConfigurations) {
      const value = String(c.id);
      if (seen.has(value)) continue;
      seen.add(value);
      opts.push({
        value,
        label: formatRewardTemplateOptionLabel(c),
      });
    }
    return opts;
  }, [filteredConfigurations]);

  const defaultTemplate = useMemo(
    () => filteredConfigurations.find(isDefaultRewardTemplate) ?? null,
    [filteredConfigurations],
  );

  return {
    configurations: filteredConfigurations,
    templateOptions,
    defaultTemplate,
    loading,
    error,
    seedWarning,
    refetch: () => load(normalizedProviderId),
  };
}
