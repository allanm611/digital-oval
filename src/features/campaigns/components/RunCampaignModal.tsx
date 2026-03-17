import { useState, useEffect, useRef } from "react";
import {
  X,
  AlertTriangle,
  ChevronDown,
  Check,
} from "lucide-react";
import { campaignService } from "../services/campaignService";
import { campaignFlowService } from "../services/campaignFlowService";
import { offerService } from "../../offers/services/offerService";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw, components } from "../../../shared/utils/utils";
import React, { useCallback } from "react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface RunCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: number;
  campaignName: string;
  isActive?: boolean;
  approvalStatus?: string;
  onSuccess?: (runData?: any) => void;
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
  { code: "NORMAL_SMS", label: "Normal SMS" },
  { code: "FLASH_SMS", label: "Flash SMS" },
  { code: "USSD", label: "USSD" },
  { code: "INTERACTIVE_USSD", label: "Interactive USSD" },
  { code: "EMAIL", label: "Email" },
  { code: "PUSH", label: "Push Notification" },
  { code: "WHATSAPP", label: "WhatsApp" },
  { code: "INAPP", label: "In-App" },
  { code: "OBD", label: "OBD" },
  { code: "IVR", label: "IVR" },
  { code: "SHORT_CODE", label: "Short Code" },
];

