import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Loader,
  Radio,
  Send,
  TrendingUp,
} from "lucide-react";
import { useParams, useLocation } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import { getStatusBadgeConfig } from "../../../shared/utils/statusColors";
import DateFormatter from "../../../shared/components/DateFormatter";
import { broadcastService } from "../services/broadcastService";
import {
  Broadcast,
  BroadcastDetails,
  BroadcastStatus,
} from "../types/broadcast";
import { formatBroadcastStatusLabel } from "../utils/normalizeCampaignBroadcast";

interface LocationCache {
  broadcast?: Broadcast;
  campaignId?: number;
  campaignName?: string;
}

function detailsFromCache(
  broadcastId: string,
  state?: LocationCache | null,
): BroadcastDetails | null {
  const cached = state?.broadcast;
  if (!cached || String(cached.broadcast_id) !== String(broadcastId)) {
    return null;
  }

  return {
    broadcast: {
      id: cached.broadcast_id,
      name: cached.broadcast_name || "—",
      campaign: {
        id: state?.campaignId ?? cached.campaign_id ?? null,
        name: state?.campaignName ?? cached.campaign_name ?? null,
      },
      segment: {
        id: cached.segment_id ?? null,
        name: cached.segment_name ?? null,
      },
      offer: {
        id: cached.offer_id ?? null,
        name: cached.offer_name ?? null,
      },
      channel_code: cached.channel_code ?? null,
      status: cached.status,
      start_time: cached.actual_start_time || cached.planned_start_time || null,
      end_time: cached.actual_end_time || null,
      timezone: cached.timezone ?? null,
      broadcast_type: cached.broadcast_type ?? null,
      created_at: cached.created_at ?? null,
      updated_at: cached.updated_at ?? null,
    },
    metrics: {
      total_audience:
        (cached.messages_sent ?? 0) + (cached.messages_failed ?? 0) ||
        Number(cached.messages_queued ?? 0),
      messages_sent: cached.messages_sent ?? 0,
      messages_failed: cached.messages_failed ?? 0,
    },
    policy_violations: [],
    delivery_logs: [],
  };
}

