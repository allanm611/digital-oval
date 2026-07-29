import { useCallback, useEffect, useMemo, useState } from "react";
import { rewardProviderService } from "../../features/configurations/services/rewardProviderService";
import {
  filterProvidersByRewardType,
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
  /** Filter providers by UI reward type (matches provider.reward_type / reward_key) */
  rewardType?: RuleRewardType | string | null;
}

export function useRewardProviders(options: UseRewardProvidersOptions = {}) {
  const { rewardType = null } = options;
  const [allProviders, setAllProviders] = useState<RewardProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const providerQueryType = useMemo(
    () => mapRuleRewardTypeToProviderQuery(rewardType),
    [rewardType],
  );

  const providers = useMemo(
    () => filterProvidersByRewardType(allProviders, rewardType),
    [allProviders, rewardType],
  );

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await rewardProviderService.getAll())
        .map(mapApiRewardProvider)
        .filter((p) => p.isActive !== false);
      setAllProviders(data);
    } catch (err) {
      setAllProviders([]);
      setError(
        err instanceof Error ? err.message : "Failed to load reward providers",
      );
    } finally {
      setLoading(false);
    }
  }, []);

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
      getRewardProviderById(allProviders, providerId),
    [allProviders],
  );

  return {
    providers,
    allProviders,
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
