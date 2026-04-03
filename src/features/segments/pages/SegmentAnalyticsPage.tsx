import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
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
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { segmentService } from "../services/segmentService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { colors } from "../../../shared/utils/tokens";

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number | string;
  }>;
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
    <div className={`${tw.rounded} p-3 shadow-lg`} style={{ backgroundColor: "transparent", border: "none" }}>
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
                  color.charts.segments?.primary ||
                  color.primary.accent,
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

export default function SegmentAnalyticsPage(): JSX.Element {
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [healthSummary, setHealthSummary] = useState<Record<string, any> | null>(
    null,
  );
  const [creationTrend, setCreationTrend] = useState<
    Array<{ name: string; count: number; static_count: number; dynamic_count: number }>
  >([]);
  const [typeDistribution, setTypeDistribution] = useState<
    Array<{ name: string; value: number }>
  >([]);
  const [categoryDistribution, setCategoryDistribution] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [largestSegments, setLargestSegments] = useState<
    Array<{ name: string; size: number }>
  >([]);
  const [staleSegments, setStaleSegments] = useState<
    Array<{ id: number; name: string; days_since: number }>
  >([]);
  const [mostUsedSegments, setMostUsedSegments] = useState<
    Array<{ name: string; usage_count: number }>
  >([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        healthRes,
        trendRes,
        typeRes,
        categoryRes,
        largestRes,
        staleRes,
        mostUsedRes,
      ] = await Promise.all([
        segmentService.getHealthSummary(),
        segmentService.getCreationTrend(), // No parameters - endpoint only accepts skipCache
        segmentService.getTypeDistribution(),
        segmentService.getCategoryDistribution(true),
        segmentService.getLargestSegments(10),
        segmentService.getStaleSegments(),
        segmentService.getMostUsedSegments(10),
      ]);

      // Set health summary - returns {total_segments, active_count, stale_segments, empty_segments, recently_refreshed}
      if (healthRes.success && healthRes.data) {
        setHealthSummary(healthRes.data);
      }

      // Process creation trend - returns array of {date, segments_created, static_count, dynamic_count}
      if (trendRes.success && trendRes.data) {
        const trend = Array.isArray(trendRes.data)
          ? trendRes.data
          : [trendRes.data];
        setCreationTrend(
          trend.map((item: any) => ({
            name: item.date ? new Date(item.date).toLocaleDateString() : "Unknown",
            count: Number(item.segments_created) || 0,
            static_count: Number(item.static_count) || 0,
            dynamic_count: Number(item.dynamic_count) || 0,
          })),
        );
      }

      // Process type distribution - returns [{type, count}, ...]
      if (typeRes.success && typeRes.data) {
        const types = Array.isArray(typeRes.data) ? typeRes.data : [typeRes.data];
        setTypeDistribution(
          types.map((item: any) => ({
            name: item.type || item.name || "Unknown",
            value: Number(item.count) || 0,
          })),
        );
      }

      // Process category distribution - returns [{category_name, count}, ...]
      if (categoryRes.success && categoryRes.data) {
        const categories = Array.isArray(categoryRes.data)
          ? categoryRes.data
          : [categoryRes.data];
        setCategoryDistribution(
          categories.map((cat: any) => ({
            name: cat.category_name || cat.name || "Unknown",
            count: Number(cat.count) || 0,
          })),
        );
      }

      // Process largest segments - returns [{id, name, code, type, size_estimate}, ...]
      if (largestRes.success && largestRes.data) {
        const largest = Array.isArray(largestRes.data)
          ? largestRes.data
          : [largestRes.data];
        setLargestSegments(
          largest.map((seg: any) => ({
            name: seg.name || "Unknown",
            size: Number(seg.size_estimate) || 0,
          })),
        );
      }

      // Process stale segments - returns array of full segment objects
      if (staleRes.success && staleRes.data) {
        const stale = Array.isArray(staleRes.data)
          ? staleRes.data
          : [staleRes.data];
        // Calculate days since last computed from last_computed_at
        const now = new Date();
        setStaleSegments(
          stale.map((seg: any) => {
            const lastComputed = seg.last_computed_at
              ? new Date(seg.last_computed_at)
              : new Date(0);
            const daysSince = Math.floor(
              (now.getTime() - lastComputed.getTime()) / (1000 * 60 * 60 * 24),
            );
            return {
              id: seg.id || 0,
              name: seg.name || "Unknown",
              days_since: daysSince,
            };
          }),
        );
      }

      // Process most used segments - returns [{id, name, code, type, size_estimate, usage_count}, ...]
      if (mostUsedRes.success && mostUsedRes.data) {
        const mostUsed = Array.isArray(mostUsedRes.data)
          ? mostUsedRes.data
          : [mostUsedRes.data];
        setMostUsedSegments(
          mostUsed.map((seg: any) => ({
            name: seg.name || "Unknown",
            usage_count: Number(seg.usage_count) || 0,
          })),
        );
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      showError(
        "Analytics Error",
        "Failed to load segment analytics data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Chart colors from tokens
  const pieColors = [
    color.charts.segments?.primary || color.primary.accent,
    color.charts.segments?.secondary || color.primary.action,
    color.charts.segments?.accent || color.interactive.hover,
    color.charts.segments?.warning || "#FFA500",
    color.charts.segments?.danger || "#FF6B6B",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton fallbackTo="/dashboard/segments" showBreadcrumb={true} currentLabel="Segment Analytics" />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          {healthSummary && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Total Segments
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {parseInt(healthSummary.total_segments) || 0}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Active Segments
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {parseInt(healthSummary.active_count) || 0}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Recently Refreshed
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {parseInt(healthSummary.recently_refreshed) || 0}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <p className="text-sm font-medium text-gray-600">
                  Stale Segments
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {parseInt(healthSummary.stale_segments) || 0}
                </p>
              </div>
            </div>
          )}

          {/* Charts Row 1 */}
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Type Distribution - Pie Chart */}
            {typeDistribution.length > 0 && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="mb-4">
                  <h3 className={`font-semibold ${tw.textPrimary}`}>
                    Segment Type Distribution
                  </h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill={color.primary.accent}
                      dataKey="value"
                    >
                      {typeDistribution.map((entry, index) => {
                        // Use different color for predictive segments
                        let fill = pieColors[index % pieColors.length];
                        if (
                          entry.name &&
                          entry.name.toLowerCase().includes("predictive")
                        ) {
                          fill = color.status.danger || "#FF6B6B";
                        }
                        return (
                          <Cell key={`cell-${index}`} fill={fill} />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Distribution - Bar Chart */}
            {categoryDistribution.length > 0 && (
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="mb-4">
                  <h3 className={`font-semibold ${tw.textPrimary}`}>
                    Category Distribution
                  </h3>
                </div>
                <div className="rounded-md overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={categoryDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[8, 8, 0, 0]}
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            colors.reportCharts.palette[
                              `color${((index % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}`
                            ]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Creation Trend - Line Chart (Full Width) */}
          {creationTrend.length > 0 && (
            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="mb-4">
                <h3 className={`font-semibold ${tw.textPrimary}`}>
                  Creation Trend (Last 30 Days)
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={creationTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: "transparent", strokeWidth: 0 }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Total Segments"
                    stroke={color.primary.accent}
                    strokeWidth={2}
                    dot={{ fill: color.primary.accent, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="static_count"
                    name="Static Segments"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ fill: "#3B82F6", r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dynamic_count"
                    name="Dynamic Segments"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Largest Segments - Bar Chart */}
          {largestSegments.length > 0 && (
            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="mb-4">
                <h3 className={`font-semibold ${tw.textPrimary}`}>
                  Top 10 Largest Segments
                </h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={largestSegments}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar
                    dataKey="size"
                    fill={color.primary.accent}
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Most Used Segments - Bar Chart */}
          {mostUsedSegments.length > 0 && (
            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="mb-4">
                <h3 className={`font-semibold ${tw.textPrimary}`}>
                  Top Segments by Campaign Usage
                </h3>
              </div>
              <div className="rounded-md overflow-hidden">
                <ResponsiveContainer width="100%" height={mostUsedSegments.length * 60 + 100}>
                  <BarChart
                    data={mostUsedSegments}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={90} />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="usage_count"
                      radius={[0, 8, 8, 0]}
                      fill={color.primary.accent}
                      label={{ position: "insideBottomRight", offset: 5, fontSize: 12, fontWeight: "bold", fill: "white" }}
                    >
                      {mostUsedSegments.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            colors.reportCharts.palette[
                              `color${((index % 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6}`
                            ]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Stale Segments Table */}
          {staleSegments.length > 0 && (
            <div
              className={`${tw.rounded}  p-6 `}
            >
              <div className="mb-4">
                <h3 className={`font-semibold ${tw.textPrimary}`}>
                  Stale Segments (Not Computed Recently)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                >
                  <thead style={{ background: color.surface.tableHeader }}>
                    <tr>
                      <th
                        className="px-6 py-4 text-sm font-medium text-left"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Segment Name
                      </th>
                      <th
                        className="px-6 py-4 text-sm font-medium text-left"
                        style={{ color: color.surface.tableHeaderText }}
                      >
                        Days Since Last Computed
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {staleSegments.slice(0, 10).map((segment) => (
                      <tr key={segment.id} className="transition-colors">
                        <td
                          className="px-6 py-4 text-sm text-gray-900"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {segment.name}
                        </td>
                        <td
                          className="px-6 py-4"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <span
                            className={`inline-flex items-center px-2 py-1 ${tw.rounded} text-xs font-medium ${
                              segment.days_since > 7
                                ? "bg-red-100 text-red-800"
                                : segment.days_since > 3
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                            }`}
                          >
                            {segment.days_since} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
