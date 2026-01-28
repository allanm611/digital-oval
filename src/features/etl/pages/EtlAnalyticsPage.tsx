import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
import { etlService } from "../services/etlService";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import BackButton from "../../../shared/components/ui/BackButton";

interface StatsRow {
  file_category: string;
  processing_status: string;
  file_count: string;
  total_rows_inserted: string | null;
  total_data_size_mb: string | null;
  avg_processing_duration_ms: string | null;
  first_file_date: string;
  last_file_date: string;
}

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

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
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
                backgroundColor: entry.color || color.primary.action,
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

export default function EtlAnalyticsPage() {
  const { error: showError } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [allStats, setAllStats] = useState<StatsRow[]>([]);
  const [cdrStats, setCdrStats] = useState<StatsRow[]>([]);
  const [tdrStats, setTdrStats] = useState<StatsRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const [statsRes, cdrRes, tdrRes] = await Promise.all([
          etlService.getFileStats(),
          etlService.getCategoryFileStats("CDR"),
          etlService.getCategoryFileStats("TDR"),
        ]);

        setAllStats((statsRes?.data as StatsRow[]) || []);
        setCdrStats((cdrRes?.data as StatsRow[]) || []);
        setTdrStats((tdrRes?.data as StatsRow[]) || []);
      } catch (err) {
        showError(
          t.etl.failedToLoadStatistics,
          (err as Error).message || t.etl.pleaseRetryLater,
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [showError, t.etl]);

  // Transform data for charts and summaries
  const fileCountByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    allStats.forEach((row) => {
      const status = row.processing_status;
      map[status] = (map[status] || 0) + parseInt(row.file_count, 10);
    });

    return Object.entries(map)
      .map(([status, count]) => ({
        status,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [allStats]);

  const fileCountByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    allStats.forEach((row) => {
      const category = row.file_category;
      map[category] = (map[category] || 0) + parseInt(row.file_count, 10);
    });

    return Object.entries(map).map(([category, count]) => ({
      category,
      count,
    }));
  }, [allStats]);

  const rowsInsertedByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    allStats.forEach((row) => {
      if (row.total_rows_inserted) {
        const status = row.processing_status;
        map[status] = (map[status] || 0) + parseInt(row.total_rows_inserted, 10);
      }
    });

    return Object.entries(map)
      .map(([status, rows]) => ({
        status,
        rows,
      }))
      .sort((a, b) => b.rows - a.rows);
  }, [allStats]);

  const dataSizeByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    allStats.forEach((row) => {
      if (row.total_data_size_mb) {
        const status = row.processing_status;
        map[status] = (map[status] || 0) + parseFloat(row.total_data_size_mb);
      }
    });

    return Object.entries(map)
      .map(([status, size]) => ({
        status,
        size: parseFloat(size.toFixed(2)),
      }))
      .sort((a, b) => b.size - a.size);
  }, [allStats]);

  const totalMetrics = useMemo(() => {
    const metrics = {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      pendingFiles: 0,
      totalRows: 0,
    };

    allStats.forEach((row) => {
      const count = parseInt(row.file_count, 10);
      metrics.totalFiles += count;

      if (row.total_rows_inserted) {
        metrics.totalRows += parseInt(row.total_rows_inserted, 10);
      }

      if (row.processing_status === "completed") {
        metrics.completedFiles += count;
      } else if (row.processing_status === "failed") {
        metrics.failedFiles += count;
      } else if (row.processing_status === "pending") {
        metrics.pendingFiles += count;
      }
    });

    return metrics;
  }, [allStats]);

  const categoryComparisonData = useMemo(() => {
    const statuses = ["completed", "failed", "pending", "processing"];
    return statuses.map((status) => {
      const cdrRow = cdrStats.find((row) => row.processing_status === status);
      const tdrRow = tdrStats.find((row) => row.processing_status === status);

      return {
        status,
        CDR: parseInt(cdrRow?.file_count || "0", 10),
        TDR: parseInt(tdrRow?.file_count || "0", 10),
      };
    });
  }, [cdrStats, tdrStats]);

  const pieColors =
    color.charts?.campaigns?.pieColors || [
      "#3b8169",
      "#10b981",
      "#fbbf24",
      "#fb7184",
    ];

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <BackButton fallbackTo="/dashboard/etl" className="self-start" />
        <div className="sm:ml-2">
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            {t.etl.analytics}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            ETL file processing statistics and metrics
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <p className="text-sm font-medium text-gray-600">Total Files</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalMetrics.totalFiles.toLocaleString()}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <p className="text-sm font-medium text-gray-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalMetrics.completedFiles.toLocaleString()}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <p className="text-sm font-medium text-gray-600">Pending</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalMetrics.pendingFiles.toLocaleString()}
          </p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <p className="text-sm font-medium text-gray-600">Failed</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {totalMetrics.failedFiles.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* File Count by Status */}
        {fileCountByStatus.length > 0 && (
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              File Count by Status
            </h3>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={fileCountByStatus.map((item) => ({
                      name: item.status,
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name || ""}: ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={300}
                  >
                    {fileCountByStatus.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ fontSize: "12px", color: "#000000" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* File Count by Category */}
        {fileCountByCategory.length > 0 && (
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              File Count by Category
            </h3>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={fileCountByCategory.map((item) => ({
                      name: item.category,
                      value: item.count,
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(props: { name?: string; percent?: number }) =>
                      `${props.name || ""}: ${((props.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={true}
                    animationDuration={300}
                  >
                    {fileCountByCategory.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "transparent" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span style={{ fontSize: "12px", color: "#000000" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bar Charts */}
      {rowsInsertedByStatus.length > 0 && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Total Rows Inserted by Status
          </h3>
          <div className="h-96 w-full min-h-[384px]">
            <ResponsiveContainer width="100%" height={384}>
              <BarChart
                data={rowsInsertedByStatus.map((item) => ({
                  name: item.status,
                  rows: item.rows,
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
                  dataKey="rows"
                  fill={pieColors[0]}
                  radius={[4, 4, 0, 0]}
                  name="Rows Inserted"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {dataSizeByStatus.length > 0 && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Total Data Size by Status (MB)
          </h3>
          <div className="h-96 w-full min-h-[384px]">
            <ResponsiveContainer width="100%" height={384}>
              <BarChart
                data={dataSizeByStatus.map((item) => ({
                  name: item.status,
                  size: item.size,
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
                  formatter={(value) => `${Number(value).toFixed(2)} MB`}
                />
                <Bar
                  dataKey="size"
                  fill={pieColors[1]}
                  radius={[4, 4, 0, 0]}
                  name="Size (MB)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Category Comparison - Grouped Bar Chart */}
      {categoryComparisonData.some((item) => item.CDR > 0 || item.TDR > 0) && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            File Count by Status - CDR vs TDR
          </h3>
          <div className="h-96 w-full min-h-[384px]">
            <ResponsiveContainer width="100%" height={384}>
              <BarChart
                data={categoryComparisonData}
                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="status"
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
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "#000000" }}>
                      {value}
                    </span>
                  )}
                />
                <Bar
                  dataKey="CDR"
                  fill={pieColors[0]}
                  radius={[4, 4, 0, 0]}
                  name="CDR"
                />
                <Bar
                  dataKey="TDR"
                  fill={pieColors[1]}
                  radius={[4, 4, 0, 0]}
                  name="TDR"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
