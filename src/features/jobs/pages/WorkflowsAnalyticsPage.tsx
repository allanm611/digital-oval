import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, BarChart3 } from "lucide-react";
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
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";

const COLORS = ["#3b8169", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function WorkflowsAnalyticsPage() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<{
    active: number;
    inactive: number;
    total: number;
  } | null>(null);
  const [countByType, setCountByType] = useState<
    Array<{ workflow_type: string | null; count: number }>
  >([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statusResponse, typeResponse] = await Promise.all([
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
    } catch (err) {
      showError(
        "Error",
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
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  const statusChartData = statusCounts
    ? [
        { name: "Active", value: statusCounts.active },
        { name: "Inactive", value: statusCounts.inactive },
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
            Workflows Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Insights and metrics for workflows
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      {statusCounts && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <BarChart3
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Total Workflows</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statusCounts.total}
            </p>
          </div>
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <TrendingUp
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Active</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statusCounts.active}
            </p>
          </div>
          <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <div className="flex items-center gap-2">
              <BarChart3
                className="h-5 w-5"
                style={{ color: color.primary.accent }}
              />
              <p className="text-sm font-medium text-gray-600">Inactive</p>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {statusCounts.inactive}
            </p>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {statusChartData.length > 0 && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Status Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusChartData.map((entry, index) => (
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

      {/* Count by Type */}
      {typeChartData.length > 0 && (
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Workflows by Type
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={typeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3b8169" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

