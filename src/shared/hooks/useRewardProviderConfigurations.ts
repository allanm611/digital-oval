import { useCallback, useEffect, useMemo, useState } from "react";
import { rewardConfigurationService } from "../../features/configurations/services/rewardConfigurationService";
import type { RewardConfiguration } from "../../features/configurations/types/rewardConfiguration";
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
}

export function useRewardProviderConfigurations(
  options: UseRewardProviderConfigurationsOptions = {},
) {
  const { providerId = null, rewardType = null, enabled = true } = options;

  const normalizedProviderId = useMemo(() => {
    if (providerId == null || providerId === "") return "";
    return String(providerId);
  }, [providerId]);

  const [configurations, setConfigurations] = useState<RewardConfiguration[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (pid: string) => {
    if (!pid) {
      setConfigurations([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await rewardConfigurationService.getAll({
        provider_id: Number(pid),
      });
      setConfigurations(list.filter((c) => c.is_active !== false));
    } catch (err) {
      setConfigurations([]);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load reward configurations",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setConfigurations([]);
      setLoading(false);
      return;
    }
    void load(normalizedProviderId);
  }, [enabled, normalizedProviderId, load]);

  const filteredConfigurations = useMemo(() => {
    if (!rewardType) return configurations;
    const matchKeys = getRewardTypeMatchKeys(rewardType);
    if (matchKeys.length === 0) return configurations;
    return configurations.filter((c) =>
      matchKeys.includes(normalizeRewardTypeKey(c.reward_type)),
    );
  }, [configurations, rewardType]);

  return {
    configurations: filteredConfigurations,
    loading,
    error,
    refetch: () => load(normalizedProviderId),
  };
}
