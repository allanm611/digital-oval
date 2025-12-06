import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Link2,
  AlertTriangle,
  CheckCircle,
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
} from "recharts";
import { jobDependencyService } from "../services/jobDependencyService";
import { useToast } from "../../../contexts/ToastContext";
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
    <div className="rounded-md border border-gray-200 bg-white p-3 shadow-lg">
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
                backgroundColor:
                  entry.color ||
                  color.charts?.scheduledJobs?.primary ||
                  "#3b8169",
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

// Use colors from tokens instead of hardcoded values
const getChartColors = () => {
  return (
    color.charts?.campaigns?.pieColors || [
      color.charts?.campaigns?.primary || "#C38BFB",
      color.charts?.campaigns?.secondary || "#FC9C9C",
      color.charts?.campaigns?.accent || "#4FDFF3",
      color.charts?.offers?.buyOneGetOne || "#94DF5A",
      color.charts?.offers?.freeShipping || "#F7B430",
      color.charts?.products?.color6 || "#6B8E6B",
      color.charts?.products?.color7 || "#B84A6B",
      color.charts?.products?.color8 || "#A66B3D",
    ]
  );
};

export default function JobDependenciesAnalyticsPage(): JSX.Element {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statistics, setStatistics] = useState<any>(null);
  const [dependencyTypeDistribution, setDependencyTypeDistribution] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [waitForStatusDistribution, setWaitForStatusDistribution] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [mostDependedJobs, setMostDependedJobs] = useState<
    Array<{
      id: number;
      name: string;
      code: string;
      dependent_job_count: string;
      dependent_job_ids: number[];
    }>
  >([]);
  const [orphanedJobs, setOrphanedJobs] = useState<
    Array<{
      id: number;
      name: string;
      code: string;
      status: string;
      is_active: boolean;
    }>
  >([]);
  const [dependencyGraph, setDependencyGraph] = useState<any[]>([]);
  const [activeInactiveDistribution, setActiveInactiveDistribution] = useState<
    Array<{ name: string; value: number }>
  >([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        statsResponse,
        allDepsResponse,
        mostDependedResponse,
        orphanedResponse,
        graphResponse,
      ] = await Promise.all([
        jobDependencyService.getDependencyStatistics(true).catch(() => null),
        jobDependencyService
          .listJobDependencies({
            limit: 1000,
            skipCache: true,
            activeOnly: false,
          })
          .catch(() => ({ data: [] })),
        jobDependencyService.getMostDependedOnJobs(10, true).catch(() => ({
          data: [],
        })),
        jobDependencyService.getOrphanedJobs(true).catch(() => ({ data: [] })),
        jobDependencyService.getDependencyGraph(true).catch(() => ({
          data: [],
        })),
      ]);

      // Set statistics
      if (statsResponse?.success && statsResponse.data) {
        setStatistics(statsResponse.data);
      }

      // Process dependency type distribution
      const allDeps = allDepsResponse.data || [];
      const typeCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      const activeInactiveCounts = { Active: 0, Inactive: 0 };

      allDeps.forEach((dep: any) => {
        // Count by dependency type
        const type = dep.dependency_type || "unknown";
        typeCounts[type] = (typeCounts[type] || 0) + 1;

        // Count by wait_for_status
        const status = dep.wait_for_status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;

        // Count active/inactive
        if (dep.is_active) {
          activeInactiveCounts.Active++;
        } else {
          activeInactiveCounts.Inactive++;
        }
      });

      setDependencyTypeDistribution(
        Object.entries(typeCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      setWaitForStatusDistribution(
        Object.entries(statusCounts).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      setActiveInactiveDistribution(
        Object.entries(activeInactiveCounts).map(([name, value]) => ({
          name,
          value,
        }))
      );

      // Set most depended jobs
      if (mostDependedResponse?.success && mostDependedResponse.data) {
        setMostDependedJobs(mostDependedResponse.data);
      }

      // Set orphaned jobs
      if (orphanedResponse?.success && orphanedResponse.data) {
        setOrphanedJobs(orphanedResponse.data);
      }

      // Set dependency graph
      if (graphResponse?.success && graphResponse.data) {
        setDependencyGraph(graphResponse.data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      showError(
        "Analytics",
        err instanceof Error ? err.message : "Failed to load analytics data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/job-dependencies")}
          className="p-2 text-gray-600 hover:text-gray-800 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Job Dependencies Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Visual insights into job dependency relationships and patterns
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          {/* Statistics Summary */}
          {statistics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total Dependencies
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.total_dependencies || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Active Dependencies
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.active_dependencies || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Jobs with Dependencies
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.jobs_with_dependencies || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <XCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Inactive Dependencies
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.inactive_dependencies || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Jobs Depended On
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.jobs_depended_on || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Blocking Count
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.blocking_count || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Optional Count
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.optional_count || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Conditional Count
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.conditional_count || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Cross Day Count
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.cross_day_count || 0}
                </p>
              </div>
              <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Link2
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Avg Max Wait (min)
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {statistics.avg_max_wait_minutes
                    ? parseFloat(statistics.avg_max_wait_minutes).toFixed(0)
                    : "0"}
                </p>
              </div>
              {/* Dependency Graph Summary Stat Cards */}
              {dependencyGraph.length > 0 && (
                <>
                  <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Link2
                        className="h-5 w-5"
                        style={{ color: color.primary.accent }}
                      />
                      <p className="text-sm font-medium text-gray-600">
                        Total Jobs in Graph
                      </p>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {dependencyGraph.length}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Link2
                        className="h-5 w-5"
                        style={{ color: color.primary.accent }}
                      />
                      <p className="text-sm font-medium text-gray-600">
                        Jobs with Dependencies
                      </p>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {
                        dependencyGraph.filter(
                          (node) => node.dependencies?.length > 0
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Link2
                        className="h-5 w-5"
                        style={{ color: color.primary.accent }}
                      />
                      <p className="text-sm font-medium text-gray-600">
                        Jobs with Dependents
                      </p>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {
                        dependencyGraph.filter(
                          (node) => node.dependents?.length > 0
                        ).length
                      }
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Link2
                        className="h-5 w-5"
                        style={{ color: color.primary.accent }}
                      />
                      <p className="text-sm font-medium text-gray-600">
                        Avg Dependencies per Job
                      </p>
                    </div>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {dependencyGraph.length > 0
                        ? (
                            dependencyGraph.reduce(
                              (sum, node) =>
                                sum + (node.dependencies?.length || 0),
                              0
                            ) / dependencyGraph.length
                          ).toFixed(1)
                        : "0"}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Pie Charts - Three on same line */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Dependency Type Distribution */}
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Dependency Type Distribution
              </h3>
              {dependencyTypeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dependencyTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dependencyTypeDistribution.map((entry, index) => {
                        const chartColors = getChartColors();
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={chartColors[index % chartColors.length]}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Wait For Status Distribution */}
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Wait For Status Distribution
              </h3>
              {waitForStatusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={waitForStatusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {waitForStatusDistribution.map((entry, index) => {
                        const chartColors = getChartColors();
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={chartColors[index % chartColors.length]}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </div>

            {/* Active/Inactive Distribution */}
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Active vs Inactive Dependencies
              </h3>
              {activeInactiveDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={activeInactiveDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {activeInactiveDistribution.map((entry, index) => {
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              index === 0
                                ? color.primary.accent || "#00BBCC"
                                : color.tertiary?.tag4 || "#15803d"
                            }
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Most Depended On Jobs - Own Row */}
          <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Most Depended-On Jobs (Top 10)
            </h3>
            {mostDependedJobs.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mostDependedJobs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="code" tickFormatter={(value) => value} />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload as any;
                      return (
                        <div className="rounded-md border border-gray-200 bg-white p-3 shadow-lg">
                          <p className="mb-2 text-sm font-semibold text-gray-900">
                            {data.name}
                          </p>
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>Code: {data.code}</p>
                            <p>Job ID: {data.id}</p>
                            <p>Dependent Jobs: {data.dependent_job_count}</p>
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ fill: "transparent" }}
                  />
                  <Bar dataKey="dependent_job_count">
                    {mostDependedJobs.map((entry, index) => {
                      const chartColors = getChartColors();
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            chartColors[index % chartColors.length] ||
                            color.charts?.campaigns?.primary ||
                            "#C38BFB"
                          }
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No data available
              </div>
            )}
          </div>

          {/* Orphaned Jobs Table */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Orphaned Jobs (No Dependencies)
            </h3>
            {orphanedJobs.length > 0 ? (
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
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
                        Job ID
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
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
                        Code
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Status
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Active
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orphanedJobs.map((job) => (
                      <tr key={job.id} className="transition-colors">
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopLeftRadius: "0.375rem",
                            borderBottomLeftRadius: "0.375rem",
                          }}
                        >
                          <button
                            onClick={() => {
                              navigate(`/dashboard/scheduled-jobs/${job.id}`);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            style={{
                              color: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {job.id}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <button
                            onClick={() => {
                              navigate(`/dashboard/scheduled-jobs/${job.id}`);
                            }}
                            className="text-sm font-semibold text-gray-900 hover:underline transition-colors"
                            style={{
                              color: "inherit",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color =
                                color.primary.accent;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = "";
                            }}
                          >
                            {job.name}
                          </button>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900">
                            {job.code}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span className="text-sm text-gray-900 capitalize">
                            {job.status}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{
                            backgroundColor: color.surface.tablebodybg,
                            borderTopRightRadius: "0.375rem",
                            borderBottomRightRadius: "0.375rem",
                          }}
                        >
                          <span className="text-sm text-black capitalize">
                            {job.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No orphaned jobs found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
