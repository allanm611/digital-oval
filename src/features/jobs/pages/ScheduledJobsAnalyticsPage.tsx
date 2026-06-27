import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
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
} from "recharts";
import { scheduledJobService } from "../services/scheduledJobService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

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
                backgroundColor:
                  entry.color || color.charts.scheduledJobs.primary,
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

type GenericRecord = Record<string, unknown>;

export default function ScheduledJobsAnalyticsPage(): JSX.Element {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [executionStats, setExecutionStats] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [slaCompliance, setSlaCompliance] = useState<{
    within_sla?: number;
    breached?: number;
    breach_rate_percent?: number;
  } | null>(null);
  const [mostFailed, setMostFailed] = useState<Array<GenericRecord>>([]);
  const [longestRunning, setLongestRunning] = useState<Array<GenericRecord>>(
    []
  );
  const [resourceUtilization, setResourceUtilization] = useState<Record<
    string,
    number
  > | null>(null);
  const [highFailureRate, setHighFailureRate] = useState<Array<GenericRecord>>(
    []
  );
  const [statusCounts, setStatusCounts] = useState<
    Array<{ status: string; count: number | string }>
  >([]);
  const [typeCounts, setTypeCounts] = useState<
    Array<{ label: string; count: number }>
  >([]);
  const [ownerCounts, setOwnerCounts] = useState<
    Array<{ label: string; count: number | string }>
  >([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        execStats,
        sla,
        failed,
        running,
        resources,
        failureRate,
        status,
        types,
        owners,
      ] = await Promise.all([
        scheduledJobService.getExecutionStatistics(true).catch(() => null),
        scheduledJobService.getSlaCompliance(true).catch(() => null),
        scheduledJobService.getMostFailed(10, true).catch(() => []),
        scheduledJobService.getLongestRunning(10, true).catch(() => []),
        scheduledJobService.getResourceUtilization(true).catch(() => null),
        scheduledJobService.getHighFailureRate(true).catch(() => []),
        scheduledJobService.getCountByStatus(true).catch(() => []),
        scheduledJobService.getCountByType(true).catch(() => []),
        scheduledJobService.getCountByOwner(true).catch(() => []),
      ]);

      const execStatsData =
        execStats && typeof execStats === "object" && "data" in execStats
          ? execStats.data
          : execStats;
      setExecutionStats(execStatsData as Record<string, unknown> | null);

      let slaData = null;
      if (sla && typeof sla === "object") {
        if (Array.isArray(sla)) {
          const totalBreaches = sla.reduce(
            (sum, job) => sum + (parseInt(job.sla_breaches || "0", 10) || 0),
            0
          );
          const totalExecutions = sla.reduce(
            (sum, job) =>
              sum + (parseInt(job.total_executions || "0", 10) || 0),
            0
          );
          const breachRate =
            totalExecutions > 0
              ? ((totalBreaches / totalExecutions) * 100).toFixed(1)
              : "0";
          slaData = {
            within_sla: totalExecutions - totalBreaches,
            breached: totalBreaches,
            breach_rate_percent: parseFloat(breachRate),
          };
        } else if ("data" in sla && Array.isArray(sla.data)) {
          const totalBreaches = sla.data.reduce(
            (sum, job) => sum + (parseInt(job.sla_breaches || "0", 10) || 0),
            0
          );
          const totalExecutions = sla.data.reduce(
            (sum, job) =>
              sum + (parseInt(job.total_executions || "0", 10) || 0),
            0
          );
          const breachRate =
            totalExecutions > 0
              ? ((totalBreaches / totalExecutions) * 100).toFixed(1)
              : "0";
          slaData = {
            within_sla: totalExecutions - totalBreaches,
            breached: totalBreaches,
            breach_rate_percent: parseFloat(breachRate),
          };
        } else {
          slaData = sla;
        }
      }
      setSlaCompliance(slaData);

      const failedData: Array<GenericRecord> =
        failed && typeof failed === "object" && "data" in failed
          ? (failed.data as Array<GenericRecord>)
          : Array.isArray(failed)
          ? (failed as Array<GenericRecord>)
          : [];
      setMostFailed(failedData);

      const runningData: Array<GenericRecord> =
        running && typeof running === "object" && "data" in running
          ? (running.data as Array<GenericRecord>)
          : Array.isArray(running)
          ? (running as Array<GenericRecord>)
          : [];
      setLongestRunning(runningData);

      // Normalize resource utilization - handle wrapped response, string numbers, and null values
      let resourcesData: Record<string, number> | null = null;
      if (resources) {
        const rawData =
          typeof resources === "object" && "data" in resources
            ? (resources.data as Record<string, string | number | null>)
            : (resources as Record<string, string | number | null>);

        if (rawData && typeof rawData === "object") {
          const normalized: Record<string, number> = {};
          Object.entries(rawData).forEach(([key, value]) => {
            // Skip null values
            if (value !== null && value !== undefined) {
              // Convert string numbers to numbers
              if (typeof value === "string") {
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                  normalized[key] = numValue;
                }
              } else if (typeof value === "number") {
                normalized[key] = value;
              }
            }
          });
          resourcesData =
            Object.keys(normalized).length > 0 ? normalized : null;
        }
      }
      setResourceUtilization(resourcesData);

      const failureRateData: Array<GenericRecord> =
        failureRate && typeof failureRate === "object" && "data" in failureRate
          ? (failureRate.data as Array<GenericRecord>)
          : Array.isArray(failureRate)
          ? (failureRate as Array<GenericRecord>)
          : [];
      setHighFailureRate(failureRateData);

      const statusData: Array<{ status: string; count: number | string }> =
        status && typeof status === "object" && "data" in status
          ? (status.data as Array<{ status: string; count: number | string }>)
          : Array.isArray(status)
          ? (status as Array<{ status: string; count: number | string }>)
          : [];
      setStatusCounts(statusData);

      const typesData: Array<GenericRecord> =
        types && typeof types === "object" && "data" in types
          ? (types.data as Array<GenericRecord>)
          : Array.isArray(types)
          ? (types as Array<GenericRecord>)
          : [];
      const normalizedTypes = typesData.map((item: GenericRecord) => ({
        label: (item.job_type as string) || (item.label as string) || "Unknown",
        count:
          typeof item.count === "string"
            ? parseInt(item.count as string, 10) || 0
            : typeof item.count === "number"
            ? (item.count as number)
            : 0,
      }));
      setTypeCounts(normalizedTypes);

      const ownersData: Array<GenericRecord> =
        owners && typeof owners === "object" && "data" in owners
          ? (owners.data as Array<GenericRecord>)
          : Array.isArray(owners)
          ? (owners as Array<GenericRecord>)
          : [];
      const normalizedOwners = ownersData.map((item: GenericRecord) => {
        // Backend groups by technical_owner_id (always a number)
        // business_owner can be null, so we prioritize technical_owner_id
        let ownerLabel: string;
        if (
          item.technical_owner_id !== null &&
          item.technical_owner_id !== undefined
        ) {
          // technical_owner_id is the primary field used for grouping
          // Check if there's a label/owner name, otherwise use the ID
          if (
            item.owner !== null &&
            item.owner !== undefined &&
            item.owner !== ""
          ) {
            ownerLabel = item.owner as string;
          } else if (
            item.label !== null &&
            item.label !== undefined &&
            item.label !== ""
          ) {
            ownerLabel = item.label as string;
          } else {
            // Fallback to displaying the technical owner ID
            ownerLabel = `Technical Owner ID: ${item.technical_owner_id}`;
          }
        } else if (
          item.owner !== null &&
          item.owner !== undefined &&
          item.owner !== ""
        ) {
          ownerLabel = item.owner as string;
        } else if (
          item.label !== null &&
          item.label !== undefined &&
          item.label !== ""
        ) {
          ownerLabel = item.label as string;
        } else {
          ownerLabel = "Unassigned";
        }

        return {
          label: ownerLabel,
          count:
            typeof item.count === "string"
              ? parseInt(item.count as string, 10) || 0
              : typeof item.count === "number"
              ? (item.count as number)
              : 0,
        };
      });
      setOwnerCounts(normalizedOwners);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      showError(t.analytics.failedToLoadAnalytics, t.analytics.errorLoadingData);
    } finally {
      setIsLoading(false);
    }
  }, [showError, t]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="space-y-8">
      <BackButton showBreadcrumb={true} currentLabel="Scheduled Jobs Analytics" />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-8">
          {slaCompliance && (
            <div className="grid gap-4 md:grid-cols-3">
              <div
                className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-sm">
                    Within SLA
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {slaCompliance.within_sla || 0}
                </p>
              </div>
              <div
                className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-sm">
                    SLA Breached
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {slaCompliance.breached || 0}
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
                  <p className="text-sm font-medium text-sm">
                    Breach Rate
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {slaCompliance.breach_rate_percent
                    ? `${slaCompliance.breach_rate_percent}%`
                    : "0%"}
                </p>
              </div>
            </div>
          )}

          <div>
            {mostFailed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Most Failed Jobs
                </h3>
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
                          Job Name
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
                          Failure Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mostFailed.map((job: GenericRecord, index: number) => (
                        <tr
                          key={(job.id as string | number) || index}
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                          }}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(job.name as string) ||
                              (job.job_name as string) ||
                              "Unknown"}
                          </td>
                          <td className="px-6 py-4 text-sm text-sm">
                            {(job.failures as number) ||
                              (job.total_failures as number) ||
                              0}
                          </td>
                          <td className="px-6 py-4 text-sm text-sm">
                            {job.failure_rate
                              ? `${String(job.failure_rate)}%`
                              : job.failure_rate_percent
                              ? `${String(job.failure_rate_percent)}%`
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {longestRunning.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Longest Running Jobs
                </h3>
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
                          Job Name
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Duration
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Last Run
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {longestRunning.map(
                        (job: GenericRecord, index: number) => (
                          <tr
                            key={(job.id as string | number) || index}
                            className="hover:bg-gray-50 transition-colors"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {(job.name as string) ||
                                (job.job_name as string) ||
                                "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-sm">
                              {job.avg_duration_seconds
                                ? `${parseFloat(
                                    String(job.avg_duration_seconds)
                                  ).toFixed(2)}s`
                                : job.max_duration_seconds
                                ? `${String(job.max_duration_seconds)}s`
                                : (job.duration as string) ||
                                  (job.avg_duration as string) ||
                                  "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-sm">
                              {job.last_run_at
                                ? new Date(
                                    String(job.last_run_at)
                                  ).toLocaleString()
                                : "Never"}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {highFailureRate.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  High Failure Rate Jobs
                </h3>
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
                          Job Name
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Failure Rate
                        </th>
                        <th
                          className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Total Failures
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {highFailureRate.map(
                        (job: GenericRecord, index: number) => (
                          <tr
                            key={(job.id as string | number) || index}
                            className="hover:bg-gray-50 transition-colors"
                            style={{
                              backgroundColor: color.surface.tablebodybg,
                            }}
                          >
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {(job.name as string) ||
                                (job.job_name as string) ||
                                "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-sm text-red-600 font-medium">
                              {job.failure_rate
                                ? `${String(job.failure_rate)}%`
                                : job.failure_rate_percent
                                ? `${String(job.failure_rate_percent)}%`
                                : "N/A"}
                            </td>
                            <td className="px-6 py-4 text-sm text-sm">
                              {(job.failures as number) ||
                                (job.total_failures as number) ||
                                0}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8">
            <div className="grid gap-6 md:grid-cols-2">
              {statusCounts.length > 0 && (
                <div
                  className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Status Distribution
                  </h3>
                  <div className="h-64 w-full min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <PieChart>
                        <Pie
                          data={statusCounts.map((item) => {
                            const status =
                              "status" in item
                                ? String(item.status)
                                : "label" in item
                                ? String((item as { label?: string }).label)
                                : "Unknown";
                            const count =
                              typeof item.count === "string"
                                ? parseInt(item.count, 10) || 0
                                : item.count || 0;
                            return {
                              name:
                                status.charAt(0).toUpperCase() +
                                status.slice(1),
                              value: count,
                            };
                          })}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: { name?: string; percent?: number }) =>
                            `${props.name || ""}: ${(
                              (props.percent || 0) * 100
                            ).toFixed(0)}%`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          isAnimationActive={true}
                          animationDuration={300}
                        >
                          {statusCounts.map((_entry, index) => {
                            const pieColors =
                              color.charts.scheduledJobs.pieColors;
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={pieColors[index % pieColors.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: "transparent" }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => (
                            <span
                              style={{ fontSize: "12px", color: "var(--c-text-secondary)" }}
                            >
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {typeCounts.length > 0 && (
                <div
                  className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Job Type Distribution
                  </h3>
                  <div className="h-96 w-full min-h-[384px]">
                    <ResponsiveContainer width="100%" height={384}>
                      <BarChart
                        data={typeCounts.map((item) => {
                          const count =
                            typeof item.count === "string"
                              ? parseInt(item.count, 10) || 0
                              : item.count || 0;
                          return {
                            name: item.label,
                            count: count,
                          };
                        })}
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
                          fill={color.charts.scheduledJobs.primary}
                          radius={[4, 4, 0, 0]}
                          name="Jobs"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {ownerCounts.length > 0 && (
              <div
                className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm mb-8 mt-8`}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Jobs by Owner
                </h3>
                <div className="h-96 w-full min-h-[384px]">
                  <ResponsiveContainer width="100%" height={384}>
                    <BarChart
                      data={ownerCounts.map((item) => {
                        const count =
                          typeof item.count === "string"
                            ? parseInt(item.count, 10) || 0
                            : item.count || 0;
                        return {
                          name: item.label || "Unknown Owner",
                          count: count,
                        };
                      })}
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
                        fill={color.charts.scheduledJobs.accent}
                        radius={[4, 4, 0, 0]}
                        name="Jobs"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {executionStats && Object.keys(executionStats).length > 0 && (
              <div className="mb-8">
                <div
                  className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Execution Counts
                  </h3>
                  <div className="h-96 w-full min-h-[384px]">
                    <ResponsiveContainer width="100%" height={384}>
                      <BarChart
                        data={Object.entries(executionStats)
                          .filter(([key]) =>
                            [
                              "total_executions",
                              "successful",
                              "failed",
                              "sla_breached",
                            ].includes(key)
                          )
                          .map(([key, value]) => ({
                            name: key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()),
                            value:
                              typeof value === "string"
                                ? parseFloat(value) || parseInt(value, 10) || 0
                                : typeof value === "number"
                                ? value
                                : 0,
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
                          dataKey="value"
                          fill={color.charts.scheduledJobs.execution}
                          radius={[4, 4, 0, 0]}
                          name="Count"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div
                  className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm mt-8`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="h-96 w-full min-h-[384px]">
                    <ResponsiveContainer width="100%" height={384}>
                      <BarChart
                        data={Object.entries(executionStats)
                          .filter(([key]) =>
                            [
                              "avg_duration_seconds",
                              "min_duration_seconds",
                              "max_duration_seconds",
                              "avg_rows_processed",
                            ].includes(key)
                          )
                          .map(([key, value]) => ({
                            name: key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()),
                            value:
                              typeof value === "string"
                                ? parseFloat(value) || parseInt(value, 10) || 0
                                : typeof value === "number"
                                ? value
                                : 0,
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
                          dataKey="value"
                          fill={color.charts.scheduledJobs.performance}
                          radius={[4, 4, 0, 0]}
                          name="Value"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {resourceUtilization &&
              Object.keys(resourceUtilization).length > 0 && (
                <div
                  className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm mb-8`}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resource Utilization
                  </h3>
                  <div className="h-64 w-full min-h-[256px]">
                    <ResponsiveContainer width="100%" height={256}>
                      <BarChart
                        data={Object.entries(resourceUtilization).map(
                          ([key, value]) => ({
                            name: key
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase()),
                            value:
                              typeof value === "string"
                                ? parseFloat(value) || parseInt(value, 10) || 0
                                : typeof value === "number"
                                ? value
                                : 0,
                          })
                        )}
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
                          fill={color.charts.scheduledJobs.secondary}
                          radius={[4, 4, 0, 0]}
                          name="Value"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
