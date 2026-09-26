import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { healthApi } from '../services/healthApi';
import { HEALTH_QUERY_KEYS } from './useHealthStatus';
import type { ApiTestCase, ApiTestCasePayload, ApiTestCaseResult } from '../types/health';

/** New/edited API test cases change what shows up in the test-suite picker. */
function invalidateApiTestQueries(queryClient: ReturnType<typeof useQueryClient>, moduleId?: string) {
  queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.apiTests(moduleId) });
  queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.apiTests() });
  queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.catalog });
}

export function useApiTestCases(moduleId?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.apiTests(moduleId),
    queryFn: () => healthApi.listApiTestCases(moduleId),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useApiTestCase(id: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.apiTest(id ?? ''),
    queryFn: () => healthApi.getApiTestCase(id!),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCreateApiTestCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ApiTestCasePayload) => healthApi.createApiTestCase(payload),
    onSuccess: (created) => {
      invalidateApiTestQueries(queryClient, created.moduleId ?? undefined);
    },
  });
}

export function useUpdateApiTestCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ApiTestCasePayload> }) =>
      healthApi.updateApiTestCase(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<ApiTestCase>(HEALTH_QUERY_KEYS.apiTest(updated.id), updated);
      invalidateApiTestQueries(queryClient, updated.moduleId ?? undefined);
    },
  });
}

export function useDeleteApiTestCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => healthApi.deleteApiTestCase(id),
    onSuccess: () => {
      invalidateApiTestQueries(queryClient);
    },
  });
}

/** "Try now" — executes a case (saved or draft) immediately without persisting a Playwright run. */
export function useTryApiTestCase() {
  return useMutation<ApiTestCaseResult, unknown, Partial<ApiTestCasePayload> & { id?: string }>({
    mutationFn: (payload) => healthApi.tryApiTestCase(payload),
  });
}
