import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";
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
import { workflowService } from "../services/workflowService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

type ChartTooltipEntry = {
  name?: string;
  value?: number | string;
  color?: string;
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

const COLORS = [
  "#3b8169",
  "#ef4444",
  "#f59e0b",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

export default function WorkflowsAnalyticsPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [totalWorkflows, setTotalWorkflows] = useState<number>(0);
  const [statusCounts, setStatusCounts] = useState<{
    pending_activation?: number;
    active?: number;
    suspended?: number;
    locked?: number;
    deactivated?: number;
    deleted?: number;
    total?: number;
    inactive?: number;
  } | null>(null);
  const [countByType, setCountByType] = useState<
    Array<{ workflow_type: string | null; count: number }>
  >([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusResponse, typeResponse, totalResponse] = await Promise.all([
        workflowService.getStatusCounts(true).catch(() => ({
          success: true,
          data: { active: 0, inactive: 0, total: 0 },
        })),
        workflowService.getCountByType().catch(() => ({
          success: true,
          data: [],
        })),
      ]);

      setStatusCounts(statusResponse.data || null);
      setCountByType(typeResponse.data || []);
      // Use total from status counts instead of fetching all workflows
      const totalWorkflows = (statusResponse.data?.total as number) || 0;
      setTotalWorkflows(totalWorkflows);
    } catch (err) {
      showError(
        t.common.error,
        err instanceof Error ? err.message : t.analytics.failedToLoadAnalytics
      );
    } finally {
      setIsLoading(false);
    }
  }, [showError, t]);

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

  const statusChartData =
    statusCounts && Object.keys(statusCounts).length > 0
      ? [
          {
            name: "Pending Activation",
            value: statusCounts.pending_activation || 0,
          },
          { name: "Active", value: statusCounts.active || 0 },
          { name: "Suspended", value: statusCounts.suspended || 0 },
          { name: "Locked", value: statusCounts.locked || 0 },
          { name: "Deactivated", value: statusCounts.deactivated || 0 },
          { name: "Deleted", value: statusCounts.deleted || 0 },
        ]
      : [];

  const typeChartData = countByType.map((item) => ({
    name: item.workflow_type || "No Type",
    value: item.count,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={() => navigate("/dashboard/workflows")}
          className={`${tw.rounded} p-2 text-gray-600 hover:text-gray-800 transition-colors`}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            {t.analytics.workflowsAnalytics}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.analytics.performanceMetrics}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statusCounts && (
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2">
                <BarChart3
                  className="h-5 w-5"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">
                  {t.analytics.totalWorkflows}
                </p>
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {totalWorkflows}
              </p>
            </div>
            {[
              {
                label: "Pending Activation",
                value: statusCounts.pending_activation || 0,
              },
              { label: "Active", value: statusCounts.active || 0 },
              { label: "Suspended", value: statusCounts.suspended || 0 },
            ].map((card) => (
              <div
                key={card.label}
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Locked", value: statusCounts.locked || 0 },
              { label: "Deactivated", value: statusCounts.deactivated || 0 },
              { label: "Deleted", value: statusCounts.deleted || 0 },
            ].map((card) => (
              <div
                key={card.label}
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    {card.label}
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {card.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {statusChartData.length > 0 && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t.analytics.statusDistribution}
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((_entry, index) => (
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
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Count by Type */}
      {typeChartData.length > 0 && (
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t.analytics.countByType}
          </h2>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "transparent" }}
              />
              <Legend />
              <Bar dataKey="value" fill="#3b8169" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
