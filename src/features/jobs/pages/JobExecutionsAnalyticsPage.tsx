import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, CheckCircle, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { jobExecutionService } from "../services/jobExecutionService";
import {
  TrendDataPoint,
  ErrorAnalysisItem,
  ExecutionByTrigger,
  ResourceUtilizationStats,
  PerformanceSummary,
  ExecutionByHour,
  HealthScoreResponse,
  SlowestExecution,
} from "../types/jobExecution";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { XCircle, Activity, Clock } from "lucide-react";
import DateFormatter from "../../../shared/components/DateFormatter";

const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
};

const CustomTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-sm"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor: entry.color || color.primary.accent,
              }}
            />
            {entry.name || "Count"}
          </span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function JobExecutionsAnalyticsPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysisItem[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<
    { label: string; value: number }[]
  >([]);
  const [triggerDistribution, setTriggerDistribution] = useState<
    ExecutionByTrigger[]
  >([]);
  const [resourceUtilization, setResourceUtilization] =
    useState<ResourceUtilizationStats | null>(null);
   
  const [performanceSummary, _setPerformanceSummary] =
    useState<PerformanceSummary | null>(null);
  const [executionsByHour, setExecutionsByHour] = useState<ExecutionByHour[]>(
    []
  );
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(
    null
  );
  const [slowestExecutions, setSlowestExecutions] = useState<SlowestExecution[]>(
    []
  );
  const [workers, setWorkers] = useState<any[]>([]);
  const [executionStats, setExecutionStats] = useState<any>(null);
  const [slaCompliance, setSlaCompliance] = useState<any>(null);
  const [successRate, setSuccessRate] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [averageDuration, setAverageDuration] = useState<any>(null);
  const [workerPageSize] = useState(20);
  const [workerCurrentPage, setWorkerCurrentPage] = useState(1);
  const [workerTotalCount, setWorkerTotalCount] = useState(0);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    // No job-specific filtering for global analytics
    try {
      const [
        stats,
        sla,
        success,
        duration,
        trends,
        errors,
        triggers,
        resources,
        byHour,
        health,
        slowest,
      ] = await Promise.all([
        jobExecutionService.getExecutionStatistics().catch(() => null),
        jobExecutionService.getSLACompliance().catch(() => null),
        jobExecutionService.getSuccessRate().catch(() => null),
        jobExecutionService.getAverageDuration().catch(() => null),
        jobExecutionService.getTrendData().catch(() => []),
        jobExecutionService.getErrorAnalysis().catch(() => []),
        jobExecutionService.getExecutionsByTrigger().catch(() => []),
        jobExecutionService.getResourceUtilizationStats().catch(() => null),
        jobExecutionService.getExecutionsByHour().catch(() => []),
        jobExecutionService.getExecutionHealthScore().catch(() => null),
        jobExecutionService.getSlowestExecutions({ limit: 10 }).catch(() => []),
      ]);

      // Unwrap data from API response wrapper
      function unwrapData(response: any) {
        if (!response) return null;
        if (response && typeof response === "object" && "data" in response) {
          return response.data;
        }
        return response;
      }

      const unwrappedStats = unwrapData(stats);
      const unwrappedSla = unwrapData(sla);
      const unwrappedSuccess = unwrapData(success);
      const unwrappedDuration = unwrapData(duration);

      setExecutionStats(unwrappedStats);
      setSlaCompliance(unwrappedSla);
      setSuccessRate(unwrappedSuccess);
      setAverageDuration(unwrappedDuration);

      // Ensure all chart data is arrays
      function normalizeArray<T>(data: unknown): T[] {
        if (!data) return [];
        if (Array.isArray(data)) return data as T[];
        if (
          data &&
          typeof data === "object" &&
          "data" in data
        ) {
          const wrapped = data as { data?: unknown };
          if (Array.isArray(wrapped.data)) {
            return wrapped.data as T[];
          }
        }
        return [];
      }

      setTrendData(normalizeArray<TrendDataPoint>(trends));
      setErrorAnalysis(normalizeArray<ErrorAnalysisItem>(errors));
      setResourceUtilization(unwrapData(resources));
      setExecutionsByHour(normalizeArray<ExecutionByHour>(byHour));
      setHealthScore(unwrapData(health));
      setSlowestExecutions(normalizeArray<SlowestExecution>(slowest));

      // Build status distribution from stats
      if (unwrappedStats) {
        const successful = parseInt(String(unwrappedStats.successful), 10) || 0;
        const failed = parseInt(String(unwrappedStats.failed), 10) || 0;
        const timedOut = parseInt(String(unwrappedStats.timed_out), 10) || 0;
        const aborted = parseInt(String(unwrappedStats.aborted), 10) || 0;
        setStatusDistribution([
          { label: "Successful", value: successful },
          { label: "Failed", value: failed },
          { label: "Timed Out", value: timedOut },
          { label: "Aborted", value: aborted },
        ]);
      } else {
        setStatusDistribution([]);
      }

      setTriggerDistribution(normalizeArray(triggers));
    } catch (err) {
      showError(
        t.analytics.title,
        err instanceof Error ? err.message : t.analytics.failedToLoadAnalytics
      );
    } finally {
      setIsLoading(false);
    }
  }, [showError, t]);

  // Load Worker Node Stats with pagination
  useEffect(() => {
    const loadWorkerStats = async () => {
      try {
        const response = await jobExecutionService.getWorkerNodeStats({
          limit: workerPageSize,
          offset: (workerCurrentPage - 1) * workerPageSize,
          skipCache: true,
        });

        // Handle paginated response
        if (response && typeof response === "object" && "data" in response) {
          setWorkers(response.data || []);
          const paginatedResponse = response as { pagination?: { total?: number }; count?: number };
          setWorkerTotalCount(
            paginatedResponse.pagination?.total || paginatedResponse.count || 0
          );
        } else if (Array.isArray(response)) {
          // Legacy response
          setWorkers(response);
          setWorkerTotalCount(response.length);
        }
      } catch (err) {
        console.error("Failed to load worker stats:", err);
      }
    };
    loadWorkerStats();
  }, [workerCurrentPage, workerPageSize]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/job-executions")}
          className={`p-2 ${tw.rounded} text-sm hover:text-gray-900 hover:bg-gray-100 transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Job Executions Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-1 text-sm`}>
            Comprehensive analytics and insights for job executions
          </p>
        </div>
      </div>

      {/* Key Metrics - All Statistics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-sm">
              Total Executions
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {executionStats?.total_executions || 0}
          </p>
        </div>
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-sm">Successful</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {parseInt(String(executionStats?.successful || 0), 10)}
          </p>
        </div>
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-sm">Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {parseInt(String(executionStats?.failed || 0), 10)}
          </p>
        </div>
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Activity
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-sm">Timed Out</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {parseInt(String(executionStats?.timed_out || 0), 10)}
          </p>
        </div>
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Clock
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-sm">Aborted</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {parseInt(String(executionStats?.aborted || 0), 10)}
          </p>
        </div>
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-sm">Success Rate</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {successRate?.success_rate
              ? `${Number(successRate.success_rate).toFixed(1)}%`
              : "0%"}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={
                  Array.isArray(statusDistribution) ? statusDistribution : []
                }
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) =>
                  `${name} ${((percent || 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(Array.isArray(statusDistribution)
                  ? statusDistribution
                  : []
                ).map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trigger Distribution */}
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trigger Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                Array.isArray(triggerDistribution) ? triggerDistribution : []
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trigger_type" />
              <YAxis />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b8169" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Data */}
        {trendData.length > 0 && (
          <div
            className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Execution Trends (30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={Array.isArray(trendData) ? trendData : []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="executions"
                  stroke="#3b8169"
                  name="Total"
                />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke="#10b981"
                  name="Successful"
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  name="Failed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Error Analysis */}
        {errorAnalysis.length > 0 && (
          <div
            className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Errors (30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={
                  Array.isArray(errorAnalysis) ? errorAnalysis.slice(0, 10) : []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="error_code"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: "transparent" }}
                />
                <Bar dataKey="error_count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SLA Compliance Details */}
      {slaCompliance && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            SLA Compliance Details
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Total Executions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {slaCompliance.total_executions || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">SLA Breaches</p>
              <p className="text-2xl font-bold text-red-600">
                {slaCompliance.sla_breaches || 0}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                Compliance Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {slaCompliance.compliance_rate
                  ? `${Number(slaCompliance.compliance_rate).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {slaCompliance.average_duration_minutes
                  ? `${slaCompliance.average_duration_minutes}m`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Additional Analytics Sections */}
      {resourceUtilization && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resource Utilization
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Memory</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.average_memory_mb
                  ? `${Number(resourceUtilization.average_memory_mb).toFixed(0)} MB`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peak Memory</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.peak_memory_mb
                  ? `${Number(resourceUtilization.peak_memory_mb).toFixed(0)} MB`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg CPU</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.average_cpu_percent
                  ? `${Number(resourceUtilization.average_cpu_percent).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peak CPU</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.peak_cpu_percent
                  ? `${Number(resourceUtilization.peak_cpu_percent).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {performanceSummary && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Summary
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {performanceSummary.success_rate
                  ? `${Number(performanceSummary.success_rate).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">P95 Duration</p>
              <p className="text-xl font-bold text-gray-900">
                {performanceSummary.p95_duration_seconds
                  ? `${Math.round(
                      performanceSummary.p95_duration_seconds / 60
                    )}m`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">P99 Duration</p>
              <p className="text-xl font-bold text-gray-900">
                {performanceSummary.p99_duration_seconds
                  ? `${Math.round(
                      performanceSummary.p99_duration_seconds / 60
                    )}m`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">
                SLA Compliance
              </p>
              <p className="text-xl font-bold text-gray-900">
                {performanceSummary.sla_compliance_rate
                  ? `${Number(performanceSummary.sla_compliance_rate).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {healthScore && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Execution Health Score
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {healthScore.health_score
                ? `${Number(healthScore.health_score).toFixed(0)}/100`
                : "—"}
            </div>
            {healthScore.factors && healthScore.factors.length > 0 && (
              <div className="flex-1">
                {healthScore.factors.map(
                  (
                    factor: { factor: string; score: number; weight: number },
                    idx: number
                  ) => (
                    <div key={idx} className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-sm">{factor.factor}</span>
                        <span className="font-medium">
                          {Number(factor.score).toFixed(0)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executions by Hour */}
      {executionsByHour.length > 0 && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Executions by Hour
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Array.isArray(executionsByHour) ? executionsByHour : []}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend />
              <Bar dataKey="count" fill="#3b8169" name="Total" />
              <Bar dataKey="successful" fill="#10b981" name="Successful" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Worker Node Stats */}
      {workers.length > 0 && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Worker Node Statistics
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Worker Node</th>
                  <th className="text-right py-2 px-4">Total</th>
                  <th className="text-right py-2 px-4">Successful</th>
                  <th className="text-right py-2 px-4">Failed</th>
                  <th className="text-right py-2 px-4">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((worker: any, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="py-2 px-4 font-mono text-xs">
                      {worker.worker_node_id}
                    </td>
                    <td className="text-right py-2 px-4">
                      {worker.total_executions}
                    </td>
                    <td className="text-right py-2 px-4 text-green-600">
                      {worker.successful_executions}
                    </td>
                    <td className="text-right py-2 px-4 text-red-600">
                      {worker.failed_executions}
                    </td>
                    <td className="text-right py-2 px-4">
                      {worker.average_duration_seconds
                        ? `${Math.round(
                            worker.average_duration_seconds / 60
                          )}m`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls for Worker Node Statistics */}
          {workerTotalCount > workerPageSize && (
            <div className="flex items-center justify-between gap-4 mt-4 px-6 py-2">
              <span className="text-sm text-sm">
                Showing{" "}
                <strong>
                  {(workerCurrentPage - 1) * workerPageSize + 1}-
                  {Math.min(workerCurrentPage * workerPageSize, workerTotalCount)}
                </strong>{" "}
                of <strong>{workerTotalCount}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkerCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={workerCurrentPage === 1}
                  className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: color.surface.border }}
                  title="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-sm min-w-[50px] text-center">
                  Page {workerCurrentPage}
                </span>
                <button
                  onClick={() => setWorkerCurrentPage((p) => p + 1)}
                  disabled={workerCurrentPage * workerPageSize >= workerTotalCount}
                  className="p-2 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ borderColor: color.surface.border }}
                  title="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Failure Analysis - Disabled for now */}
      {/* {stepFailureAnalysis.length > 0 && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Step Failure Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={
                Array.isArray(stepFailureAnalysis)
                  ? stepFailureAnalysis.slice(0, 10)
                  : []
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step_id" />
              <YAxis />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Bar dataKey="failure_count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )} */}

      {/* Slowest Executions */}
      {slowestExecutions.length > 0 && (
        <div
          className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Slowest Executions
          </h3>
          <div className="space-y-2">
            {slowestExecutions
              .slice(0, 10)
              .map((exec: SlowestExecution, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Job {exec.job_id || "—"}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      {exec.execution_id
                        ? `${exec.execution_id.substring(0, 8)}...`
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {exec.duration_seconds
                        ? `${Math.round(exec.duration_seconds / 60)}m`
                        : "—"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {exec.started_at ? (
                        <DateFormatter date={exec.started_at} useUserTimezone />
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
