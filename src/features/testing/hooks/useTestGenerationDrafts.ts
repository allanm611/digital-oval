import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { healthApi } from '../services/healthApi';
import { HEALTH_QUERY_KEYS } from './useHealthStatus';
import type { GeneratedTestDraft, GeneratedTestDraftStatus, GenerateTestRequestPayload } from '../types/health';

function invalidateDraftQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['health', 'drafts'] });
}

export function useGeneratedDrafts(filter?: { moduleId?: string; status?: GeneratedTestDraftStatus }) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.drafts(filter),
    queryFn: () => healthApi.listGeneratedDrafts(filter),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });
}

export function useGeneratedDraft(id: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.draft(id ?? ''),
    queryFn: () => healthApi.getGeneratedDraft(id!),
    enabled: isAuthenticated && Boolean(id),
  });
}

/** Kicks off AI generation — always returns a persisted draft, even if AI generation isn't configured server-side. */
export function useRequestTestGeneration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateTestRequestPayload) => healthApi.requestTestGeneration(payload),
    onSuccess: () => invalidateDraftQueries(queryClient),
  });
}

/** Writes the reviewed draft to e2e/tests/generated/ and refreshes the test catalog so it's runnable immediately. */
export function useApproveGeneratedDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => healthApi.approveGeneratedDraft(id),
    onSuccess: (draft: GeneratedTestDraft) => {
      queryClient.setQueryData(HEALTH_QUERY_KEYS.draft(draft.id), draft);
      invalidateDraftQueries(queryClient);
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.catalog });
    },
  });
}

export function useRejectGeneratedDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => healthApi.rejectGeneratedDraft(id),
    onSuccess: (draft: GeneratedTestDraft) => {
      queryClient.setQueryData(HEALTH_QUERY_KEYS.draft(draft.id), draft);
      invalidateDraftQueries(queryClient);
    },
  });
}
