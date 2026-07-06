import { useEffect, useRef, useState } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useAuth } from '../../../contexts/AuthContext';
import { healthApi } from '../services/healthApi';
import {
  buildDashboard,
  buildModuleStatus,
  buildSummaryFromModules,
  mapAIAnalysis,
  normalizeRunDetail,
} from '../utils/healthMappers';
import type {
  ArtifactPurgePayload,
  HealthDashboardData,
  ModuleConfig,
  NotificationConfiguredSendPayload,
  NotificationSettings,
  NotificationTestPayload,
  ScheduleUpdate,
  ModuleUpdate,
  TriggerRunRequest,
} from '../types/health';

export const HEALTH_QUERY_KEYS = {
  status: ['health', 'status'] as const,
  catalog: ['health', 'catalog'] as const,
  serviceInfo: ['health', 'service-info'] as const,
  artifactRetention: ['health', 'artifact-retention'] as const,
  module: (moduleId: string) => ['health', 'module', moduleId] as const,
  runs: (moduleId: string) => ['health', 'runs', moduleId] as const,
  runDetail: (runId: string) => ['health', 'run', runId] as const,
  notifications: ['notificationSettings'] as const,
  ai: (runId: string) => ['health', 'ai', runId] as const,
};

const SSE_RECONNECT_MS = 12_000;
const POLL_INTERVAL_MS = 30_000;

export function useHealthStatus() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [apiReachable, setApiReachable] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const query = useQuery({
    queryKey: HEALTH_QUERY_KEYS.status,
    queryFn: async () => {
      const raw = await healthApi.getStatus();
      return buildDashboard(raw);
    },
    enabled: isAuthenticated,
    refetchInterval: sseConnected ? false : POLL_INTERVAL_MS,
    placeholderData: (previous) => previous,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      setApiReachable(false);
      return;
    }

    let cancelled = false;
    healthApi.probe().then((result) => {
      if (!cancelled) {
        setApiReachable(result.ok);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, query.dataUpdatedAt]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;

    const connect = async () => {
      if (cancelled) return;

      try {
        const { ticket } = await healthApi.issueSseTicket();
        if (cancelled) return;

        eventSourceRef.current?.close();
        const es = new EventSource(healthApi.getSseStreamUrl(ticket));
        eventSourceRef.current = es;

        es.addEventListener('status', (event) => {
          try {
            const raw = JSON.parse((event as MessageEvent<string>).data);
            queryClient.setQueryData<HealthDashboardData>(
              HEALTH_QUERY_KEYS.status,
              buildDashboard(raw),
            );
            setApiReachable(true);
          } catch {
            // Ignore malformed SSE payloads; polling will recover.
          }
        });

        es.onopen = () => {
          if (!cancelled) {
            setSseConnected(true);
            setApiReachable(true);
          }
        };

        es.onerror = () => {
          setSseConnected(false);
          es.close();
          if (!cancelled) {
            reconnectTimer = setTimeout(connect, SSE_RECONNECT_MS);
          }
        };
      } catch {
        setSseConnected(false);
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, SSE_RECONNECT_MS);
        }
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      setSseConnected(false);
    };
  }, [isAuthenticated, queryClient]);

  return {
    ...query,
    apiReachable,
    sseConnected,
  };
}

export function useTestCatalog() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.catalog,
    queryFn: () => healthApi.getTestCatalog(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRunHistory(moduleId: string, limit = 25) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.runs(moduleId),
    queryFn: async () => {
      const runs = await healthApi.listRuns(moduleId, limit);
      return runs.map(normalizeRunDetail);
    },
    enabled: isAuthenticated && Boolean(moduleId),
    refetchInterval: (query) => {
      const hasActive = query.state.data?.some((run) => run.status === 'running');
      return hasActive ? 5_000 : POLL_INTERVAL_MS;
    },
  });
}

export function useRunDetail(runId: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.runDetail(runId ?? ''),
    queryFn: async () => normalizeRunDetail(await healthApi.getRunDetail(runId!)),
    enabled: isAuthenticated && Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'running' ? 5_000 : false;
    },
  });
}

export function usePlaywrightServiceInfo() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.serviceInfo,
    queryFn: () => healthApi.getServiceInfo(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useTriggerRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId }: TriggerRunRequest) => {
      const raw = await healthApi.triggerRun(moduleId);
      return normalizeRunDetail(raw);
    },
    onSuccess: (run, { moduleId }) => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.runs(moduleId) });
      if (run.id) {
        queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.runDetail(run.id) });
      }
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Partial<ModuleConfig>) => healthApi.createModule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.catalog });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleUpdate }) =>
      healthApi.updateModule(id, payload),
    onSuccess: (_module, { id }) => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.module(id) });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.runs(id) });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ModuleUpdate }) =>
      healthApi.updateModule(id, payload),
    onSuccess: (_module, { id }) => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.module(id) });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.runs(id) });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => healthApi.deleteModule(moduleId),
    onMutate: async (moduleId) => {
      await queryClient.cancelQueries({ queryKey: HEALTH_QUERY_KEYS.status });

      const previous = queryClient.getQueryData<HealthDashboardData>(
        HEALTH_QUERY_KEYS.status,
      );

      if (previous) {
        const modules = previous.modules.filter((m) => m.id !== moduleId);
        queryClient.setQueryData<HealthDashboardData>(HEALTH_QUERY_KEYS.status, {
          ...previous,
          modules,
          summary: buildSummaryFromModules(modules),
          lastUpdated: new Date().toISOString(),
        });
      }

      queryClient.removeQueries({ queryKey: HEALTH_QUERY_KEYS.module(moduleId) });
      queryClient.removeQueries({ queryKey: HEALTH_QUERY_KEYS.runs(moduleId) });

      return { previous };
    },
    onError: (_err, _moduleId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(HEALTH_QUERY_KEYS.status, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
    },
  });
}

export function useArtifactRetention() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.artifactRetention,
    queryFn: () => healthApi.getArtifactRetention(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function usePurgeArtifacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload?: ArtifactPurgePayload) => healthApi.purgeArtifacts(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.artifactRetention });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.serviceInfo });
    },
  });
}

export function useNotificationSettings() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.notifications,
    queryFn: () => healthApi.getNotificationSettings(),
    enabled: isAuthenticated,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: NotificationSettings) =>
      healthApi.updateNotificationSettings(settings),
    onSuccess: (view) => {
      queryClient.setQueryData(HEALTH_QUERY_KEYS.notifications, view);
    },
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: (payload?: NotificationTestPayload) =>
      healthApi.sendTestNotification(payload),
  });
}

export function useSendConfiguredNotification() {
  return useMutation({
    mutationFn: (payload?: NotificationConfiguredSendPayload) =>
      healthApi.sendConfiguredNotification(payload),
  });
}

export function useAIAnalysis(runId: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.ai(runId ?? ''),
    queryFn: async () => mapAIAnalysis(await healthApi.analyzeRun(runId!)),
    enabled: isAuthenticated && Boolean(runId),
    staleTime: 5 * 60 * 1000,
  });
}
