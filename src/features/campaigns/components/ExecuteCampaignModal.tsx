import { useState, useEffect } from "react";
import {
  X,
  Play,
  AlertTriangle,
  Mail,
  MessageSquare,
  Bell,
} from "lucide-react";
import { campaignService } from "../services/campaignService";
import { campaignSegmentOfferService } from "../services/campaignSegmentOfferService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, components } from "../../../shared/utils/utils";

interface ExecuteCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  onSuccess?: () => void;
}

interface SegmentMapping {
  id: number;
  segment_id: string;
  offer_id: number;
  selected: boolean;
  channels: string[];
}

const AVAILABLE_CHANNELS = [
  { code: "EMAIL", label: "Email", icon: Mail, color: "#4F46E5" },
  { code: "SMS", label: "SMS", icon: MessageSquare, color: "#10B981" },
  { code: "PUSH", label: "Push Notification", icon: Bell, color: "#F59E0B" },
];

export default function ExecuteCampaignModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  onSuccess,
}: ExecuteCampaignModalProps) {
  const { showToast } = useToast();
  const [segments, setSegments] = useState<SegmentMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<"immediate" | "scheduled">(
    "immediate"
  );

  useEffect(() => {
    if (isOpen) {
      loadSegments();
    }
  }, [isOpen, campaignId, loadSegments]);

  const loadSegments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await campaignSegmentOfferService.getMappingsByCampaign(
        campaignId
      );

      // Transform mappings to segment list with default EMAIL channel
      const uniqueSegments = Array.from(
        new Set(response.data.map((m) => m.segment_id))
      ).map((segmentId) => {
        const mapping = response.data.find((m) => m.segment_id === segmentId);
        return {
          id: mapping!.id,
          segment_id: segmentId,
          offer_id: mapping!.offer_id,
          selected: true,
          channels: ["EMAIL"], // Default channel
        };
      });

      setSegments(uniqueSegments);
    } catch (error) {
      console.error("Error loading segments:", error);
      showToast("error", "Failed to load campaign segments");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, showToast]);

  const toggleSegment = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.segment_id === segmentId ? { ...seg, selected: !seg.selected } : seg
      )
    );
  };

  const toggleChannel = (segmentId: string, channelCode: string) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.segment_id === segmentId) {
          const channels = seg.channels.includes(channelCode)
            ? seg.channels.filter((c) => c !== channelCode)
            : [...seg.channels, channelCode];
          return { ...seg, channels };
        }
        return seg;
      })
    );
  };

  const handleExecute = async () => {
    const selectedSegments = segments.filter(
      (s) => s.selected && s.channels.length > 0
    );

    if (selectedSegments.length === 0) {
      showToast("warning", "Please select at least one segment with a channel");
      return;
    }

    setIsExecuting(true);
    try {
      // Prepare segments with proper type conversion
      const segmentsData = selectedSegments.map((seg) => {
        const segmentId =
          typeof seg.segment_id === "string"
            ? parseInt(seg.segment_id, 10)
            : seg.segment_id;

        // Validate segment_id is a valid number
        if (isNaN(segmentId)) {
          throw new Error(`Invalid segment ID: ${seg.segment_id}`);
        }

        return {
          segment_id: segmentId,
          channel_codes: seg.channels,
        };
      });

      const request = {
        campaign_id: campaignId,
        segments: segmentsData,
        mode: executionMode,
      };

      console.log("Executing campaign with request:", request);
      await campaignService.executeCampaign(request);

      showToast("success", `Campaign "${campaignName}" executed successfully!`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error executing campaign:", error);

      // Extract error message from backend response
      let errorMessage = "Failed to execute campaign. Please try again.";

      if (error instanceof Error) {
        // Filter out HTTP error messages
        if (
          error.message.includes("HTTP error") ||
          error.message.includes("status:")
        ) {
          errorMessage = "Failed to execute campaign. Please try again.";
        } else {
          // Try to parse JSON error message from the error string
          const match = error.message.match(/details: ({.*})/);
          if (match) {
            try {
              const errorData = JSON.parse(match[1]);
              const backendMessage = errorData.error || errorData.message || "";
              // Filter out HTTP errors from backend message
              if (
                backendMessage.includes("HTTP error") ||
                backendMessage.includes("status:")
              ) {
                errorMessage = "Failed to execute campaign. Please try again.";
              } else {
                errorMessage = backendMessage || errorMessage;
              }
            } catch {
              // If parsing fails, use generic message
              errorMessage = "Failed to execute campaign. Please try again.";
            }
          } else {
            // Use the error message if it doesn't contain HTTP errors
            if (
              !error.message.includes("HTTP error") &&
              !error.message.includes("status:")
            ) {
              errorMessage = error.message;
            }
          }
        }
      }

      showToast("error", errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          className={`relative bg-white ${tw.rounded} shadow-2xl w-full max-w-2xl`}
          style={{ maxHeight: "90vh", overflow: "auto" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b"
            style={{ borderColor: color.border.default }}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 ${tw.rounded} flex items-center justify-center`}
                style={{ backgroundColor: `${color.primary.accent}20` }}
              >
                <Play
                  className="w-5 h-5"
                  style={{ color: color.primary.accent }}
                />
              </div>
              <div>
                <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                  Execute Campaign
                </h2>
                <p className={`text-sm ${tw.textSecondary} mt-0.5`}>
                  {campaignName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Warning Alert */}
            <div
              className={`flex items-start gap-3 p-4 ${tw.rounded}`}
              style={{
                backgroundColor: "#FEF3C7",
                border: "1px solid #FCD34D",
              }}
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">
                  Confirm Campaign Execution
                </h4>
                <p className="text-sm text-amber-700 mt-1">
                  This will send communications to the selected segments. Please
                  review carefully before proceeding.
                </p>
              </div>
            </div>

            {/* Execution Mode */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                Execution Mode
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setExecutionMode("immediate")}
                  className={`flex-1 p-3 ${tw.rounded} border-2 transition-all ${
                    executionMode === "immediate"
                      ? "border-current"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    executionMode === "immediate"
                      ? { borderColor: color.primary.accent }
                      : {}
                  }
                >
                  <div className="font-medium text-sm">Immediate</div>
                  <div className="text-xs text-gray-500 mt-1">Execute now</div>
                </button>
                <button
                  onClick={() => setExecutionMode("scheduled")}
                  className={`flex-1 p-3 ${tw.rounded} border-2 transition-all ${
                    executionMode === "scheduled"
                      ? "border-current"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    executionMode === "scheduled"
                      ? { borderColor: color.primary.accent }
                      : {}
                  }
                >
                  <div className="font-medium text-sm">Scheduled</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Execute as scheduled
                  </div>
                </button>
              </div>
            </div>

            {/* Segments & Channels */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-3`}
              >
                Select Segments & Channels
              </label>

              {isLoading ? (
                <div className="text-center py-8">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
                    style={{ borderColor: color.primary.accent }}
                  ></div>
                  <p className={`text-sm ${tw.textSecondary} mt-2`}>
                    Loading segments...
                  </p>
                </div>
              ) : segments.length === 0 ? (
                <div className={components.card.surface}>
                  <p className={`text-center py-8 ${tw.textSecondary}`}>
                    No segments found for this campaign
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`${components.card.surface} transition-all ${
                        segment.selected ? "border-2" : ""
                      }`}
                      style={
                        segment.selected
                          ? { borderColor: color.primary.accent }
                          : {}
                      }
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={segment.selected}
                            onChange={() => toggleSegment(segment.segment_id)}
                            className="w-4 h-4 rounded"
                            style={{ accentColor: color.primary.accent }}
                          />
                          <div>
                            <div
                              className={`text-sm font-medium ${tw.textPrimary}`}
                            >
                              Segment ID: {segment.segment_id}
                            </div>
                            <div className={`text-xs ${tw.textSecondary}`}>
                              Offer ID: {segment.offer_id}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Channels */}
                      {segment.selected && (
                        <div
                          className="mt-3 pt-3 border-t"
                          style={{ borderColor: color.border.default }}
                        >
                          <div className="text-xs font-medium text-gray-600 mb-2">
                            Channels:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_CHANNELS.map((channel) => {
                              const Icon = channel.icon;
                              const isSelected = segment.channels.includes(
                                channel.code
                              );
                              return (
                                <button
                                  key={channel.code}
                                  onClick={() =>
                                    toggleChannel(
                                      segment.segment_id,
                                      channel.code
                                    )
                                  }
                                  className={`flex items-center gap-2 px-3 py-1.5 ${tw.rounded} text-sm transition-all border-2 ${
                                    isSelected ? "" : "hover:bg-gray-100"
                                  }`}
                                  style={
                                    isSelected
                                      ? {
                                          backgroundColor: `${channel.color}20`,
                                          color: channel.color,
                                          borderColor: channel.color,
                                        }
                                      : {
                                          backgroundColor: color.surface.cards,
                                          borderColor: "transparent",
                                        }
                                  }
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="font-medium">
                                    {channel.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 p-6 border-t"
            style={{ borderColor: color.border.default }}
          >
            <button
              onClick={onClose}
              disabled={isExecuting}
              className={`px-4 py-2 border ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50`}
              style={{ borderColor: color.border.default }}
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={
                isExecuting ||
                segments.filter((s) => s.selected && s.channels.length > 0)
                  .length === 0
              }
              className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute Campaign
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
