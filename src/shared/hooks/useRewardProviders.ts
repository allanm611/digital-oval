import { useCallback, useEffect, useMemo, useState } from "react";
import { rewardProviderService } from "../../features/configurations/services/rewardProviderService";
import {
  FALLBACK_REWARD_PROVIDERS,
  getActiveProviders,
  getAllowedRewardTypes,
  getDefaultRewardProviderKey,
  getRewardProviderByKey,
  getRewardProviderOptions,
  isRewardTypeAllowedForProvider,
  mapApiRewardProvider,
  resolveRewardTypeForProvider,
  type RewardProviderRecord,
  type RuleRewardType,
} from "../data/rewardProviders";

export type RewardProviderDataSource = "api" | "fallback";

export interface UseRewardProvidersOptions {
  /** When true, only active providers are returned (default: true) */
  activeOnly?: boolean;
}

export function useRewardProviders(options: UseRewardProvidersOptions = {}) {
  const { activeOnly = true } = options;
  const [allProviders, setAllProviders] = useState<RewardProviderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<RewardProviderDataSource>("fallback");

  const loadProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rewardProviderService.getAll(
        activeOnly ? { active_only: true } : undefined,
      );
      const mapped = data.map(mapApiRewardProvider);
      if (mapped.length > 0) {
        setAllProviders(mapped);
        setSource("api");
      } else {
        setAllProviders([...FALLBACK_REWARD_PROVIDERS]);
        setSource("fallback");
      }
    } catch (err) {
      setAllProviders([...FALLBACK_REWARD_PROVIDERS]);
      setSource("fallback");
      setError(
        err instanceof Error ? err.message : "Failed to load reward providers",
      );
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const providers = useMemo(
    () => (activeOnly ? getActiveProviders(allProviders) : [...allProviders]),
    [activeOnly, allProviders],
  );

  const providerOptions = useMemo(
    () => getRewardProviderOptions(providers),
    [providers],
  );

  const defaultProviderKey = useMemo(
    () => getDefaultRewardProviderKey(providers),
    [providers],
  );

  const getAllowedTypes = useCallback(
    (providerKey: string | undefined | null) =>
      getAllowedRewardTypes(providers, providerKey),
    [providers],
  );

  const resolveType = useCallback(
    (
      providerKey: string | undefined | null,
      currentRewardType: RuleRewardType | undefined | null,
    ) => resolveRewardTypeForProvider(providers, providerKey, currentRewardType),
    [providers],
  );

  const isTypeAllowed = useCallback(
    (
      providerKey: string | undefined | null,
      rewardType: RuleRewardType | undefined | null,
    ) => isRewardTypeAllowedForProvider(providers, providerKey, rewardType),
    [providers],
  );

  const getProvider = useCallback(
    (providerKey: string | undefined | null) =>
      getRewardProviderByKey(providers, providerKey),
    [providers],
  );

  return {
    providers,
    providerOptions,
    defaultProviderKey,
    loading,
    error,
    source,
    refetch: loadProviders,
    getAllowedTypes,
    resolveType,
    isTypeAllowed,
    getProvider,
  };
}
