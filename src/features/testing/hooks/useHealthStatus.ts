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
  mapAIAnalysis,
  normalizeRunDetail,
} from '../utils/healthMappers';
import type {
  HealthDashboardData,
  ModuleConfig,
  NotificationSettings,
  ScheduleUpdate,
  ModuleUpdate,
} from '../types/health';

export const HEALTH_QUERY_KEYS = {
  status: ['health', 'status'] as const,
  catalog: ['health', 'catalog'] as const,
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
    refetchInterval: POLL_INTERVAL_MS,
  });
}

export function useRunDetail(runId: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: HEALTH_QUERY_KEYS.runDetail(runId ?? ''),
    queryFn: async () => normalizeRunDetail(await healthApi.getRunDetail(runId!)),
    enabled: isAuthenticated && Boolean(runId),
  });
}

export function useTriggerRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => healthApi.triggerRun(moduleId),
    onSuccess: (_run, moduleId) => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.runs(moduleId) });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HEALTH_QUERY_KEYS.status });
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
    onSuccess: (settings) => {
      queryClient.setQueryData(HEALTH_QUERY_KEYS.notifications, settings);
    },
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