export default function RunCampaignModal({
  isOpen,
  onClose,
  campaignId,
  campaignName,
  isActive,
  approvalStatus,
  onSuccess,
}: RunCampaignModalProps) {
  const { showToast } = useToast();
  const [segments, setSegments] = useState<SegmentMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Check if campaign is approved and active, then it can be run
  const isApproved = approvalStatus === "approved";
  const canRun = isApproved && isActive;
  const runDisabledReason = !isApproved
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
        const segmentId = segment.segment_id || segment.id;

        // Find the first flow for this segment to get offer_id
        const flow = flowsResponse.data.find(
          (f) => String(f.segment_id) === String(segmentId),
        );

        return {
          id: segmentId,
          segment_id: String(segmentId),
          segment_name: segment.segment_name || segment.name,
          offer_id: flow?.offer_id || 0,
          offer_name: undefined,
          selected: true,
          channels: ["EMAIL"], // Default channel
        };
      });

      // Fetch offer names for all unique offer IDs
      const offerIds = new Set(
        uniqueSegments.map((seg) => seg.offer_id).filter((id) => id > 0),
      );

      const offerMap: Record<number, string> = {};
      if (offerIds.size > 0) {
        try {
          const offerPromises = Array.from(offerIds).map(async (offerId) => {
            try {
              const offerResponse = await offerService.getOfferById(
                offerId,
                true,
              );
              const offer =
                offerResponse?.data ||
                (offerResponse as { id?: number; name?: string });
              if (offer?.name) {
                offerMap[offerId] = offer.name;
              }
            } catch {
              // Silently fail for individual offers
            }
          });

          await Promise.all(offerPromises);
        } catch {
          // Silently fail if offer fetching fails
        }
      }

      // Update segments with offer names
      const segmentsWithOfferNames = uniqueSegments.map((seg) => ({
        ...seg,
        offer_name: offerMap[seg.offer_id],
      }));

      setSegments(segmentsWithOfferNames);
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


    setIsRunning(true);
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

      const request: any = {
        campaign_id: campaignId,
        segments: segmentsData,
        mode: "immediate",
      };

      const runResult = await campaignService.runCampaign(request);

      showToast("success", `Campaign "${campaignName}" started successfully!`);
      onSuccess?.(runResult?.data);
      onClose();
    } catch (error) {
      // Extract error message from backend response
      let errorMessage = "Failed to run campaign. Please try again.";

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
                errorMessage = "Failed to run campaign. Please try again.";
              } else {
                errorMessage = backendMessage || errorMessage;
              }
            } catch {
              // If parsing fails, use generic message
              errorMessage = "Failed to run campaign. Please try again.";
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
      setIsRunning(false);
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
            <div>
              <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                Run Campaign
              </h2>
              <p className={`text-sm ${tw.textSecondary} mt-0.5`}>
                {campaignName}
              </p>
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
            {/* Error Alert - Only show if disabled */}
            {executionDisabledReason && (
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
                    Cannot Run Campaign
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    {executionDisabledReason}
                  </p>
                </div>
              </div>
            )}

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
                      className={`${components.card.surface} transition-all border-2 relative`}
                      style={
                        segment.selected
                          ? { borderColor: "transparent" }
                          : { borderColor: color.border.default }
                      }
                    >
                      {segment.selected && (
                        <div
                          className={`absolute ${tw.rounded} pointer-events-none border-2`}
                          style={{
                            borderColor: color.primary.accent,
                            top: "-2px",
                            right: "-2px",
                            bottom: "-2px",
                            left: "-2px",
                          }}
                        />
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={segment.selected}
                            onChange={() => toggleSegment(segment.segment_id)}
                            className="w-4 h-4 rounded flex-shrink-0"
                            style={{ accentColor: color.primary.accent }}
                          />
                          <div className="flex-1">
                            <div
                              className={`text-sm font-medium ${tw.textPrimary}`}
                            >
                              {segment.segment_name || segment.segment_id || "Unknown"}
                            </div>
                            <div className={`text-xs ${tw.textSecondary}`}>
                              {segment.offer_name || `Offer ID: ${segment.offer_id}` || "None"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Channels Multi-Select Dropdown */}
                      {segment.selected && (
                        <ChannelSelector
                          selectedChannels={segment.channels}
                          onChannelsChange={(channels) => {
                            setSegments((prev) =>
                              prev.map((seg) =>
                                seg.segment_id === segment.segment_id
                                  ? { ...seg, channels }
                                  : seg,
                              ),
                            );
                          }}
                        />
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
              disabled={isRunning}
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
                !canRun ||
                isRunning ||
                segments.filter((s) => s.selected && s.channels.length > 0)
                  .length === 0
              }
              title={runDisabledReason || "Run campaign"}
              className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Running...
                </>
              ) : (
                "Run Campaign"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Channel Selector Component
interface ChannelSelectorProps {
  selectedChannels: string[];
  onChannelsChange: (channels: string[]) => void;
}

function ChannelSelector({
  selectedChannels,
  onChannelsChange,
}: ChannelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChannelToggle = (channelCode: string) => {
    const newChannels = selectedChannels.includes(channelCode)
      ? selectedChannels.filter((c) => c !== channelCode)
      : [...selectedChannels, channelCode];
    onChannelsChange(newChannels);
  };

  const selectedLabels = selectedChannels
    .map((code) => AVAILABLE_CHANNELS.find((ch) => ch.code === code)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div
      ref={dropdownRef}
      className="relative mt-3 pt-3"
    >
      <label className={`block text-xs font-medium ${tw.textPrimary} mb-2`}>
        Select Channels
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-lg text-left flex items-center justify-between ${tw.textPrimary}`}
        style={{ borderColor: color.border.default }}
      >
        <span className="text-sm">
          {selectedLabels || "Select channels..."}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 mt-1 ${tw.rounded} shadow-lg z-10 border`}
          style={{
            backgroundColor: color.surface.background,
            borderColor: color.border.default,
          }}
        >
          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
            {AVAILABLE_CHANNELS.map((channel) => {
              const isSelected = selectedChannels.includes(channel.code);
              return (
                <button
                  key={channel.code}
                  onClick={() => handleChannelToggle(channel.code)}
                  className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors ${tw.textPrimary} ${
                    isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center`}
                    style={{
                      borderColor: isSelected
                        ? color.primary.accent
                        : color.border.default,
                      backgroundColor: isSelected
                        ? color.primary.accent
                        : "transparent",
                    }}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{channel.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
