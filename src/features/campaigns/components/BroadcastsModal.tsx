import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Loader, AlertCircle } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { broadcastService } from "../services/broadcastService";
import { Broadcast } from "../types/broadcast";

interface BroadcastsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  campaignId: number;
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

  useEffect(() => {
    if (isOpen && campaignId) {
      loadBroadcasts();
    }
  }, [isOpen, campaignId]);

  const loadBroadcasts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await broadcastService.getBroadcastsByCampaign(campaignId);
      if (response.success && response.data) {
        setBroadcasts(response.data);
      } else {
        setError("Failed to load broadcasts");
      }
    } catch (err) {
      console.error("Failed to load broadcasts:", err);
      setError("Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">Campaign Broadcasts</h2>
            <p className="text-sm text-gray-600 mt-1">{campaignName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-gray-400 mr-2" />
              <p className="text-gray-500">Loading broadcasts...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <AlertCircle className="w-6 h-6 text-red-400 mr-2" />
              <p className="text-red-500">{error}</p>
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No broadcasts found for this campaign</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Broadcast Name
                    </th>
                    <th className="text-left py-3 px-3 font-semibold text-gray-700">
                      Status
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
                    if (!broadcast || !broadcast.broadcast_id) return null;

                    const broadcastName = broadcast.broadcast_name || "—";
                    const status = broadcast.status || "unknown";
                    const sent = broadcast.messages_sent ?? 0;
                    const delivered = broadcast.messages_delivered ?? 0;
                    const failed = broadcast.messages_failed ?? 0;
                    const rate = Number(broadcast.delivery_rate) || 0;

                    return (
                      <tr
                        key={broadcast.broadcast_id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-3">
                          <button
                            onClick={() => navigate(`/dashboard/campaign-broadcasts/${broadcast.broadcast_id}`, {
                              state: { broadcast, campaignId, campaignName }
                            })}
                            className="text-sm font-medium transition-colors hover:opacity-80"
                            style={{ color: color.primary.accent }}
                            title="View details"
                          >
                            {broadcastName}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-gray-900">
                          {status}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 flex justify-end">
          <button
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
