import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { color, tw } from "../../../shared/utils/utils";

interface Segment {
  id: string | number;
  segment_id: number;
  segment_name: string;
  include_exclude?: "include" | "exclude";
  is_primary?: boolean;
}

interface CampaignSegmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  segments: Segment[];
  campaignName: string;
}

export default function CampaignSegmentsModal({
  isOpen,
  onClose,
  segments,
  campaignName,
}: CampaignSegmentsModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSegmentClick = (segmentId: number) => {
    navigate(`/dashboard/segments/${segmentId}`);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-black">
              Campaign Segments
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {campaignName}
            </p>
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
          {segments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No segments associated with this campaign</p>
            </div>
          ) : (
            <div className="space-y-2">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                >
                  <p className="text-sm text-black">
                    {segment.segment_name}
                  </p>
                  <button
                    onClick={() => handleSegmentClick(segment.segment_id)}
                    className="px-3 py-1 text-sm font-medium text-white rounded transition-colors"
                    style={{
                      backgroundColor: color.primary.action,
                    }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
