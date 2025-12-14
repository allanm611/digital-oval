import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  GitBranch,
  Layers,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { jobWorkflowStepService } from "../services/jobWorkflowStepService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import type { StepType } from "../types/jobWorkflowStep";

const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

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
      step_id: number;
      step_name: string;
      configured_timeout: number;
      average_execution_time: number;
      timeout_utilization_percent: number;
      risk_level: "low" | "medium" | "high";
    }>;
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
      ]);

      setStatistics(stats.data || null);
      setAnalyticsData({
        mostFailed: mostFailed.data || [],
        longestRunning: longestRunning.data || [],
        typeDistribution: typeDistribution.data || [],
        complexWorkflows: complexWorkflows.data || [],
        dependencyComplexity: dependencyComplexity.data || [],
        timeoutAnalysis: timeoutAnalysis.data || [],
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
        <div className={`${tw.rounded} border border-gray-200 bg-white p-8 text-center`}>
          <p className="text-gray-500">No analytics data available</p>
        </div>
      ) : (
        <>
          {/* Statistics Cards */}
          {statistics && (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
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
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
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
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
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
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
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
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
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
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
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
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Step Type Distribution
            </h2>
            {typeDistributionChartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistributionChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) =>
                        `${name}: ${percentage.toFixed(1)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {typeDistributionChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {analyticsData.typeDistribution.map((item, index) => (
                    <div
                      key={item.step_type}
                      className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-gray-50 p-3`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {getStepTypeLabel(item.step_type)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {item.count} steps
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        {item.percentage != null ? item.percentage.toFixed(1) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No data available</p>
            )}
          </div>

          {/* Most Failed Steps - Table */}
          {analyticsData.mostFailed.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Most Failed Steps
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
                    {analyticsData.mostFailed.map((item, index) => (
                      <tr
                        key={item.step_id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                        }}
                      >
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.step_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.step_code}
                        </td>
                        <td className="px-6 py-4 text-sm text-red-600 font-semibold">
                          {item.failure_count}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.last_failure_at
                            ? new Date(item.last_failure_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Longest Running Steps - Table */}
          {analyticsData.longestRunning.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Longest Running Steps
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
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {item.step_name}
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
          )}

          {/* Complex Workflows */}
          {analyticsData.complexWorkflows && analyticsData.complexWorkflows.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-blue-500" />
                Complex Workflows
              </h2>
              <div className="space-y-2">
                {analyticsData.complexWorkflows.slice(0, 10).map((item) => (
                  <div
                    key={item.job_id}
                    className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-gray-50 p-3`}
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.job_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.total_steps} steps, {item.parallel_groups} parallel groups,{" "}
                        {item.dependencies} dependencies
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">
                      Score: {item.complexity_score.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dependency Complexity */}
          {analyticsData.dependencyComplexity &&
            analyticsData.dependencyComplexity.length > 0 && (
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-purple-500" />
                  Dependency Complexity
                </h2>
                <div className="space-y-2">
                  {analyticsData.dependencyComplexity.slice(0, 10).map((item) => (
                    <div
                      key={item.job_id}
                      className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-gray-50 p-3`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.job_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          Max depth: {item.max_depth}, Total dependencies:{" "}
                          {item.total_dependencies}
                        </div>
                      </div>
                      {item.circular_dependencies && (
                        <div className="text-sm font-semibold text-red-600">
                          Circular Dependencies
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Timeout Analysis */}
          {analyticsData.timeoutAnalysis &&
            analyticsData.timeoutAnalysis.length > 0 && (
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Timeout Analysis
                </h2>
                <div className="space-y-2">
                  {analyticsData.timeoutAnalysis
                    .filter((item) => item.risk_level !== "low")
                    .slice(0, 10)
                    .map((item) => (
                      <div
                        key={item.step_id}
                        className={`flex items-center justify-between ${tw.rounded} border border-gray-200 bg-gray-50 p-3`}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.step_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Configured: {item.configured_timeout}s, Avg execution:{" "}
                            {Math.round(item.average_execution_time)}s
                          </div>
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            item.risk_level === "high"
                              ? "text-red-600"
                              : item.risk_level === "medium"
                              ? "text-orange-600"
                              : "text-gray-600"
                          }`}
                        >
                          {item.risk_level ? `${item.risk_level.toUpperCase()} RISK` : "UNKNOWN RISK"}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
}
