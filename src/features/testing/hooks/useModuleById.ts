import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { healthApi } from '../services/healthApi';
import { buildModuleStatus } from '../utils/healthMappers';
import { useHealthStatus, HEALTH_QUERY_KEYS } from './useHealthStatus';
import type { ModuleStatus } from '../types/health';

export function useModuleById(moduleId: string | undefined) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading: statusLoading, isError, refetch } = useHealthStatus();

  const cachedModule = useMemo<ModuleStatus | null>(() => {
    if (!moduleId || !data?.modules) return null;
    return data.modules.find((item) => item.id === moduleId) ?? null;
  }, [data?.modules, moduleId]);

  const moduleQuery = useQuery({
    queryKey: HEALTH_QUERY_KEYS.module(moduleId ?? ''),
    queryFn: async () => {
      const [moduleConfig, runs] = await Promise.all([
        healthApi.getModule(moduleId!),
        healthApi.listRuns(moduleId!, 1),
      ]);
      return buildModuleStatus(moduleConfig, runs[0] ?? null);
    },
    enabled: isAuthenticated && Boolean(moduleId) && !statusLoading && !cachedModule,
    retry: false,
  });

  const module = cachedModule ?? moduleQuery.data ?? null;
  const isLoading = statusLoading || (moduleQuery.isLoading && !cachedModule);
  const isNotFound =
    !isLoading &&
    !isError &&
    !moduleQuery.isError &&
    Boolean(moduleId) &&
    !module;

  return {
    module,
    isLoading,
    isError: isError || moduleQuery.isError,
    isNotFound,
    refetch,
  };
}
