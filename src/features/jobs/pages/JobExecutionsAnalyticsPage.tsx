import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
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
import { jobExecutionService } from "../services/jobExecutionService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"];

export default function JobExecutionsAnalyticsPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [executionStats, setExecutionStats] = useState<any>(null);
  const [slaCompliance, setSlaCompliance] = useState<any>(null);
  const [successRate, setSuccessRate] = useState<any>(null);
  const [averageDuration, setAverageDuration] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [errorAnalysis, setErrorAnalysis] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [triggerDistribution, setTriggerDistribution] = useState<any[]>([]);
  const [resourceUtilization, setResourceUtilization] = useState<any>(null);
  const [dataQualityMetrics, setDataQualityMetrics] = useState<any>(null);
  const [failurePatterns, setFailurePatterns] = useState<any[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);
  const [executionDistribution, setExecutionDistribution] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any[]>([]);
  const [workerNodeStats, setWorkerNodeStats] = useState<any[]>([]);
  const [serverInstanceStats, setServerInstanceStats] = useState<any[]>([]);
  const [stepFailureAnalysis, setStepFailureAnalysis] = useState<any[]>([]);
  const [durationOutliers, setDurationOutliers] = useState<any[]>([]);
  const [retryAnalysis, setRetryAnalysis] = useState<any>(null);
  const [executionsByHour, setExecutionsByHour] = useState<any[]>([]);
  const [peakTimes, setPeakTimes] = useState<any[]>([]);
  const [healthScore, setHealthScore] = useState<any>(null);
  const [slowestExecutions, setSlowestExecutions] = useState<any[]>([]);
  const [resourceIssues, setResourceIssues] = useState<any[]>([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
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
        dataQuality,
        failurePatternsData,
        performance,
        distribution,
        daily,
        workers,
        servers,
        steps,
        outliers,
        retry,
        byHour,
        peaks,
        health,
        slowest,
        issues,
      ] = await Promise.all([
        jobExecutionService.getExecutionStatistics().catch(() => null),
        jobExecutionService.getSLACompliance().catch(() => null),
        jobExecutionService.getSuccessRate().catch(() => null),
        jobExecutionService.getAverageDuration().catch(() => null),
        jobExecutionService.getTrendData({ daysBack: 30 }).catch(() => []),
        jobExecutionService.getErrorAnalysis({ daysBack: 30 }).catch(() => []),
        jobExecutionService.getExecutionsByTrigger().catch(() => []),
        jobExecutionService.getResourceUtilizationStats().catch(() => null),
        jobExecutionService.getDataQualityMetrics().catch(() => null),
        jobExecutionService.getFailurePatterns().catch(() => []),
        jobExecutionService
          .getPerformanceSummary({ daysBack: 30 })
          .catch(() => null),
        jobExecutionService.getExecutionDistribution().catch(() => []),
        // Note: getDailySummary requires jobId, skipping for now
        Promise.resolve([]),
        jobExecutionService.getWorkerNodeStats().catch(() => []),
        jobExecutionService
          .getServerInstanceStats({ daysBack: 30 })
          .catch(() => []),
        jobExecutionService
          .getStepFailureAnalysis({ daysBack: 30 })
          .catch(() => []),
        jobExecutionService
          .getDurationOutliers({ daysBack: 30 })
          .catch(() => []),
        jobExecutionService
          .getRetryAnalysis({ daysBack: 30 })
          .catch(() => null),
        jobExecutionService
          .getExecutionsByHour({ daysBack: 30 })
          .catch(() => []),
        jobExecutionService.getPeakExecutionTimes().catch(() => []),
        jobExecutionService.getExecutionHealthScore().catch(() => null),
        jobExecutionService
          .getSlowestExecutions({ limit: 10, daysBack: 30 })
          .catch(() => []),
        jobExecutionService
          .getExecutionsWithResourceIssues({ limit: 10 })
          .catch(() => []),
      ]);

      setExecutionStats(stats);
      setSlaCompliance(sla);
      setSuccessRate(success);
      setAverageDuration(duration);
      setTrendData(trends || []);
      setErrorAnalysis(errors || []);
      setResourceUtilization(resources);
      setDataQualityMetrics(dataQuality);
      setFailurePatterns(failurePatternsData || []);
      setPerformanceSummary(performance);
      setExecutionDistribution(distribution || []);
      setDailySummary(daily || []);
      setWorkerNodeStats(workers || []);
      setServerInstanceStats(servers || []);
      setStepFailureAnalysis(steps || []);
      setDurationOutliers(outliers || []);
      setRetryAnalysis(retry);
      setExecutionsByHour(byHour || []);
      setPeakTimes(peaks || []);
      setHealthScore(health);
      setSlowestExecutions(slowest || []);
      setResourceIssues(issues || []);

      // Build status distribution from stats
      if (stats) {
        setStatusDistribution([
          { name: "Success", value: stats.successful_executions || 0 },
          { name: "Failed", value: stats.failed_executions || 0 },
          { name: "Running", value: stats.running_executions || 0 },
          { name: "Queued", value: stats.queued_executions || 0 },
        ]);
      }

      setTriggerDistribution(triggers || []);
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
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/job-executions")}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">
              Total Executions
            </p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {executionStats?.total_executions || 0}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Success Rate</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {successRate?.success_rate
              ? `${successRate.success_rate.toFixed(1)}%`
              : "—"}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">Avg Duration</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {averageDuration?.average_duration_seconds
              ? `${Math.round(averageDuration.average_duration_seconds / 60)}m`
              : "—"}
          </p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-gray-600">SLA Compliance</p>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {slaCompliance?.compliance_rate
              ? `${slaCompliance.compliance_rate.toFixed(1)}%`
              : "—"}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Status Distribution */}
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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

        {/* Trigger Distribution */}
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Trigger Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={triggerDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="trigger_type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b8169" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Data */}
        {trendData.length > 0 && (
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Execution Trends (30 Days)
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
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Top Errors (30 Days)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={errorAnalysis.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="error_code"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="error_count" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SLA Compliance Details */}
      {slaCompliance && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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
                  ? `${slaCompliance.compliance_rate.toFixed(1)}%`
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
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resource Utilization
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Avg Memory</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.average_memory_mb
                  ? `${resourceUtilization.average_memory_mb.toFixed(0)} MB`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peak Memory</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.peak_memory_mb
                  ? `${resourceUtilization.peak_memory_mb.toFixed(0)} MB`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg CPU</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.average_cpu_percent
                  ? `${resourceUtilization.average_cpu_percent.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Peak CPU</p>
              <p className="text-xl font-bold text-gray-900">
                {resourceUtilization.peak_cpu_percent
                  ? `${resourceUtilization.peak_cpu_percent.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {performanceSummary && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Summary
          </h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-xl font-bold text-gray-900">
                {performanceSummary.success_rate
                  ? `${performanceSummary.success_rate.toFixed(1)}%`
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
                  ? `${performanceSummary.sla_compliance_rate.toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {healthScore && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Execution Health Score
          </h3>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {healthScore.health_score
                ? `${healthScore.health_score.toFixed(0)}/100`
                : "—"}
            </div>
            {healthScore.factors && healthScore.factors.length > 0 && (
              <div className="flex-1">
                {healthScore.factors.map((factor: any, idx: number) => (
                  <div key={idx} className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{factor.factor}</span>
                      <span className="font-medium">
                        {factor.score.toFixed(0)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${factor.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Executions by Hour */}
      {executionsByHour.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Executions by Hour
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={executionsByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b8169" name="Total" />
              <Bar dataKey="successful" fill="#10b981" name="Successful" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Worker Node Stats */}
      {workerNodeStats.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
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
                {workerNodeStats
                  .slice(0, 10)
                  .map((worker: any, idx: number) => (
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
        </div>
      )}

      {/* Step Failure Analysis */}
      {stepFailureAnalysis.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Step Failure Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stepFailureAnalysis.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="step_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="failure_count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Slowest Executions */}
      {slowestExecutions.length > 0 && (
        <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Slowest Executions
          </h3>
          <div className="space-y-2">
            {slowestExecutions.slice(0, 10).map((exec: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div>
                  <p className="text-sm font-medium">Job {exec.job_id}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {exec.execution_id.substring(0, 8)}...
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {Math.round(exec.duration_seconds / 60)}m
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(exec.started_at).toLocaleDateString()}
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
