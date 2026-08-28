import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { healthApi } from '../services/healthApi';
import { HEALTH_QUERY_KEYS } from './useHealthStatus';
import type { UiFlowTestCase, UiFlowTestCasePayload, UiFlowTestCaseResult } from '../types/health';

/** New/edited UI flow test cases change what shows up in the test-suite picker. */
function invalidateUiFlowTestQueries(queryClient: ReturnType<typeof useQueryClient>, moduleId?: string) {
  queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.uiFlowTests(moduleId) });
  queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.uiFlowTests() });
  queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.catalog });
}

export function useUiFlowTestCases(moduleId?: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.uiFlowTests(moduleId),
    queryFn: () => healthApi.listUiFlowTestCases(moduleId),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useUiFlowTestCase(id: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.uiFlowTest(id ?? ''),
    queryFn: () => healthApi.getUiFlowTestCase(id!),
    enabled: isAuthenticated && Boolean(id),
  });
}

export function useCreateUiFlowTestCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UiFlowTestCasePayload) => healthApi.createUiFlowTestCase(payload),
    onSuccess: (created) => {
      invalidateUiFlowTestQueries(queryClient, created.moduleId ?? undefined);
    },
  });
}

export function useUpdateUiFlowTestCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<UiFlowTestCasePayload> }) =>
      healthApi.updateUiFlowTestCase(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<UiFlowTestCase>(HEALTH_QUERY_KEYS.uiFlowTest(updated.id), updated);
      invalidateUiFlowTestQueries(queryClient, updated.moduleId ?? undefined);
    },
  });
}

export function useDeleteUiFlowTestCase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => healthApi.deleteUiFlowTestCase(id),
    onSuccess: () => {
      invalidateUiFlowTestQueries(queryClient);
    },
  });
}

/** "Try now" — enqueues a browser run and polls until screenshots/results are ready. */
export function useTryUiFlowTestCase() {
  return useMutation<UiFlowTestCaseResult, unknown, Partial<UiFlowTestCasePayload> & { id?: string }>({
    mutationFn: (payload) => healthApi.tryUiFlowTestCase(payload),
  });
}
