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
import { campaignFlowService } from "../services/campaignFlowService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, components } from "../../../shared/utils/utils";
import React, { useCallback } from "react";

interface ExecuteCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  isActive?: boolean;
  approvalStatus?: string;
  onSuccess?: (executionData?: any) => void;
}

interface SegmentMapping {
  id: number;
  segment_id: string;
  segment_name?: string;
  offer_id: number;
  offer_name?: string;
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
  isActive,
  approvalStatus,
  onSuccess,
}: ExecuteCampaignModalProps) {
  const { showToast } = useToast();
  const [segments, setSegments] = useState<SegmentMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionMode, setExecutionMode] = useState<"immediate" | "schedule">(
    "immediate",
  );

  // Check if campaign is approved and active, then it can be executed
  const isApproved = approvalStatus === "approved";
  const canExecute = isApproved && isActive;
  const executionDisabledReason = !isApproved
    ? `Campaign is pending approval (status: ${approvalStatus})`
    : !isActive
      ? "Campaign is not active. Please activate it first."
      : null;

  const loadSegments = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get segments and flows from campaign flows service (Step 2-3 data)
      const segmentsResponse =
        await campaignFlowService.getCampaignSegments(campaignId, true);
      const flowsResponse = await campaignFlowService.getCampaignFlows(
        campaignId,
        true,
      );

      if (
        !segmentsResponse?.success ||
        !Array.isArray(segmentsResponse.data) ||
        !flowsResponse?.success ||
        !Array.isArray(flowsResponse.data)
      ) {
        setSegments([]);
        return;
      }

      // Create segment list with their first associated offer from flows
      const uniqueSegments = segmentsResponse.data.map((segment) => {
        const segmentId = segment.id;

        // Find the first flow for this segment to get offer_id
        const flow = flowsResponse.data.find(
          (f) => f.segment_id === segmentId || String(f.segment_id) === String(segmentId),
        );

        return {
          id: segmentId,
          segment_id: String(segmentId),
          segment_name: segment.name,
          offer_id: flow?.offer_id || 0,
          offer_name: undefined,
          selected: true,
          channels: ["EMAIL"], // Default channel
        };
      });

      setSegments(uniqueSegments);
    } catch {
      showToast("error", "Failed to load campaign segments");
    } finally {
      setIsLoading(false);
    }
  }, [campaignId, showToast]);

  useEffect(() => {
    if (isOpen) {
      loadSegments();
    }
  }, [isOpen, campaignId, loadSegments]);

  const toggleSegment = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((seg) =>
        seg.segment_id === segmentId
          ? { ...seg, selected: !seg.selected }
          : seg,
      ),
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
      }),
    );
  };

  const handleExecute = async () => {
    const selectedSegments = segments.filter(
      (s) => s.selected && s.channels.length > 0,
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

      const executionResult = await campaignService.executeCampaign(request);

      showToast("success", `Campaign "${campaignName}" executed successfully!`);
      onSuccess?.(executionResult?.data);
      onClose();
    } catch (error) {
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
            {/* Warning/Error Alert */}
            {executionDisabledReason ? (
              <div
                className={`flex items-start gap-3 p-4 ${tw.rounded}`}
                style={{
                  backgroundColor: "#FEE2E2",
                  border: "1px solid #FECACA",
                }}
              >
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-900">
                    Cannot Execute Campaign
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {executionDisabledReason}
                  </p>
                </div>
              </div>
            ) : (
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
            )}

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
                  className={`flex-1 p-3 ${tw.rounded} border-2 font-medium transition-all ${
                    executionMode === "immediate"
                      ? "border-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    executionMode === "immediate"
                      ? {
                          borderColor: color.primary.accent,
                          backgroundColor: `${color.primary.accent}10`,
                        }
                      : {}
                  }
                >
                  <div className="font-medium text-sm">Immediate</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Execute now
                  </div>
                </button>
                <button
                  onClick={() => setExecutionMode("schedule")}
                  className={`flex-1 p-3 ${tw.rounded} border-2 font-medium transition-all ${
                    executionMode === "schedule"
                      ? "border-2"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={
                    executionMode === "schedule"
                      ? {
                          borderColor: color.primary.accent,
                          backgroundColor: `${color.primary.accent}10`,
                        }
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
                      key={`${segment.id}-${segment.offer_id}`}
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
                              Segment: {segment.segment_name || segment.segment_id || "Unknown"}
                            </div>
                            <div className={`text-xs ${tw.textSecondary}`}>
                              Offer: {segment.offer_name || segment.offer_id || "None"}
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
                                channel.code,
                              );
                              return (
                                <button
                                  key={channel.code}
                                  onClick={() =>
                                    toggleChannel(
                                      segment.segment_id,
                                      channel.code,
                                    )
                                  }
                                  className={`flex items-center gap-2 px-3 py-1.5 ${
                                    tw.rounded
                                  } text-sm transition-all border-2 ${
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
              className={`px-4 py-2 border ${tw.rounded} text-sm font-medium transition-colors disabled:opacity-50`}
              style={{
                borderColor: color.border.default,
                color: tw.textPrimary,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleExecute}
              disabled={
                !canExecute ||
                isExecuting ||
                segments.filter((s) => s.selected && s.channels.length > 0)
                  .length === 0
              }
              title={executionDisabledReason || "Execute campaign"}
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
