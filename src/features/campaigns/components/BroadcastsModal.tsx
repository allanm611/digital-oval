import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader, AlertCircle, RefreshCw } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { getStatusBadgeConfig } from "../../../shared/utils/statusColors";
import DateFormatter from "../../../shared/components/DateFormatter";
import { broadcastService } from "../services/broadcastService";
import { formatBroadcastStatusLabel } from "../utils/normalizeCampaignBroadcast";
import { Broadcast } from "../types/broadcast";

interface BroadcastsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  campaignId: number;
}

function broadcastRowKey(broadcast: Broadcast): string {
  return `${broadcast.broadcast_id}:${broadcast.run_id || "plan"}`;
}

export default function BroadcastsModal({
  isOpen,
  onClose,
  campaignName,
  campaignId,
}: BroadcastsModalProps) {
  const navigate = useNavigate();
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBroadcasts = useCallback(async () => {
    if (!campaignId) {
      setError("Campaign ID is missing");
      setBroadcasts([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await broadcastService.getAllCampaignBroadcasts(campaignId);
      if (response.success) {
        setBroadcasts(response.data ?? []);
      } else {
        setError("Failed to load broadcasts");
        setBroadcasts([]);
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load broadcasts",
      );
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (isOpen && campaignId) {
      loadBroadcasts();
    }
    if (!isOpen) {
      setBroadcasts([]);
      setError(null);
    }
  }, [isOpen, campaignId, loadBroadcasts]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-5xl max-h-[80vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">Campaign Broadcasts</h2>
            <p className="text-sm text-gray-600 mt-1">{campaignName}</p>
            {!loading && !error && (
              <p className="text-xs text-gray-500 mt-1">
                {broadcasts.length} broadcast{broadcasts.length === 1 ? "" : "s"} for campaign #{campaignId}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadBroadcasts}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <p className="text-gray-500">Loading broadcasts...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-400 mr-2" />
                <p className="text-red-500">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadBroadcasts}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
              >
                Try again
              </button>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-gray-500">No broadcasts found for this campaign</p>
              <p className="text-xs text-gray-400 max-w-md mx-auto">
                Broadcasts are created when a campaign is scheduled or executed. Draft campaigns may not have any yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Broadcast
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Channel
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Start
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">
                      Sent
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">
                      Delivered
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">
                      Failed
                    </th>
                    <th className="text-right py-3 px-3 font-semibold text-gray-700">
                      Delivery Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map((broadcast) => {
                    if (!broadcast.broadcast_id) return null;

                    const { className, style } = getStatusBadgeConfig(
                      broadcast.status,
                      "broadcast",
                    );
                    const sent = broadcast.messages_sent ?? 0;
                    const delivered = broadcast.messages_delivered ?? 0;
                    const failed = broadcast.messages_failed ?? 0;
                    const rate = Number(broadcast.delivery_rate) || 0;

                    return (
                      <tr
                        key={broadcastRowKey(broadcast)}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/dashboard/campaign-broadcasts/${broadcast.broadcast_id}`,
                                {
                                  state: { broadcast, campaignId, campaignName },
                                },
                              )
                            }
                            className="text-left text-sm font-medium transition-colors hover:opacity-80 block max-w-xs truncate"
                            style={{ color: color.primary.accent }}
                            title={broadcast.broadcast_name}
                          >
                            {broadcast.broadcast_name || "—"}
                          </button>
                          {broadcast.segment_name && (
                            <p className="text-xs text-gray-500 truncate max-w-xs">
                              {broadcast.segment_name}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${className}`} style={style}>
                            {formatBroadcastStatusLabel(broadcast.status)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-700 uppercase text-xs">
                          {broadcast.channel_code || "—"}
                        </td>
                        <td className="py-3 px-3 text-gray-700 whitespace-nowrap">
                          {broadcast.actual_start_time ? (
                            <DateFormatter date={broadcast.actual_start_time} />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-900">
                          {sent.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-900">
                          {delivered.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right text-gray-900">
                          {failed.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900">
                          {rate.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={() =>
              navigate(`/dashboard/campaign-broadcasts?campaignId=${campaignId}`)
            }
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: color.primary.accent }}
          >
            Open Campaign Broadcasts
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
