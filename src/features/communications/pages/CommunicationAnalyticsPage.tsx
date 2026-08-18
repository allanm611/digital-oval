import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useLanguage } from "../../../contexts/LanguageContext";
import { communicationService } from "../services/communicationService";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";

interface CommunicationExecution {
  id: number;
  execution_id: string;
  source_type: string;
  source_id: number;
  created_at?: string;
  updated_at?: string;
  status?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface CommunicationLog {
  id: string;
  execution_id: string;
  channel: string;
  status?: string;
  recipient?: string;
  sent_at?: string;
  error_message?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export default function CommunicationAnalyticsPage() {
  const { error: showError } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleBack = () => {
    navigateBackOrFallback(navigate, "/dashboard/communications");
  };

  // State
  const [executions, setExecutions] = useState<CommunicationExecution[]>([]);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  // FILTERS COMMENTED OUT - Not wanted on this page
  // const [selectedPeriod, setSelectedPeriod] = useState("7d");
  // const [selectedChannel, setSelectedChannel] = useState("all");
  // const [selectedSourceType, setSelectedSourceType] = useState("all");
  // const [selectedLogStatus, setSelectedLogStatus] = useState("all");

  // Pagination state
  const [executionsPage, setExecutionsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);
  const itemsPerPage = 20;

  // NO DUMMY DATA - Charts will be populated from real API data when available

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // No filter dependencies since filters are commented out

  //   const getDateRange = (period: string) => {
  //     const now = new Date();
  //     const endDate = now.toISOString().split("T")[0]; // YYYY-MM-DD format
  //     let startDate: string;

  //     switch (period) {
  //       case "1d": {
  //         const yesterday = new Date(now);
  //         yesterday.setDate(now.getDate() - 1);
  //         startDate = yesterday.toISOString().split("T")[0];
  //         break;
  //       }
  //       case "7d": {
  //         const weekAgo = new Date(now);
  //         weekAgo.setDate(now.getDate() - 7);
  //         startDate = weekAgo.toISOString().split("T")[0];
  //         break;
  //       }
  //       case "30d": {
  //         const monthAgo = new Date(now);
  //         monthAgo.setDate(now.getDate() - 30);
  //         startDate = monthAgo.toISOString().split("T")[0];
  //         break;
  //       }
  //       case "90d": {
  //         const quarterAgo = new Date(now);
  //         quarterAgo.setDate(now.getDate() - 90);
  //         startDate = quarterAgo.toISOString().split("T")[0];
  //         break;
  //       }
  //       default:
  //         startDate = endDate;
  //     }

  //     return { startDate, endDate };
  //   };

  const loadData = async () => {
    try {
      setLoading(true);

      // Load executions - NO FILTERS since they're commented out
      try {
        const executionsResponse =
          await communicationService.getExecutions({
            limit: 100,
          });
        if (executionsResponse.success && executionsResponse.data) {
          // The API returns data as {executions: [...], pagination: {...}}
          const executionsData = Array.isArray(
            executionsResponse.data.executions
          )
            ? executionsResponse.data.executions
            : [];
          setExecutions(executionsData);
        } else {
          setExecutions([]);
        }
      } catch (executionsErr) {
        console.error("Failed to load executions:", executionsErr);
      }

      // Load logs - NO FILTERS since they're commented out
      try {
        const logsResponse =
          await communicationService.getLogs({
            limit: 100,
          });
        if (logsResponse.success && logsResponse.data) {
          // The API returns data as {logs: [...], pagination: {...}}
          const logsData = Array.isArray(logsResponse.data.logs)
            ? logsResponse.data.logs
            : [];
          setLogs(logsData);
        } else {
          setLogs([]);
        }
      } catch (logsErr) {
        console.error("Failed to load logs:", logsErr);
      }

      setLoading(false);
    } catch (err) {
      console.error("Failed to load communication analytics:", err);
      showError(t.analytics.failedToLoadAnalytics, t.analytics.errorLoadingData);
      setLoading(false);
    }
  };

  // FILTER OPTIONS COMMENTED OUT - Not wanted on this page
  /*
  const periodOptions = [
    { value: "1d", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
  ];

  const channelOptions = [
    { value: "all", label: "All Channels" },
    { value: "SMS", label: "SMS" },
    { value: "EMAIL", label: "Email" },
    { value: "PUSH", label: "Push" },
    { value: "WHATSAPP", label: "WhatsApp" },
  ];

  const sourceTypeOptions = [
    { value: "all", label: "All Sources" },
    { value: "quicklist", label: "QuickList" },
    { value: "campaign", label: "Campaign" },
    { value: "manual", label: "Manual" },
  ];

  const logStatusOptions = [
    { value: "all", label: "All Status" },
    { value: "sent", label: "Sent" },
    { value: "failed", label: "Failed" },
    { value: "pending", label: "Pending" },
  ];
  */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-700 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className={`${tw.mainHeading} ${tw.textPrimary}`}>
              {t.analytics.campaignsAnalytics}
            </h1>
            <p className={`${tw.textSecondary} mt-2 text-sm`}>
              {t.analytics.performanceMetrics}
            </p>
          </div>
        </div>

        {/* FILTERS COMMENTED OUT FOR NOW - No filters wanted on this page
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {channelOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedSourceType}
            onChange={(e) => setSelectedSourceType(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sourceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={selectedLogStatus}
            onChange={(e) => setSelectedLogStatus(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {logStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        */}
      </div>

      {/*
      CHARTS COMMENTED OUT - No dummy data allowed on this page
      Charts will be re-enabled when real API data becomes available
      */}

      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tables Section */}
          <div className="space-y-6">
            {/* Executions Table */}
            {executions && executions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Executions
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
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopLeftRadius: "0.375rem",
                          }}
                        >
                          Execution ID
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Source
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Status
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {executions.length > 0 ? (
                        executions
                          .slice(
                            (executionsPage - 1) * itemsPerPage,
                            executionsPage * itemsPerPage
                          )
                          .map((execution) => {
                            if (!execution) return null;

                            return (
                              <tr
                                key={execution.id || execution.execution_id}
                                className="hover:bg-gray-50 transition-colors"
                                style={{
                                  backgroundColor: color.surface.tablebodybg,
                                }}
                              >
                                <td className="px-6 py-4 text-sm font-medium text-black">
                                  {execution.execution_id}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {execution.source_type === "quicklist" ? (
                                    <button
                                      onClick={() =>
                                        navigate(
                                          `/dashboard/quick-lists/${execution.source_id}`
                                        )
                                      }
                                      className="hover:underline transition-colors"
                                      style={{ color: color.primary.accent }}
                                    >
                                      {execution.source_type} #{execution.source_id}
                                    </button>
                                  ) : (
                                    <span className="text-black">
                                      {execution.source_type} #{execution.source_id}
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm text-black">
                                  <span
                                    className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full `}
                                    style={{
                                      backgroundColor:
                                        execution.status === "completed" ||
                                        !execution.status
                                          ? color.primary.accent
                                          : execution.status === "failed"
                                          ? color.status.danger
                                          : execution.status === "completed_with_errors"
                                          ? color.status.warning
                                          : color.primary.accent,
                                    }}
                                  >
                                    {execution.status || "completed"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-black">
                                  {execution.created_at
                                    ? new Date(
                                        execution.created_at
                                      ).toLocaleString()
                                    : "N/A"}
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-8 text-center text-sm text-black"
                          >
                            No executions found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Executions Pagination */}
                {executions.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t" style={{ borderColor: 'var(--c-border-default)' }}>
                    <div className="text-sm text-gray-700">
                      Showing {(executionsPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(
                        executionsPage * itemsPerPage,
                        executions.length
                      )}{" "}
                      of {executions.length} executions
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setExecutionsPage(Math.max(1, executionsPage - 1))
                        }
                        disabled={executionsPage === 1}
                        className={`${tw.button} px-3 py-1 text-sm ${
                          executionsPage === 1
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {executionsPage} of{" "}
                        {Math.ceil(executions.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setExecutionsPage(
                            Math.min(
                              Math.ceil(executions.length / itemsPerPage),
                              executionsPage + 1
                            )
                          )
                        }
                        disabled={
                          executionsPage ===
                          Math.ceil(executions.length / itemsPerPage)
                        }
                        className={`${tw.button} px-3 py-1 text-sm ${
                          executionsPage ===
                          Math.ceil(executions.length / itemsPerPage)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Communication Logs Table */}
            {logs && logs.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  Communication Logs
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
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopLeftRadius: "0.375rem",
                          }}
                        >
                          Execution ID
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                          }}
                        >
                          Channel
                        </th>
                        <th
                          className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                          style={{
                            color: color.surface.tableHeaderText,
                            backgroundColor: color.surface.tableHeader,
                            borderTopRightRadius: "0.375rem",
                          }}
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length > 0 ? (
                        logs
                          .slice(
                            (logsPage - 1) * itemsPerPage,
                            logsPage * itemsPerPage
                          )
                          .map((log) => (
                            <tr
                              key={log.id}
                              className="hover:bg-gray-50 transition-colors"
                              style={{
                                backgroundColor: color.surface.tablebodybg,
                              }}
                            >
                              <td className="px-6 py-4 text-sm font-medium text-black">
                                {log.execution_id}
                              </td>
                              <td className="px-6 py-4 text-sm text-black">
                                {log.channel}
                              </td>
                              <td className="px-6 py-4 text-sm text-black">
                                <span
                                  className={`inline-flex px-2 py-1 text-sm font-semibold rounded-full `}
                                  style={{
                                    backgroundColor:
                                      log.status === "sent"
                                        ? color.primary.accent
                                        : log.status === "failed"
                                        ? color.status.danger
                                        : color.primary.accent,
                                  }}
                                >
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-6 py-8 text-center text-sm text-black"
                          >
                            No logs found for the selected filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Logs Pagination */}
                {logs.length > itemsPerPage && (
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t" style={{ borderColor: 'var(--c-border-default)' }}>
                    <div className="text-sm text-gray-700">
                      Showing {(logsPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(logsPage * itemsPerPage, logs.length)} of{" "}
                      {logs.length} logs
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setLogsPage(Math.max(1, logsPage - 1))}
                        disabled={logsPage === 1}
                        className={`${tw.button} px-3 py-1 text-sm ${
                          logsPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-700">
                        Page {logsPage} of{" "}
                        {Math.ceil(logs.length / itemsPerPage)}
                      </span>
                      <button
                        onClick={() =>
                          setLogsPage(
                            Math.min(
                              Math.ceil(logs.length / itemsPerPage),
                              logsPage + 1
                            )
                          )
                        }
                        disabled={
                          logsPage === Math.ceil(logs.length / itemsPerPage)
                        }
                        className={`${tw.button} px-3 py-1 text-sm ${
                          logsPage === Math.ceil(logs.length / itemsPerPage)
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
