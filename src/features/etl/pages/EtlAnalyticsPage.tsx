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
  LineChart,
  Line,
} from "recharts";
import {
  FileText,
  CheckCircle,
} from "lucide-react";
import { etlService } from "../services/etlService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
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
    <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-3 shadow-lg`}>
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

  // Group A: Existing stats
  const [allStats, setAllStats] = useState<StatsRow[]>([]);
  const [cdrStats, setCdrStats] = useState<StatsRow[]>([]);
  const [tdrStats, setTdrStats] = useState<StatsRow[]>([]);

  // Group B: File Registry Monitoring (NEW)
  const [registryStats, setRegistryStats] = useState<any>(null);
  const [rowMetrics, setRowMetrics] = useState<any>(null);
  const [retryAnalysis, setRetryAnalysis] = useState<any>(null);
  const [fetchDurationAnalytics, setFetchDurationAnalytics] = useState<any>(null);
  const [processingDurationAnalytics, setProcessingDurationAnalytics] = useState<any>(null);
  const [processingStatusDist, setProcessingStatusDist] = useState<any>(null);
  const [formatDist, setFormatDist] = useState<any>(null);
  const [checksumUsage, setChecksumUsage] = useState<any>(null);
  const [dataSizeAnalytics, setDataSizeAnalytics] = useState<any>(null);
  const [fileRegistryTrends, setFileRegistryTrends] = useState<any>(null);
  const [errorMessages, setErrorMessages] = useState<any[]>([]);
  const [fileRegistryGranularity, setFileRegistryGranularity] = useState<"day" | "week" | "month">("day");
  const [isTrendsLoading, setIsTrendsLoading] = useState(false);

  // Group C: Task Queue Monitoring (NEW)
  const [taskQueueStats, setTaskQueueStats] = useState<any>(null);
  const [taskStatusDist, setTaskStatusDist] = useState<any>(null);
  const [taskTypeDist, setTaskTypeDist] = useState<any>(null);
  const [taskPriorityDist, setTaskPriorityDist] = useState<any>(null);
  const [taskDurationAnalytics, setTaskDurationAnalytics] = useState<any>(null);
  const [taskFileCorrelation, setTaskFileCorrelation] = useState<any>(null);
  const [taskJobCorrelation, setTaskJobCorrelation] = useState<any>(null);
  const [taskQueueTrends, setTaskQueueTrends] = useState<any>(null);
  const [taskQueueGranularity, setTaskQueueGranularity] = useState<"day" | "week" | "month">("day");

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        // Load existing data
        const [statsRes, cdrRes, tdrRes] = await Promise.all([
          etlService.getFileStats(),
          etlService.getCategoryFileStats("CDR"),
          etlService.getCategoryFileStats("TDR"),
        ]);

        setAllStats((statsRes?.data as StatsRow[]) || []);
        setCdrStats((cdrRes?.data as StatsRow[]) || []);
        setTdrStats((tdrRes?.data as StatsRow[]) || []);

        // Load new monitoring data in background
        try {
          const [
            registryStatsRes, rowMetricsRes, retryAnalysisRes, fetchDurationRes, processingDurationRes, processingStatusRes, formatRes,
            checksumRes, dataSizeRes, errorMessagesRes, fileRegistryTrendsRes,
            taskStatsRes, taskStatusRes, taskTypeRes, taskPriorityRes, taskDurationRes, taskFileRes, taskJobRes, taskTrendsRes
          ] = await Promise.all([
            // File Registry
            etlService.getFileRegistryStatistics(),
            etlService.getFileRegistryRowMetrics(),
            etlService.getFileRegistryRetryAnalysis(),
            etlService.getFileRegistryFetchDurationAnalytics(),
            etlService.getFileRegistryProcessingDurationAnalytics(),
            etlService.getFileRegistryProcessingStatus(),
            etlService.getFileRegistryFormatDistribution(),
            etlService.getFileRegistryChecksumUsage(),
            etlService.getFileRegistryDataSizeAnalytics(),
            etlService.getFileRegistryErrorMessageDistribution({ offset: 0, limit: 10 }),
            etlService.getFileRegistryTrends({ granularity: fileRegistryGranularity }),
            // Task Queue
            etlService.getTaskQueueStatistics(),
            etlService.getTaskQueueStatusDistribution(),
            etlService.getTaskQueueTypeDistribution(),
            etlService.getTaskQueuePriorityDistribution(),
            etlService.getTaskQueueDurationAnalytics(),
            etlService.getTaskQueueFileCorrelation(),
            etlService.getTaskQueueJobCorrelation(),
            etlService.getTaskQueueTrends({ granularity: taskQueueGranularity }),
          ]);

          setRegistryStats(registryStatsRes?.data || null);
          setRowMetrics(rowMetricsRes?.data || null);
          setRetryAnalysis(retryAnalysisRes?.data || null);
          setFetchDurationAnalytics(fetchDurationRes?.data || null);
          setProcessingDurationAnalytics(processingDurationRes?.data || null);
          setProcessingStatusDist(processingStatusRes?.data || null);
          setFormatDist(formatRes?.data || null);
          setChecksumUsage(checksumRes?.data || null);
          setDataSizeAnalytics(dataSizeRes?.data || null);
          setErrorMessages(errorMessagesRes?.data?.error_messages || []);
          setFileRegistryTrends(fileRegistryTrendsRes?.data || null);

          setTaskQueueStats(taskStatsRes?.data || null);
          setTaskStatusDist(taskStatusRes?.data || null);
          setTaskTypeDist(taskTypeRes?.data || null);
          setTaskPriorityDist(taskPriorityRes?.data || null);
          setTaskDurationAnalytics(taskDurationRes?.data || null);
          setTaskFileCorrelation(taskFileRes?.data || null);
          setTaskJobCorrelation(taskJobRes?.data || null);
          setTaskQueueTrends(taskTrendsRes?.data || null);
        } catch (err) {
          console.error("Failed to load new monitoring data:", err);
        }
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

  // Helper functions for granularity changes
  const handleFileRegistryGranularityChange = async (gran: "day" | "week" | "month") => {
    setFileRegistryGranularity(gran);
    setIsTrendsLoading(true);
    try {
      const res = await etlService.getFileRegistryTrends({ granularity: gran });
      setFileRegistryTrends(res?.data || null);
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setIsTrendsLoading(false);
    }
  };

  const handleTaskQueueGranularityChange = async (gran: "day" | "week" | "month") => {
    setTaskQueueGranularity(gran);
    setIsTrendsLoading(true);
    try {
      const res = await etlService.getTaskQueueTrends({ granularity: gran });
      setTaskQueueTrends(res?.data || null);
    } catch (err) {
      console.error("Failed to load trends:", err);
    } finally {
      setIsTrendsLoading(false);
    }
  };

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
    <div className="">
      {/* Header */}
      <BackButton showBreadcrumb={true} currentLabel="ETL Analytics" />

      {/* Summary Cards */}
      {(() => {
        const cdrMetrics = {
          total: 0,
          completed: 0,
        };
        const tdrMetrics = {
          total: 0,
          completed: 0,
        };

        allStats.forEach((row) => {
          const count = parseInt(row.file_count, 10);
          if (row.file_category === "CDR") {
            cdrMetrics.total += count;
            if (row.processing_status === "completed") {
              cdrMetrics.completed += count;
            }
          } else if (row.file_category === "TDR") {
            tdrMetrics.total += count;
            if (row.processing_status === "completed") {
              tdrMetrics.completed += count;
            }
          }
        });

        return (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <div className="flex items-center gap-2">
                <FileText
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-sm">Total CDR Files</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {cdrMetrics.total.toLocaleString()}
              </p>
            </div>
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <div className="flex items-center gap-2">
                <FileText
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-sm">Total TDR Files</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {tdrMetrics.total.toLocaleString()}
              </p>
            </div>
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <div className="flex items-center gap-2">
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-sm">Completed CDR</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {cdrMetrics.completed.toLocaleString()}
              </p>
            </div>
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <div className="flex items-center gap-2">
                <CheckCircle
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-sm">Completed TDR</p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {tdrMetrics.completed.toLocaleString()}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Pie Charts */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* File Count by Status */}
        {fileCountByStatus.length > 0 && (
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
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
                      <span style={{ fontSize: "12px", color: "var(--c-text-secondary)" }}>
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
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
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
                      <span style={{ fontSize: "12px", color: "var(--c-text-secondary)" }}>
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
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
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
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
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
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
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
                    <span style={{ fontSize: "12px", color: "var(--c-text-secondary)" }}>
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

      {/* NEW SECTION: Overview Stats Row 1 - File Registry */}
      {registryStats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-sm">Total Files</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {registryStats.total_files?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-sm">Active Files</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {registryStats.active_files?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-sm">Failed Files</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {registryStats.failed_files?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" style={{ color: color.primary.accent }} />
              <p className="text-sm font-medium text-sm">Skipped Files</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {registryStats.skipped_files?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      {/* NEW SECTION: Overview Stats Row 2 - Row Metrics & Retry */}
      {(rowMetrics || retryAnalysis) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Total Rows Parsed</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {rowMetrics?.total_rows_parsed?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Total Rows Inserted</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {rowMetrics?.total_rows_inserted?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Total Rows Failed</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {rowMetrics?.total_rows_failed?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Avg Retry Count</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {registryStats?.average_retry_count?.toFixed(2) || 0}
            </p>
          </div>
        </div>
      )}

      {/* NEW SECTION: Performance Metrics (2-col grid) */}
      {(fetchDurationAnalytics || processingDurationAnalytics) && (
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Fetch Analytics</h3>
            <div className="space-y-4">
              <div className="pb-4 border-b" style={{ borderColor: 'var(--c-border-default)' }}>
                <p className="text-sm font-medium text-sm">Avg Fetch Duration</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {fetchDurationAnalytics?.average_fetch_duration_ms?.toLocaleString() || 0}
                  <span className="text-sm font-medium text-sm ml-1">ms</span>
                </p>
              </div>
              <div className="pb-4 border-b" style={{ borderColor: 'var(--c-border-default)' }}>
                <p className="text-sm font-medium text-sm">Avg Fetch Attempts</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {fetchDurationAnalytics?.average_fetch_attempts?.toFixed(2) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-sm">Files with Fetch Errors</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {fetchDurationAnalytics?.files_with_fetch_errors?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </div>

          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Processing Analytics</h3>
            <div className="space-y-4">
              <div className="pb-4 border-b" style={{ borderColor: 'var(--c-border-default)' }}>
                <p className="text-sm font-medium text-sm">Avg Processing Duration</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {processingDurationAnalytics?.average_processing_duration_ms?.toLocaleString() || 0}
                  <span className="text-sm font-medium text-sm ml-1">ms</span>
                </p>
              </div>
              <div className="pb-4 border-b" style={{ borderColor: 'var(--c-border-default)' }}>
                <p className="text-sm font-medium text-sm">Avg Total Batches</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {processingDurationAnalytics?.average_total_batches?.toFixed(2) || 0}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-sm">Avg Processed Batches</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {processingDurationAnalytics?.average_processed_batches?.toFixed(2) || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW SECTION: Data Quality Section */}
      {(checksumUsage || rowMetrics) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Files with Checksum</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {checksumUsage?.files_with_checksum?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Unique Checksums</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {checksumUsage?.unique_checksums?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Duplicate Files</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {checksumUsage?.duplicate_files?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Insertion Rate (%)</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {rowMetrics?.insertion_rate?.toFixed(2) || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Failure Rate (%)</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {rowMetrics?.failure_rate?.toFixed(2) || 0}
            </p>
          </div>
        </div>
      )}

      {/* NEW SECTION: Reliability Section - Retry Analysis */}
      {retryAnalysis && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Files with Retries</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {retryAnalysis.files_with_retries?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Avg Retry Count</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {retryAnalysis.average_retry_count?.toFixed(2) || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Max Retry Count</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {retryAnalysis.max_retry_count?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Recent Retries (7d)</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {retryAnalysis.recent_retries_last_7_days?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      {/* NEW SECTION: Data Size Analytics */}
      {dataSizeAnalytics && (
        <>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <p className="text-sm font-medium text-sm">Total Data Size (MB)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {dataSizeAnalytics.total_data_size_mb?.toFixed(2) || 0}
              </p>
            </div>
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <p className="text-sm font-medium text-sm">Avg Data Size (MB)</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {dataSizeAnalytics.average_data_size_mb?.toFixed(2) || 0}
              </p>
            </div>
          </div>

          {dataSizeAnalytics.size_distribution && dataSizeAnalytics.size_distribution.length > 0 && (
            <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Size Distribution (MB)</h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={dataSizeAnalytics.size_distribution.map((item: any) => ({
                      range: item.range,
                      count: item.count,
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                    <Bar
                      dataKey="count"
                      fill={color.charts?.campaigns?.primary || "#3b82f6"}
                      radius={[4, 4, 0, 0]}
                      name="File Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* NEW SECTION: File Registry Trends */}
      {fileRegistryTrends?.trends && fileRegistryTrends.trends.length > 0 && (
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">File Registry Trends</h3>
            <div className="flex gap-2">
              {["day", "week", "month"].map((gran) => (
                <button
                  key={gran}
                  onClick={() => handleFileRegistryGranularityChange(gran as "day" | "week" | "month")}
                  className={`px-3 py-1 text-sm font-medium rounded ${
                    fileRegistryGranularity === gran
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-sm hover:bg-gray-200"
                  }`}
                >
                  {gran.charAt(0).toUpperCase() + gran.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-96 w-full min-h-[384px]">
            <ResponsiveContainer width="100%" height={384}>
              <LineChart data={fileRegistryTrends.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="files_created" stroke={color.charts?.campaigns?.primary || "#3b82f6"} strokeWidth={2} name="Files Created" />
                <Line type="monotone" dataKey="files_fetched" stroke={color.charts?.campaigns?.secondary || "#10b981"} strokeWidth={2} name="Files Fetched" />
                <Line type="monotone" dataKey="files_processed" stroke={color.charts?.campaigns?.accent || "#f59e0b"} strokeWidth={2} name="Files Processed" />
                <Line type="monotone" dataKey="rows_inserted" stroke={color.primary?.accent || "#8b5cf6"} strokeWidth={2} name="Rows Inserted" />
                <Line type="monotone" dataKey="failures" stroke="#ef4444" strokeWidth={2} name="Failures" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* NEW SECTION: Error Message Distribution Table */}
      {errorMessages.length > 0 && (
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Message Distribution</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50" style={{ borderColor: 'var(--c-border-default)' }}>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Error Message</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-900">Count</th>
                </tr>
              </thead>
              <tbody>
                {errorMessages.map((item, idx) => (
                  <tr key={idx} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`} style={{ borderColor: 'var(--c-border-default)' }}>
                    <td className="px-4 py-3 text-gray-900">{item.error_message || "-"}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">{item.count?.toLocaleString() || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW SECTION: Task Queue Stats */}
      {taskQueueStats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Total Tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {taskQueueStats.total_tasks?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Pending Tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {taskQueueStats.pending_tasks?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Completed Tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {taskQueueStats.completed_tasks?.toLocaleString() || 0}
            </p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Failed Tasks</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {taskQueueStats.failed_tasks?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      )}

      {/* NEW SECTION: Task Queue Charts (2-col + 1 full-width) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Task Status Distribution */}
        {taskStatusDist?.statuses && taskStatusDist.statuses.length > 0 && (
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie data={taskStatusDist.statuses.map((item: any) => ({ name: item.status, value: item.count }))} cx="50%" cy="50%" labelLine={false} label={(props: { name?: string; percent?: number }) => `${props.name || ""}: ${((props.percent || 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {taskStatusDist.statuses.map((_entry: any, index: number) => {
                      const pieColors = color.charts?.campaigns?.pieColors || ["#3b8169", "#10b981", "#fbbf24", "#fb7184"];
                      return <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Task Type Distribution */}
        {taskTypeDist?.task_types && taskTypeDist.task_types.length > 0 && (
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Type Distribution</h3>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie data={taskTypeDist.task_types.map((item: any) => ({ name: item.task_type, value: item.count }))} cx="50%" cy="50%" labelLine={false} label={(props: { name?: string; percent?: number }) => `${props.name || ""}: ${((props.percent || 0) * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {taskTypeDist.task_types.map((_entry: any, index: number) => {
                      const pieColors = color.charts?.campaigns?.pieColors || ["#3b8169", "#10b981", "#fbbf24", "#fb7184"];
                      return <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />;
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Task Priority Distribution - Full Width */}
      {taskPriorityDist?.priorities && taskPriorityDist.priorities.length > 0 && (
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Distribution</h3>
          <div className="h-96 w-full min-h-[384px]">
            <ResponsiveContainer width="100%" height={384}>
              <BarChart data={taskPriorityDist.priorities.map((item: any) => ({ priority: `P${item.priority}`, count: item.count }))} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Bar dataKey="count" fill={color.charts?.campaigns?.secondary || "#10b981"} radius={[4, 4, 0, 0]} name="Task Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* NEW SECTION: Task Queue Performance (3 metric cards) */}
      {(taskDurationAnalytics || taskFileCorrelation || taskJobCorrelation) && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Avg Task Duration</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{taskDurationAnalytics?.average_duration_seconds?.toFixed(2) || 0}<span className="text-sm font-medium text-sm ml-1">sec</span></p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Tasks per File</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{taskFileCorrelation?.average_tasks_per_file?.toFixed(2) || 0}</p>
          </div>
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <p className="text-sm font-medium text-sm">Tasks per Job</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{taskJobCorrelation?.average_tasks_per_job?.toFixed(2) || 0}</p>
          </div>
        </div>
      )}

      {/* NEW SECTION: Task Queue Trends */}
      {taskQueueTrends?.trends && taskQueueTrends.trends.length > 0 && (
        <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Task Queue Trends</h3>
            <div className="flex gap-2">
              {["day", "week", "month"].map((gran) => (
                <button key={gran} onClick={() => handleTaskQueueGranularityChange(gran as "day" | "week" | "month")} className={`px-3 py-1 text-sm font-medium rounded ${taskQueueGranularity === gran ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-sm hover:bg-gray-200"}`}>
                  {gran.charAt(0).toUpperCase() + gran.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-96 w-full min-h-[384px]">
            <ResponsiveContainer width="100%" height={384}>
              <LineChart data={taskQueueTrends.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => value.toLocaleString()} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Legend verticalAlign="top" height={36} />
                <Line type="monotone" dataKey="tasks_created" stroke={color.charts?.campaigns?.primary || "#3b82f6"} strokeWidth={2} name="Tasks Created" />
                <Line type="monotone" dataKey="tasks_completed" stroke={color.charts?.campaigns?.secondary || "#10b981"} strokeWidth={2} name="Tasks Completed" />
                <Line type="monotone" dataKey="failures" stroke="#ef4444" strokeWidth={2} name="Failures" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Processing Status & Format Distribution (File Registry) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Processing Status Distribution */}
        {processingStatusDist?.statuses && processingStatusDist.statuses.length > 0 && (
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Status Distribution</h3>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={processingStatusDist.statuses.map((item: any) => ({
                      name: item.processing_status,
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
                  >
                    {processingStatusDist.statuses.map((_entry: any, index: number) => {
                      const pieColors =
                        color.charts?.campaigns?.pieColors || [
                          "#3b8169",
                          "#10b981",
                          "#fbbf24",
                          "#fb7184",
                        ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* File Format Distribution */}
        {formatDist?.formats && formatDist.formats.length > 0 && (
          <div className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">File Format Distribution</h3>
            <div className="h-64 w-full min-h-[256px]">
              <ResponsiveContainer width="100%" height={256}>
                <PieChart>
                  <Pie
                    data={formatDist.formats.map((item: any) => ({
                      name: item.file_format,
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
                  >
                    {formatDist.formats.map((_entry: any, index: number) => {
                      const pieColors =
                        color.charts?.campaigns?.pieColors || [
                          "#3b8169",
                          "#10b981",
                          "#fbbf24",
                          "#fb7184",
                        ];
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={pieColors[index % pieColors.length]}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