export default function CampaignBroadcastDetailsPage() {
  const { broadcastId } = useParams();
  const location = useLocation();

  const [details, setDetails] = useState<BroadcastDetails | null>(() =>
    broadcastId
      ? detailsFromCache(broadcastId, location.state as LocationCache | null)
      : null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!broadcastId) {
      setError("Broadcast ID is missing");
      setLoading(false);
      return;
    }

    const state = location.state as LocationCache | null;
    // Seed from navigation cache for instant paint, then refresh from API
    const cached = detailsFromCache(broadcastId, state);
    if (cached) {
      setDetails(cached);
    }

    try {
      setLoading(true);
      setError(null);
      const data = await broadcastService.getBroadcastDetails(broadcastId);
      setDetails(data);
    } catch (err) {
      console.error("Failed to load broadcast details:", err);
      if (!cached) {
        setError(
          err instanceof Error ? err.message : "Failed to load broadcast details",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [broadcastId, location.state]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  if (loading && !details) {
    return (
      <div className="space-y-6">
        <BackButton showBreadcrumb={true} currentLabel="Broadcast Details" />
        <div className="flex items-center justify-center py-16 gap-2">
          <Loader className="w-5 h-5 animate-spin text-gray-400" />
          <p className="text-gray-600">Loading broadcast details...</p>
        </div>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="space-y-6">
        <BackButton showBreadcrumb={true} currentLabel="Broadcast Details" />
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-red-600 font-medium">{error}</p>
          <button
            type="button"
            onClick={loadDetails}
            className="px-4 py-2 text-sm font-medium text-white rounded"
            style={{ backgroundColor: color.primary.action }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="space-y-6">
        <BackButton showBreadcrumb={true} currentLabel="Broadcast Details" />
        <p className="text-gray-600">Broadcast not found.</p>
      </div>
    );
  }

  const { broadcast, metrics, policy_violations, delivery_logs } = details;
  const status = broadcast.status as BroadcastStatus;
  const { className: statusClass, style: statusStyle } = getStatusBadgeConfig(
    status,
    "broadcast",
  );

  const sent = metrics.messages_sent ?? 0;
  const failed = metrics.messages_failed ?? 0;
  const audience = metrics.total_audience || sent + failed;
  const deliveryRate =
    audience > 0 ? ((sent / audience) * 100).toFixed(1) : "0.0";

  const failedLogs = delivery_logs.filter((l) => l.status !== "DELIVERED");
  const deliveredLogs = delivery_logs.filter((l) => l.status === "DELIVERED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <BackButton showBreadcrumb={true} currentLabel="Broadcast Details" />
        {loading && (
          <span className="flex items-center gap-2 text-xs text-gray-500">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            Refreshing…
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Total Audience</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">{audience.toLocaleString()}</p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Messages Sent</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">{sent.toLocaleString()}</p>
          <p className="mt-1 text-xs text-gray-600">{deliveryRate}% of audience</p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Failed</p>
          </div>
          <p className="mt-2 text-3xl font-bold text-black">{failed.toLocaleString()}</p>
        </div>
        <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" style={{ color: color.primary.accent }} />
            <p className="text-sm font-medium text-gray-600">Status</p>
          </div>
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusClass}`}
              style={statusStyle}
            >
              {formatBroadcastStatusLabel(status)}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Broadcast Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="mt-2 text-sm font-medium text-black">{broadcast.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Broadcast ID</p>
            <p className="mt-2 text-sm font-medium text-black break-all">{broadcast.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Campaign</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.campaign.name || "—"}
              {broadcast.campaign.id != null ? ` (#${broadcast.campaign.id})` : ""}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Segment</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.segment.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Offer</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.offer.name || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Channel</p>
            <p className="mt-2 text-sm font-medium text-black uppercase">
              {broadcast.channel_code || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Start Time</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.start_time ? (
                <DateFormatter date={broadcast.start_time} useUserTimezone includeTime />
              ) : (
                "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">End Time</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.end_time ? (
                <DateFormatter date={broadcast.end_time} useUserTimezone includeTime />
              ) : (
                "—"
              )}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Timezone</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.timezone || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Broadcast Type</p>
            <p className="mt-2 text-sm font-medium text-black">
              {broadcast.broadcast_type || "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`${tw.rounded} border bg-white p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
        >
          <h3 className="text-base font-semibold text-black mb-4">Delivery Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivered / Sent</span>
              <span className="text-sm font-medium text-black">{sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="text-sm font-medium text-black">{failed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Delivery Rate</span>
              <span className="text-sm font-medium text-black">{deliveryRate}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Log entries</span>
              <span className="text-sm font-medium text-black">
                {delivery_logs.length.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div
          className={`${tw.rounded} border bg-white p-6 shadow-sm`}
          style={{ borderColor: color.border.default }}
        >
          <h3 className="text-base font-semibold text-black mb-4">Policy Violations</h3>
          {policy_violations.length === 0 ? (
            <p className="text-sm text-gray-500">No policy violations recorded</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {policy_violations.map((violation, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded px-3 py-2"
                >
                  {typeof violation === "string"
                    ? violation
                    : JSON.stringify(violation)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-black">Delivery Logs</h3>
          <p className="text-xs text-gray-500">
            {deliveredLogs.length} delivered · {failedLogs.length} failed
          </p>
        </div>

        {delivery_logs.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Radio className="w-4 h-4" />
            No delivery logs yet for this broadcast
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Recipient</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Channel</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Title</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Provider / Error</th>
                  <th className="text-left py-2 px-2 font-semibold text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {delivery_logs.slice(0, 200).map((log) => (
                  <tr key={String(log.id)} className="border-b border-gray-100">
                    <td className="py-2 px-2 text-gray-900">{log.recipient || "—"}</td>
                    <td className="py-2 px-2 uppercase text-xs text-gray-700">
                      {log.channel || "—"}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          log.status === "DELIVERED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-gray-700 max-w-xs truncate" title={log.title}>
                      {log.title || "—"}
                    </td>
                    <td
                      className="py-2 px-2 text-gray-600 max-w-xs truncate"
                      title={log.provider_response_or_error || ""}
                    >
                      {log.provider_response_or_error || "—"}
                    </td>
                    <td className="py-2 px-2 text-gray-700 whitespace-nowrap">
                      {log.created_at ? (
                        <DateFormatter date={log.created_at} useUserTimezone includeTime />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {delivery_logs.length > 200 && (
              <p className="text-xs text-gray-500 mt-2">
                Showing first 200 of {delivery_logs.length} logs
              </p>
            )}
          </div>
        )}
      </div>

      <div
        className={`${tw.rounded} border bg-white p-6 shadow-sm`}
        style={{ borderColor: color.border.default }}
      >
        <h3 className="text-base font-semibold text-black mb-4">Audit Trail</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Created At</span>
            <span className="text-sm font-medium text-black">
              {broadcast.created_at ? (
                <DateFormatter date={broadcast.created_at} useUserTimezone includeTime />
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Updated At</span>
            <span className="text-sm font-medium text-black">
              {broadcast.updated_at ? (
                <DateFormatter date={broadcast.updated_at} useUserTimezone includeTime />
              ) : (
                "—"
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
