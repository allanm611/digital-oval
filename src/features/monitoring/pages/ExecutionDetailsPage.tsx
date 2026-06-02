import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TrendingUp, CheckCircle, AlertTriangle, Clock, Activity, User } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";
import { executionService, Execution } from "../services/executionService";
import { formatDateWithTimezone } from "../../../shared/services/dateService";
import { getSettingsTimezoneOffset } from "../../../shared/utils/settingsHelper";

export default function ExecutionDetailsPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [execution, setExecution] = useState<Execution | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExecution();
  }, [id]);

  const loadExecution = async () => {
    try {
      setIsLoading(true);
      if (id) {
        const data = await executionService.getExecutionById(parseInt(id));
        setExecution(data || null);
      }
    } catch (err) {
      console.error("Failed to load execution:", err);
      showError("Error", "Failed to load execution details");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      campaign: "Campaign",
      broadcast: "Broadcast",
      manual_reward: "Manual Reward",
      scheduled_job: "Scheduled Job",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      running: "#1E382D",
      success: "#1E382D",
      completed: "#1E382D",
      failed: "#730F07",
      pending: "#F7B430",
    };
    return colors[status] || "#00BBCC";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "-";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStageTimestamp = (percentage: number) => {
    const startTime = new Date(execution.executedAt).getTime();
    const duration = (execution.duration || 0) * 1000; // convert to ms
    const stageTime = startTime + (duration * percentage / 100);
    return formatDateWithTimezone(new Date(stageTime), getSettingsTimezoneOffset(), "default", true).split(' ').slice(-2).join(' ');
  };

  const getSuccessRate = (success?: number, total?: number) => {
    if (!success || !total || total === 0) return "0%";
    return `${((success / total) * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackButton
         
          showBreadcrumb={true}
         
          currentLabel="Execution Details"
        />
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner variant="modern" size="lg" color="primary" className="mr-3" />
          <span className={`${tw.textSecondary}`}>Loading execution details...</span>
        </div>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="space-y-6">
        <BackButton
         
          showBreadcrumb={true}
         
          currentLabel="Execution Details"
        />
        <div className="text-center py-12">
          <p className={`${tw.textSecondary}`}>Execution not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackButton
       
        showBreadcrumb={true}
       
        currentLabel={execution.name}
      />

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Total Recipients</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {(execution.recipientsCount || 0).toLocaleString()}
          </p>
        </div>

        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Success</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {(execution.successCount || 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            {getSuccessRate(execution.successCount, execution.recipientsCount)} success rate
          </p>
        </div>

        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {(execution.failureCount || 0).toLocaleString()}
          </p>
        </div>

        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Duration</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">{formatDuration(execution.duration)}</p>
        </div>
      </div>

      {/* Execution Information */}
      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Execution Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="mt-2 text-sm font-medium text-black">{execution.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Type</p>
            <p className="mt-2 text-sm font-medium text-black">{getTypeLabel(execution.type)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getStatusColor(execution.status) }}
              >
                {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">Execution ID</p>
            <p className="mt-2 text-sm font-medium" style={{ color: color.primary.accent }}>
              {execution.id}
            </p>
          </div>
        </div>
      </div>

      {/* Delivery Breakdown */}
      {(execution.recipientsCount !== undefined || execution.successCount !== undefined) && (
        <div
          className={`${tw.rounded} border bg-white p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
        >
          <h3 className="text-base font-semibold text-black mb-4">Delivery Breakdown</h3>
          <div className="space-y-3">
            {execution.recipientsCount !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Recipients</span>
                <span className="text-sm font-medium text-black">
                  {execution.recipientsCount.toLocaleString()}
                </span>
              </div>
            )}
            {execution.successCount !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Delivered</span>
                <span className="text-sm font-medium text-black">
                  {execution.successCount.toLocaleString()}
                </span>
              </div>
            )}
            {execution.failureCount !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed</span>
                <span className="text-sm font-medium text-black">
                  {execution.failureCount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Audit Trail</h3>
        <div className="space-y-3">
          {execution.triggeredBy && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Triggered By</span>
              <span className="text-sm font-medium text-black">{execution.triggeredBy}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Executed At</span>
            <span className="text-sm font-medium text-black">{formatDate(execution.executedAt)}</span>
          </div>
          {execution.completedAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Completed At</span>
              <span className="text-sm font-medium text-black">{formatDate(execution.completedAt)}</span>
            </div>
          )}
          {execution.duration !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Duration</span>
              <span className="text-sm font-medium text-black">{formatDuration(execution.duration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Details */}
      {execution.status === "failed" && execution.errorMessage && (
        <div
          className={`${tw.rounded} border bg-red-50 p-6 shadow-sm`}
          style={{ borderColor: "#FCA5A5" }}
        >
          <h3 className="text-base font-semibold text-red-900 mb-4">Error Details</h3>
          <p className="text-sm text-red-800">{execution.errorMessage}</p>
        </div>
      )}

      {/* Execution Log Table */}
      <div>
        <h3 className="text-base font-semibold text-black mb-4">Execution Log</h3>
        <div className="overflow-x-auto">
          <table
            className="w-full text-sm min-w-[1000px]"
            style={{
              borderCollapse: "separate",
              borderSpacing: "0 8px",
            }}
          >
            <thead style={{ background: color.surface.tableHeader }}>
              <tr>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Timestamp
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Level
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Stage
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Message
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Duration
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Triggered By
                </th>
                <th
                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider whitespace-nowrap"
                  style={{ color: color.surface.tableHeaderText }}
                >
                  Details
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {getStageTimestamp(0)}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  INFO
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Initialization
                </td>
                <td className="px-6 py-4 text-sm text-black" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Execution started for {execution.name}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {formatDuration(execution.duration)}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Admin
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Type: {getTypeLabel(execution.type)}
                </td>
              </tr>

              <tr>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {getStageTimestamp(25)}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  INFO
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Processing
                </td>
                <td className="px-6 py-4 text-sm text-black" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Processing recipients
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {formatDuration(execution.duration)}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Admin
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {execution.recipientsCount || 0} recipients
                </td>
              </tr>

              {execution.successCount !== undefined && (
                <tr>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {getStageTimestamp(60)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    SUCCESS
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    Delivery
                  </td>
                  <td className="px-6 py-4 text-sm text-black" style={{ backgroundColor: color.surface.tablebodybg }}>
                    Delivery successful
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {formatDuration(execution.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {execution.triggeredBy || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {execution.successCount} delivered
                  </td>
                </tr>
              )}

              {execution.failureCount && execution.failureCount > 0 && (
                <tr>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {getStageTimestamp(70)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    WARN
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    Delivery
                  </td>
                  <td className="px-6 py-4 text-sm text-black" style={{ backgroundColor: color.surface.tablebodybg }}>
                    Delivery failures detected
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {formatDuration(execution.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {execution.triggeredBy || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {execution.failureCount} failed
                  </td>
                </tr>
              )}

              {execution.status === "failed" && execution.errorMessage && (
                <tr>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {getStageTimestamp(80)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    ERROR
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    Error Handling
                  </td>
                  <td className="px-6 py-4 text-sm text-black" style={{ backgroundColor: color.surface.tablebodybg }}>
                    Error occurred
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {formatDuration(execution.duration)}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {execution.triggeredBy || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                    {execution.errorMessage}
                  </td>
                </tr>
              )}

              <tr>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {getStageTimestamp(100)}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {execution.status === "success" ? "COMPLETED" : "FAILED"}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Finalization
                </td>
                <td className="px-6 py-4 text-sm text-black" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Execution {execution.status === "success" ? "completed successfully" : "failed"}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  {formatDuration(execution.duration)}
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  Admin
                </td>
                <td className="px-6 py-4 text-sm text-black whitespace-nowrap" style={{ backgroundColor: color.surface.tablebodybg }}>
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
