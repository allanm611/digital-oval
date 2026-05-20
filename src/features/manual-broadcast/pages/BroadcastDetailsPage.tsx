import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { communicationService } from "../../communications/services/communicationService";
import {
  CommunicationExecutionDetail,
  CommunicationLog,
  CommunicationChannel,
} from "../../communications/types/communication";
import { useToast } from "../../../contexts/ToastContext";
import DateFormatter from "../../../shared/components/DateFormatter";

export default function BroadcastDetailsPage() {
  const { id: executionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [execution, setExecution] =
    useState<CommunicationExecutionDetail | null>(null);
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      if (!executionId) {
        showError("Broadcast execution ID not found");
        navigate("/dashboard/manual-communications");
        return;
      }

      try {
        setLoading(true);
        const response =
          await communicationService.getExecutionDetails(executionId);

        if (response.success && response.data) {
          setExecution(response.data.execution);
          setLogs(response.data.recent_logs || []);
        } else {
          showError("Failed to load broadcast details");
        }
      } catch (err) {
        console.error("Failed to load broadcast details:", err);
        showError("Failed to load broadcast details");
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [executionId, navigate, showError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          Loading broadcast details...
        </p>
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-red-300 mb-4" />
        <p className={`${tw.textMuted} mb-6`}>Broadcast not found</p>
        <button
          onClick={() => navigate("/dashboard/manual-communications")}
          className="px-4 py-2 font-semibold rounded text-white transition-all duration-200"
          style={{ backgroundColor: color.primary.action }}
        >
          Back to Broadcasts
        </button>
      </div>
    );
  }

  const getChannelIcon = (channel: CommunicationChannel) => {
    switch (channel) {
      case "EMAIL":
        return <Mail className="w-4 h-4" />;
      case "SMS":
        return <MessageSquare className="w-4 h-4" />;
      case "WHATSAPP":
        return <MessageSquare className="w-4 h-4" />;
      case "PUSH":
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return { bg: "#E8F5E9", text: "#2E7D32" };
      case "failed":
        return { bg: "#FFEBEE", text: "#C62828" };
      case "pending":
        return { bg: "#FFF3E0", text: "#E65100" };
      default:
        return { bg: "#F5F5F5", text: "#616161" };
    }
  };

  const successRate =
    execution.total_recipients > 0
      ? ((execution.messages_sent / execution.total_recipients) * 100).toFixed(
          1,
        )
      : "0.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <BackButton
        fallbackTo="/dashboard/manual-broadcasts"
        showBreadcrumb={true}
        currentLabel="Broadcast Details"
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Recipients Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-black">
              Total Recipients
            </p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {execution.total_recipients.toLocaleString()}
          </p>
        </div>

        {/* Sent Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-black">Messages Sent</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {execution.messages_sent.toLocaleString()}
          </p>
        </div>

        {/* Failed Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-black">Messages Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {execution.messages_failed.toLocaleString()}
          </p>
        </div>

        {/* Success Rate Card */}
        <div
          className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
        >
          <div className="flex items-center gap-2">
            <Clock
              className="h-5 w-5"
              style={{ color: color.primary.accent }}
            />
            <p className="text-sm font-medium text-black">Success Rate</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">
            {successRate}%
          </p>
        </div>
      </div>

      {/* Execution Info */}
      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Execution Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-600">Source Type</p>
            <p className="mt-1 text-base text-gray-900 capitalize">
              {execution.source_type}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Source Name</p>
            <p className="mt-1 text-base text-gray-900">
              {execution.source_name || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Source ID</p>
            <p className="mt-1 text-base text-gray-900">
              {execution.source_id || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Execution Time</p>
            <p className="mt-1 text-base text-gray-900">
              {execution.execution_time_ms}ms
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Created At</p>
            <p className="mt-1 text-base text-gray-900">
              <DateFormatter date={execution.created_at} useUserTimezone includeTime />
            </p>
          </div>
        </div>
      </div>

      {/* Recent Logs */}
      <div
        className={`${tw.rounded} py-6`}
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Logs ({logs.length})
        </h2>

        {logs.length === 0 ? (
          <p className={`${tw.textMuted} text-sm`}>No logs available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[1200px]"
              style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
            >
              <thead style={{ background: color.surface.tableHeader }}>
                <tr>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Recipient
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Channel
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Error Code
                  </th>
                  <th
                    className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                    style={{ color: color.surface.tableHeaderText }}
                  >
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="transition-colors">
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <div className="font-medium truncate">
                        {log.recipient_identifier}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black capitalize"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {log.channel}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black capitalize"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      {log.status}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black truncate max-w-xs"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                      title={log.error_code}
                    >
                      {log.error_code || "-"}
                    </td>
                    <td
                      className="px-6 py-4 text-sm text-black"
                      style={{ backgroundColor: color.surface.tablebodybg }}
                    >
                      <DateFormatter date={log.created_at} useUserTimezone includeTime />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
