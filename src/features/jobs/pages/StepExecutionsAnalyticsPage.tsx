import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  XCircle,
} from "lucide-react";
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
import { stepExecutionService } from "../services/stepExecutionService";
import {
  ExecutionStatistics,
  SuccessRateResponse,
  AverageDurationResponse,
  TrendDataPoint,
  ErrorAnalysisItem,
  ExecutionByTrigger,
  FailurePattern,
  PerformanceSummary,
  ExecutionDistribution,
  ExecutionsByHour,
  PeakTimes,
  HealthScoreResponse,
  RetryAnalysis,
  DurationOutlier,
  ExecutionTimelineItem,
  ExecutionComparison,
  ExecutionHeatmap,
  AnomalyDetection,
  ConcurrentExecutionAnalysis,
} from "../types/jobExecution";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export default function StepExecutionsAnalyticsPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<ExecutionStatistics | null>(
    null
  );
  const [successRate, setSuccessRate] = useState<SuccessRateResponse | null>(
    null
  );
  const [averageDuration, setAverageDuration] =
    useState<AverageDurationResponse | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysisItem[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<
    ExecutionByTrigger[]
  >([]);
  const [failurePatterns, setFailurePatterns] = useState<FailurePattern[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [performanceSummary, setPerformanceSummary] =
    useState<PerformanceSummary | null>(null);
  const [executionDistribution, setExecutionDistribution] = useState<
    ExecutionDistribution[]
  >([]);
  const [executionsByHour, setExecutionsByHour] = useState<ExecutionsByHour[]>(
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [peakTimes, setPeakTimes] = useState<PeakTimes[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [healthScore, setHealthScore] = useState<HealthScoreResponse | null>(
    null
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [retryAnalysis, setRetryAnalysis] = useState<RetryAnalysis | null>(
    null
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [durationOutliers, setDurationOutliers] = useState<DurationOutlier[]>(
    []
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [executionTimeline, setExecutionTimeline] = useState<
    ExecutionTimelineItem[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [executionComparison, setExecutionComparison] =
    useState<ExecutionComparison | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [executionHeatmap, setExecutionHeatmap] =
    useState<ExecutionHeatmap | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [anomalyDetection, setAnomalyDetection] =
    useState<AnomalyDetection | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [concurrentAnalysis, setConcurrentAnalysis] =
    useState<ConcurrentExecutionAnalysis | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        stats,
        success,
        duration,
        trends,
        errors,
        failures,
        performance,
        distribution,
        byHour,
        peaks,
        health,
        retry,
        outliers,
        timeline,
        comparison,
        heatmap,
        anomaly,
        concurrent,
      ] = await Promise.all([
        stepExecutionService
          .getStepExecutionStatistics({ skipCache: true })
          .catch(() => null),
        stepExecutionService
          .getSuccessRate({ skipCache: true })
          .catch(() => null),
        stepExecutionService
          .getAverageDuration({ skipCache: true })
          .catch(() => null),
        stepExecutionService.getTrendData().catch(() => ({ data: [] })),
        stepExecutionService.getErrorAnalysis().catch(() => ({ data: [] })),
        stepExecutionService.getFailurePatterns().catch(() => ({ data: [] })),
        stepExecutionService.getPerformanceSummary().catch(() => null),
        stepExecutionService
          .getExecutionDistribution()
          .catch(() => ({ data: [] })),
        stepExecutionService
          .getStepExecutionsByHour()
          .catch(() => ({ data: [] })),
        stepExecutionService
          .getPeakExecutionTimes()
          .catch(() => ({ data: [] })),
        stepExecutionService.getExecutionHealthScore().catch(() => null),
        stepExecutionService.getRetryAnalysis().catch(() => null),
        stepExecutionService.getDurationOutliers().catch(() => ({ data: [] })),
        Promise.resolve({ data: [] }),
        Promise.resolve(null),
        Promise.resolve(null),
        stepExecutionService.getAnomalyDetection().catch(() => null),
        stepExecutionService.getConcurrentExecutionAnalysis().catch(() => null),
      ]);

      // Normalize statistics response
      const statsData =
        stats && typeof stats === "object" && "data" in stats
          ? stats.data
          : stats;
      setStatistics(statsData);

      // Normalize success rate response
      const successData =
        success && typeof success === "object" && "data" in success
          ? success.data
          : success;
      setSuccessRate(successData);

      // Normalize average duration response
      const durationData =
        duration && typeof duration === "object" && "data" in duration
          ? duration.data
          : duration;
      setAverageDuration(durationData);

      // Build status distribution from statistics if available
      if (statsData) {
        const statusData = [];
        if (statsData.successful) {
          statusData.push({
            name: "Success",
            value:
              typeof statsData.successful === "string"
                ? parseInt(statsData.successful) || 0
                : statsData.successful || 0,
          });
        }
        if (statsData.failed) {
          statusData.push({
            name: "Failure",
            value:
              typeof statsData.failed === "string"
                ? parseInt(statsData.failed) || 0
                : statsData.failed || 0,
          });
        }
        if (statsData.timed_out) {
          statusData.push({
            name: "Timed Out",
            value:
              typeof statsData.timed_out === "string"
                ? parseInt(statsData.timed_out) || 0
                : statsData.timed_out || 0,
          });
        }
        setStatusDistribution(statusData);
      }
      setTrendData(
        trends && "data" in trends
          ? trends.data
          : Array.isArray(trends)
          ? trends
          : []
      );
      setErrorAnalysis(
        errors && "data" in errors
          ? errors.data
          : Array.isArray(errors)
          ? errors
          : []
      );
      setFailurePatterns(
        failures && "data" in failures
          ? failures.data
          : Array.isArray(failures)
          ? failures
          : []
      );
      setPerformanceSummary(performance);
      setExecutionDistribution(
        distribution && "data" in distribution
          ? distribution.data
          : Array.isArray(distribution)
          ? distribution
          : []
      );
      setExecutionsByHour(
        byHour && "data" in byHour
          ? byHour.data
          : Array.isArray(byHour)
          ? byHour
          : []
      );
      setPeakTimes(
        peaks && "data" in peaks
          ? peaks.data
          : Array.isArray(peaks)
          ? peaks
          : []
      );
      setHealthScore(health);
      setRetryAnalysis(retry);
      setDurationOutliers(
        outliers && "data" in outliers
          ? outliers.data
          : Array.isArray(outliers)
          ? outliers
          : []
      );
      setExecutionTimeline(
        timeline && "data" in timeline
          ? timeline.data
          : Array.isArray(timeline)
          ? timeline
          : []
      );
      setExecutionComparison(comparison);
      setExecutionHeatmap(heatmap);
      setAnomalyDetection(anomaly);
      setConcurrentAnalysis(concurrent);

      // Build status distribution from statistics if available
      if (stats && stats.data) {
        const statsData = stats.data;
        const statusData = [];
        if (statsData.successful) {
          statusData.push({
            name: "Success",
            value: parseInt(statsData.successful) || 0,
          });
        }
        if (statsData.failed) {
          statusData.push({
            name: "Failure",
            value: parseInt(statsData.failed) || 0,
          });
        }
        if (statsData.timed_out) {
          statusData.push({
            name: "Timed Out",
            value: parseInt(statsData.timed_out) || 0,
          });
        }
        setStatusDistribution(statusData);
      }
    } catch (err) {
      showError(
        "Analytics",
        err instanceof Error ? err.message : "Failed to load analytics"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/step-executions")}
          className={`p-2 ${tw.rounded} text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Step Executions Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-1 text-sm`}>
            Comprehensive analytics and insights for step executions
          </p>
        </div>
      </div>

      {/* Key Metrics - All Statistics */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <BarChart3
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Total Executions
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics?.total_executions
              ? parseInt(statistics.total_executions) || 0
              : 0}
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
            <p className="text-sm font-medium text-gray-600">Successful</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics?.successful
              ? typeof statistics.successful === "string"
                ? parseInt(statistics.successful) || 0
                : statistics.successful || 0
              : 0}
          </p>
        </div>
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <XCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics?.failed
              ? typeof statistics.failed === "string"
                ? parseInt(statistics.failed) || 0
                : statistics.failed || 0
              : 0}
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
            <p className="text-sm font-medium text-gray-600">Timed Out</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {statistics?.timed_out
              ? typeof statistics.timed_out === "string"
                ? parseInt(statistics.timed_out) || 0
                : statistics.timed_out || 0
              : 0}
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
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {successRate?.success_rate
              ? `${successRate.success_rate.toFixed(1)}%`
              : "—"}
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
            <p className="text-sm font-medium text-gray-600">Avg Duration</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {averageDuration?.average_duration_seconds
              ? `${Math.round(averageDuration.average_duration_seconds / 60)}m`
              : statistics?.avg_duration_seconds
              ? `${Math.round(
                  parseFloat(statistics.avg_duration_seconds) / 60
                )}m`
              : "—"}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        {statusDistribution.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Execution Distribution */}
        {executionDistribution.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Execution Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Trend Data */}
        {trendData.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Execution Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS[0]}
                  name="Executions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Executions By Hour */}
        {executionsByHour.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Executions By Hour
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={executionsByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS[1]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Error Analysis */}
        {errorAnalysis.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Error Analysis
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="error_code" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Failure Patterns */}
        {failurePatterns.length > 0 && (
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Failure Patterns
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={failurePatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pattern" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS[3]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
