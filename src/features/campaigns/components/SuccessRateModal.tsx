import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";

interface ChannelDelivery {
  channel: string;
  delivered: number;
  total: number;
  successRate: number;
}

interface SuccessRateModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignName: string;
  totalDelivered: number;
  totalMessages: number;
  successRate: number;
}

const DUMMY_CHANNEL_DELIVERY: ChannelDelivery[] = [
  {
    channel: "Email",
    delivered: 4658,
    total: 5000,
    successRate: 93.2,
  },
  {
    channel: "SMS",
    delivered: 3485,
    total: 3500,
    successRate: 99.6,
  },
  {
    channel: "Push Notification",
    delivered: 4077,
    total: 4200,
    successRate: 97.1,
  },
];

export default function SuccessRateModal({
  isOpen,
  onClose,
  campaignName,
  totalDelivered,
  totalMessages,
  successRate,
}: SuccessRateModalProps) {
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
            <h2 className="text-lg font-semibold text-black">
              Delivery Success Rate
            </h2>
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
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-black mb-4">
              Success Rate by Channel
            </h3>
            <div className="space-y-4">
              {DUMMY_CHANNEL_DELIVERY.map((channel) => (
                <div
                  key={channel.channel}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-black">
                        {channel.channel}
                      </h4>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: color.primary.accent }}>
                      {channel.successRate.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${channel.successRate}%`,
                        backgroundColor: color.primary.accent,
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded p-2">
                      <label className="text-xs font-medium text-gray-600 block">
                        Delivered
                      </label>
                      <p className="text-sm font-semibold" style={{ color: color.primary.accent }}>
                        {channel.delivered.toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <label className="text-xs font-medium text-gray-600 block">
                        Total
                      </label>
                      <p className="text-sm font-semibold text-black">
                        {channel.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
