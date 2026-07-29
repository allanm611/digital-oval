import { useCallback, useEffect, useMemo, useState } from "react";
import { rewardProviderService } from "../../features/configurations/services/rewardProviderService";
import {
  getDefaultRewardProviderId,
  getRewardProviderById,
  getRewardProviderOptions,
  mapApiRewardProvider,
  mapRuleRewardTypeToProviderQuery,
  resolveProviderForRewardType,
  type RewardProviderRecord,
  type RuleRewardType,
} from "../data/rewardProviders";

export interface UseRewardProvidersOptions {
  /** Filter providers by UI reward type (maps to backend reward_type query) */
  rewardType?: RuleRewardType | string | null;
}

export function useRewardProviders(options: UseRewardProvidersOptions = {}) {
  const { rewardType = null } = options;
  const [providers, setProviders] = useState<RewardProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const providerQueryType = useMemo(
    () => mapRuleRewardTypeToProviderQuery(rewardType),
    [rewardType],
  );

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rewardProviderService.getAll(
        providerQueryType ? { reward_type: providerQueryType } : undefined,
      );
      setProviders(data.map(mapApiRewardProvider));
    } catch (err) {
      setProviders([]);
      setError(
        err instanceof Error ? err.message : "Failed to load reward providers",
      );
    } finally {
      setLoading(false);
    }
  }, [providerQueryType]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const providerOptions = useMemo(
    () => getRewardProviderOptions(providers),
    [providers],
  );

  const defaultProviderId = useMemo(
    () => getDefaultRewardProviderId(providers),
    [providers],
  );

  const resolveProvider = useCallback(
    (currentProviderId: string | undefined | null) =>
      resolveProviderForRewardType(providers, currentProviderId),
    [providers],
  );

  const getProvider = useCallback(
    (providerId: string | number | undefined | null) =>
      getRewardProviderById(providers, providerId),
    [providers],
  );

  return {
    providers,
    providerOptions,
    defaultProviderId,
    loading,
    error,
    refetch: loadProviders,
    resolveProvider,
    getProvider,
    providerQueryType,
  };
}
