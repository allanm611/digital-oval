import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import type { StepType, JobWorkflowStep } from "../types/jobWorkflowStep";

// const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

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
      className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
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

const STEP_TYPE_OPTIONS: Array<{ label: string; value: StepType }> = [
  { label: "SQL", value: "sql" },
  { label: "Stored Procedure", value: "stored_proc" },
  { label: "API Call", value: "api_call" },
  { label: "Python Script", value: "python_script" },
  { label: "Node.js Script", value: "node_js_script" },
  { label: "Shell Script", value: "shell_script" },
  { label: "File Transfer", value: "file_transfer" },
  { label: "Data Validation", value: "data_validation" },
  { label: "Notification", value: "notification" },
  { label: "Wait", value: "wait" },
];

const getStepTypeLabel = (type: StepType): string => {
  const option = STEP_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

export default function JobWorkflowStepsAnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobIdParam = searchParams.get("job_id");
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<{
    total_steps: number;
    steps_by_type: Record<string, number>;
    steps_by_failure_action: Record<string, number>;
    average_timeout: number;
    average_retry_count: number;
    critical_steps_percentage: number;
  } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<{
    mostFailed: Array<{
      step_id: number;
      step_name: string;
      step_code: string;
      job_id: number;
      failure_count: number;
      last_failure_at: string | null;
    }>;
    longestRunning: Array<{
      step_id: number;
      step_name: string;
      step_code: string;
      job_id: number;
      average_duration_seconds: number;
      max_duration_seconds: number;
    }>;
    typeDistribution: Array<{
      step_type: StepType;
      count: number;
      percentage: number;
    }>;
    complexWorkflows: Array<{
      job_id: number;
      job_name: string;
      total_steps: number;
      parallel_groups: number;
      dependencies: number;
      complexity_score: number;
    }>;
    dependencyComplexity: Array<{
      job_id: number;
      job_name: string;
      max_depth: number;
      total_dependencies: number;
      circular_dependencies: boolean;
    }>;
    timeoutAnalysis: Array<{
      step_type: string;
      step_count: string | number;
      avg_timeout: string | number;
      min_timeout: number;
      max_timeout: number;
      timeout_count: string | number;
      timeout_rate_percent: number | null;
    }>;
    validationSteps: JobWorkflowStep[];
    retrySteps: JobWorkflowStep[];
    orphanedSteps: JobWorkflowStep[];
  } | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const jobIdFilter = jobIdParam ? Number(jobIdParam) : undefined;

      const [
        stats,
        mostFailed,
        longestRunning,
        typeDistribution,
        complexWorkflows,
        dependencyComplexity,
        timeoutAnalysis,
        validationSteps,
        retrySteps,
        orphanedSteps,
      ] = await Promise.all([
        jobWorkflowStepService
          .getStatistics({ job_id: jobIdFilter, skipCache: true })
          .catch(() => ({
            success: true,
            data: {
              total_steps: 0,
              steps_by_type: {},
              steps_by_failure_action: {},
              average_timeout: 0,
              average_retry_count: 0,
              critical_steps_percentage: 0,
            },
          })),
        jobWorkflowStepService
          .getMostFailedSteps({ limit: 10, skipCache: true })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getLongestRunningSteps({ limit: 10, skipCache: true })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getTypeDistribution({ job_id: jobIdFilter, skipCache: true })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getComplexWorkflows({ skipCache: true })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getDependencyComplexity({
            job_id: jobIdFilter,
            skipCache: true,
          })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getTimeoutAnalysis({
            job_id: jobIdFilter,
            skipCache: true,
          })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getValidationSteps({
            job_id: jobIdFilter,
            skipCache: true,
          })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getRetrySteps({
            job_id: jobIdFilter,
            skipCache: true,
          })
          .catch(() => ({ success: true, data: [] })),
        jobWorkflowStepService
          .getOrphanedSteps(true)
          .catch(() => ({ success: true, data: [] })),
      ]);

      const validationStepsData =
        validationSteps &&
        typeof validationSteps === "object" &&
        "data" in validationSteps
          ? (validationSteps.data as JobWorkflowStep[])
          : Array.isArray(validationSteps)
          ? (validationSteps as JobWorkflowStep[])
          : [];

      const retryStepsData =
        retrySteps && typeof retrySteps === "object" && "data" in retrySteps
          ? (retrySteps.data as JobWorkflowStep[])
          : Array.isArray(retrySteps)
          ? (retrySteps as JobWorkflowStep[])
          : [];

      const orphanedStepsData =
        orphanedSteps &&
        typeof orphanedSteps === "object" &&
        "data" in orphanedSteps
          ? (orphanedSteps.data as JobWorkflowStep[])
          : Array.isArray(orphanedSteps)
          ? (orphanedSteps as JobWorkflowStep[])
          : [];

      setStatistics(stats.data || null);
      setAnalyticsData({
        mostFailed: mostFailed.data || [],
        longestRunning: longestRunning.data || [],
        typeDistribution: typeDistribution.data || [],
        complexWorkflows: complexWorkflows.data || [],
        dependencyComplexity: dependencyComplexity.data || [],
        timeoutAnalysis: (timeoutAnalysis.data || []) as Array<{
          step_type: string;
          step_count: string | number;
          avg_timeout: string | number;
          min_timeout: number;
          max_timeout: number;
          timeout_count: string | number;
          timeout_rate_percent: number | null;
        }>,
        validationSteps: validationStepsData,
        retrySteps: retryStepsData,
        orphanedSteps: orphanedStepsData,
      });
    } catch (err) {
      console.error("Failed to load analytics:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to load analytics data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [jobIdParam, showError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const typeDistributionChartData =
    analyticsData?.typeDistribution.map((item) => ({
      name: getStepTypeLabel(item.step_type),
      value: item.count,
      percentage: item.percentage != null ? item.percentage : 0,
    })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={() =>
            navigate(
              `/dashboard/job-workflow-steps${
                jobIdParam ? `?job_id=${jobIdParam}` : ""
              }`
            )
          }
          className={`${tw.rounded} p-2 text-gray-600 hover:text-gray-800 transition-colors`}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Job Workflow Steps Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Comprehensive analytics and insights for workflow steps
          </p>
        </div>
      </div>

      {!analyticsData ? (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-8 text-center`}
        >
          <p className="text-gray-500">No analytics data available</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Activity
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total Steps
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.total_steps || 0}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Critical Steps
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.critical_steps_percentage
                    ? `${statistics.critical_steps_percentage.toFixed(1)}%`
                    : "0%"}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Clock
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Avg Timeout
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.average_timeout
                    ? `${Math.round(statistics.average_timeout)}s`
                    : "0s"}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Zap
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Avg Retries
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.average_retry_count
                    ? statistics.average_retry_count.toFixed(1)
                    : "0"}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Step Types
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {Object.keys(statistics.steps_by_type || {}).length}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Failure Actions
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {Object.keys(statistics.steps_by_failure_action || {}).length}
                </p>
              </div>
            </div>
          )}

          {/* Type Distribution */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Step Type Distribution
            </h2>
            {typeDistributionChartData.length > 0 ? (
              <div className="h-[600px] w-full min-h-[600px]">
                <ResponsiveContainer width="100%" height={600}>
                  <BarChart
                    data={typeDistributionChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="value"
                      fill={color.primary.accent}
                      radius={[4, 4, 0, 0]}
                      name="Steps"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>

          {/* Failure Actions Distribution */}
          {statistics &&
            statistics.steps_by_failure_action &&
            Object.keys(statistics.steps_by_failure_action).length > 0 && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Failure Actions Distribution
                </h2>
                <div className="h-[600px] w-full min-h-[600px]">
                  <ResponsiveContainer width="100%" height={600}>
                    <BarChart
                      data={Object.entries(
                        statistics.steps_by_failure_action
                      ).map(([key, value]) => ({
                        name: key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase()),
                        count:
                          typeof value === "number"
                            ? value
                            : parseInt(String(value), 10) || 0,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Bar
                        dataKey="count"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Steps"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          {/* Most Failed Steps - Bar Chart and Table */}
          {analyticsData.mostFailed.length > 0 && (
            <div className="space-y-6">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Most Failed Steps
                </h2>
                <div className="h-96 w-full min-h-[384px]">
                  <ResponsiveContainer width="100%" height={384}>
                    <BarChart
                      data={analyticsData.mostFailed
                        .slice(0, 10)
                        .map((item) => {
                          const stepName =
                            item.step_name || `Step ${item.step_id}`;
                          return {
                            name:
                              stepName.length > 20
                                ? stepName.substring(0, 20) + "..."
                                : stepName,
                            failures: item.failure_count || 0,
                            fullName: stepName,
                          };
                        })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                        formatter={(
                          value: number,
                          _name: string,
                          props: { payload?: { fullName?: string } }
                        ) => [
                          value,
                          `Failures: ${props.payload?.fullName || ""}`,
                        ]}
                      />
                      <Bar
                        dataKey="failures"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Failures"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Most Failed Steps (Table)
                </h2>
                <div className="overflow-x-auto">
                  <table
                    className="w-full"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopLeftRadius: "0.375rem",
                          }}
                        >
                          Step Name
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Step Code
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Failures
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Last Failure
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.mostFailed.map((item) => (
                        <tr
                          key={item.step_id}
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/job-workflow-steps/${item.step_id}?job_id=${item.job_id}`
                                )
                              }
                              className="hover:underline text-left"
                              style={{ color: color.primary.accent }}
                            >
                              {item.step_name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.step_code}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                            {item.failure_count}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.last_failure_at
                              ? new Date(
                                  item.last_failure_at
                                ).toLocaleDateString()
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Longest Running Steps - Bar Chart and Table */}
          {analyticsData.longestRunning.length > 0 && (
            <div className="space-y-6">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Longest Running Steps
                </h2>
                <div className="h-96 w-full min-h-[384px]">
                  <ResponsiveContainer width="100%" height={384}>
                    <BarChart
                      data={analyticsData.longestRunning
                        .slice(0, 10)
                        .map((item) => {
                          const stepName =
                            item.step_name || `Step ${item.step_id}`;
                          return {
                            name:
                              stepName.length > 20
                                ? stepName.substring(0, 20) + "..."
                                : stepName,
                            avgDuration: Math.round(
                              (item.average_duration_seconds || 0) / 60
                            ),
                            maxDuration: Math.round(
                              (item.max_duration_seconds || 0) / 60
                            ),
                            fullName: stepName,
                          };
                        })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}m`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                        formatter={(value: number, name: string) => [
                          `${value} minutes`,
                          name === "avgDuration"
                            ? "Avg Duration"
                            : "Max Duration",
                        ]}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgDuration"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Avg Duration (min)"
                      />
                      <Bar
                        dataKey="maxDuration"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Max Duration (min)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Longest Running Steps (Table)
                </h2>
                <div className="overflow-x-auto">
                  <table
                    className="w-full"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopLeftRadius: "0.375rem",
                          }}
                        >
                          Step Name
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Step Code
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Avg Duration
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Max Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.longestRunning.map((item) => (
                        <tr
                          key={item.step_id}
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/job-workflow-steps/${item.step_id}?job_id=${item.job_id}`
                                )
                              }
                              className="hover:underline text-left"
                              style={{ color: color.primary.accent }}
                            >
                              {item.step_name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {item.step_code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                            {Math.round(item.average_duration_seconds / 60)}m
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                            {Math.round(item.max_duration_seconds / 60)}m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Complex Workflows */}
          {analyticsData.complexWorkflows &&
            analyticsData.complexWorkflows.length > 0 && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Complex Workflows
                </h2>
                <div className="space-y-2">
                  {analyticsData.complexWorkflows.slice(0, 10).map((item) => {
                    const jobName = item.job_name || `Job ${item.job_id}`;
                    return (
                      <div
                        key={item.job_id}
                        className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-gray-50 p-3`}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {jobName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.total_steps || 0} steps,{" "}
                            {item.parallel_groups || 0} parallel groups,{" "}
                            {item.dependencies || 0} dependencies
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700">
                          Score: {(item.complexity_score || 0).toFixed(1)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Dependency Complexity */}
          {analyticsData.dependencyComplexity &&
            analyticsData.dependencyComplexity.length > 0 && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Dependency Complexity
                </h2>
                <div className="h-96 w-full min-h-[384px]">
                  <ResponsiveContainer width="100%" height={384}>
                    <BarChart
                      data={analyticsData.dependencyComplexity
                        .slice(0, 10)
                        .map((item) => {
                          const jobName = item.job_name || `Job ${item.job_id}`;
                          return {
                            name:
                              jobName.length > 20
                                ? jobName.substring(0, 20) + "..."
                                : jobName,
                            maxDepth: item.max_depth || 0,
                            totalDependencies: item.total_dependencies || 0,
                            fullName: jobName,
                            hasCircular: item.circular_dependencies ? 1 : 0,
                          };
                        })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => value.toLocaleString()}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                        formatter={(value: number, name: string) => {
                          if (name === "hasCircular") {
                            return value === 1 ? "Yes" : "No";
                          }
                          return value;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="maxDepth"
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                        name="Max Depth"
                      />
                      <Bar
                        dataKey="totalDependencies"
                        fill="#ec4899"
                        radius={[4, 4, 0, 0]}
                        name="Total Dependencies"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          {/* Timeout Analysis */}
          {analyticsData.timeoutAnalysis &&
            analyticsData.timeoutAnalysis.length > 0 && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Timeout Analysis by Step Type
                </h2>
                <div className="h-96 w-full min-h-[384px]">
                  <ResponsiveContainer width="100%" height={384}>
                    <BarChart
                      data={analyticsData.timeoutAnalysis.map((item) => {
                        const stepType = getStepTypeLabel(
                          item.step_type as StepType
                        );
                        const stepCount =
                          typeof item.step_count === "string"
                            ? parseInt(item.step_count, 10) || 0
                            : item.step_count || 0;
                        const avgTimeout =
                          typeof item.avg_timeout === "string"
                            ? parseFloat(item.avg_timeout) || 0
                            : item.avg_timeout || 0;
                        const timeoutCount =
                          typeof item.timeout_count === "string"
                            ? parseInt(item.timeout_count, 10) || 0
                            : item.timeout_count || 0;
                        const timeoutRate = item.timeout_rate_percent || 0;

                        return {
                          name: stepType,
                          avgTimeout: Math.round(avgTimeout),
                          minTimeout: item.min_timeout || 0,
                          maxTimeout: item.max_timeout || 0,
                          stepCount: stepCount,
                          timeoutCount: timeoutCount,
                          timeoutRate: timeoutRate
                            ? Math.round(timeoutRate * 100) / 100
                            : 0,
                        };
                      })}
                      margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={120}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value}s`}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                        formatter={(value: number, name: string) => {
                          if (name === "timeoutRate") {
                            return `${value}%`;
                          }
                          if (name === "stepCount" || name === "timeoutCount") {
                            return value.toString();
                          }
                          return `${value}s`;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="avgTimeout"
                        fill="#f59e0b"
                        radius={[4, 4, 0, 0]}
                        name="Avg Timeout (s)"
                      />
                      <Bar
                        dataKey="minTimeout"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        name="Min Timeout (s)"
                      />
                      <Bar
                        dataKey="maxTimeout"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="Max Timeout (s)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

          {/* Validation Steps */}
          {analyticsData.validationSteps &&
            analyticsData.validationSteps.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Steps with Validation Queries
                </h2>
                <div className="overflow-x-auto">
                  <table
                    className="w-full"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopLeftRadius: "0.375rem",
                          }}
                        >
                          Step Name
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Step Code
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Step Type
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Has Pre-Validation
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Has Post-Validation
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.validationSteps
                        .slice(0, 20)
                        .map((step) => (
                          <tr
                            key={step.id}
                            className="hover:bg-gray-50 transition-colors"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <td className="px-6 py-4 text-sm">
                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/job-workflow-steps/${step.id}?job_id=${step.job_id}`
                                  )
                                }
                                className="hover:underline text-left"
                                style={{ color: color.primary.accent }}
                              >
                                {step.step_name}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {step.step_code}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {getStepTypeLabel(step.step_type)}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {step.pre_validation_query ? (
                                <span className="text-green-600 font-semibold">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-gray-400">No</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              {step.post_validation_query ? (
                                <span className="text-green-600 font-semibold">
                                  Yes
                                </span>
                              ) : (
                                <span className="text-gray-400">No</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          {/* Retry Steps */}
          {analyticsData.retrySteps && analyticsData.retrySteps.length > 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Steps with Retry Configuration
              </h2>
              {/* Graph commented out - using table only */}
              {/* <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={analyticsData.retrySteps
                      .reduce((acc, step) => {
                        const retryCount = step.retry_count || 0;
                        const existing = acc.find((item) => item.retryCount === retryCount);
                        if (existing) {
                          existing.count += 1;
                        } else {
                          acc.push({ retryCount, count: 1 });
                        }
                        return acc;
                      }, [] as Array<{ retryCount: number; count: number }>)
                      .sort((a, b) => a.retryCount - b.retryCount)
                      .map((item) => ({
                        name: `${item.retryCount} ${item.retryCount === 1 ? "Retry" : "Retries"}`,
                        count: item.count,
                      }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      name="Steps"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div> */}
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Step Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Step Code
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Retry Count
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Retry Delay (s)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.retrySteps.slice(0, 20).map((step) => (
                      <tr
                        key={step.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                        }}
                      >
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/job-workflow-steps/${step.id}?job_id=${step.job_id}`
                              )
                            }
                            className="hover:underline text-left"
                            style={{ color: color.primary.accent }}
                          >
                            {step.step_name}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {step.step_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-semibold">
                          {step.retry_count || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {step.retry_delay_seconds || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Orphaned Steps */}
          {analyticsData.orphanedSteps &&
            analyticsData.orphanedSteps.length > 0 && (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Orphaned Steps
                </h2>
                <div className="overflow-x-auto">
                  <table
                    className="w-full"
                    style={{
                      borderCollapse: "separate",
                      borderSpacing: "0 8px",
                    }}
                  >
                    <thead>
                      <tr>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopLeftRadius: "0.375rem",
                          }}
                        >
                          Step Name
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Step Code
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Step Type
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Job ID
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.orphanedSteps.slice(0, 20).map((step) => (
                        <tr
                          key={step.id}
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/job-workflow-steps/${step.id}?job_id=${step.job_id}`
                                )
                              }
                              className="hover:underline text-left"
                              style={{ color: color.primary.accent }}
                            >
                              {step.step_name}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {step.step_code}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {getStepTypeLabel(step.step_type)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {step.job_id}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {step.is_active ? (
                              <span className="text-green-600 font-semibold">
                                Active
                              </span>
                            ) : (
                              <span className="text-gray-400">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </>
      )}
    </div>
  );
}
