import { createPortal } from "react-dom";
import { X, Calendar, Clock } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import type { CreativeChannel } from "../../offers/types/offerCreative";

interface ChannelStat {
  channel: CreativeChannel;
  creativeCount: number;
}

interface ScheduledModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  startDate: string | null;
  endDate: string | null;
  channelStats?: ChannelStat[];
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return dateString;
  }
};

export default function ScheduledModal({
  isOpen,
  onClose,
  campaignName,
  startDate,
  endDate,
  channelStats = [],
}: ScheduledModalProps) {
  if (!isOpen) return null;

  const hasSchedule = startDate || endDate;
  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">View Campaign Schedule</h2>
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
        <div className="p-6">
          {!hasSchedule ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">No scheduled time set</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Start Date */}
              {startDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Start Date
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center gap-3">
                    <Calendar className="w-5 h-5" style={{ color: color.primary.accent }} />
                    <p className="text-sm font-semibold text-black">{formattedStartDate}</p>
                  </div>
                </div>
              )}

              {/* End Date */}
              {endDate && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    End Date
                  </label>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center gap-3">
                    <Clock className="w-5 h-5" style={{ color: color.primary.accent }} />
                    <p className="text-sm font-semibold text-black">{formattedEndDate}</p>
                  </div>
                </div>
              )}

              {/* Scheduled Channels */}
              {channelStats.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-2">
                    Scheduled Channels
                  </label>
                  <div className="space-y-2">
                    {channelStats.map((stat, index) => (
                      <div
                        key={`${stat.channel}-${index}`}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <p className="text-sm font-medium text-black">{stat.channel}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
