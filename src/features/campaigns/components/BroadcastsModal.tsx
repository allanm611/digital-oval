import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import type { CreativeChannel } from "../../offers/types/offerCreative";

interface ChannelStat {
  channel: CreativeChannel;
  creativeCount: number;
}

interface BroadcastsModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  channelStats?: ChannelStat[];
}

export default function BroadcastsModal({
  isOpen,
  onClose,
  campaignName,
  channelStats = [],
}: BroadcastsModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">Broadcasts by Channel</h2>
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
          {channelStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No channels configured for this campaign</p>
            </div>
          ) : (
            <div className="space-y-3">
              {channelStats.map((stat, index) => (
                <div
                  key={`${stat.channel}-${index}`}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-black">
                        {stat.channel}
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Sent
                      </label>
                      <p className="text-sm font-semibold text-black">
                        0
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">
                        Total Targeted
                      </label>
                      <p className="text-sm font-semibold text-black">
                        —
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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
