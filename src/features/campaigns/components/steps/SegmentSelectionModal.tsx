import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Search, Plus, Users } from "lucide-react";
import { CampaignSegment } from "../../types/campaign";
import HeadlessSelect from "../../../../shared/components/ui/HeadlessSelect";
import { color , tw} from "../../../../shared/utils/utils";
import { segmentService } from "../../../segments/services/segmentService";
import { Segment } from "../../../segments/types/segment";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../../shared/components/DateFormatter";

interface SegmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (segments: CampaignSegment[]) => void;
  selectedSegments: CampaignSegment[];
  editingSegment?: CampaignSegment | null;
  onCreateNew?: () => void;
}

// Helper function to convert Segment to CampaignSegment
const convertToCampaignSegment = (segment: Segment): CampaignSegment => {
  // Use actual customer count from segment data (size_estimate or customer_count)
  const customerCount =
    (segment as any).customer_count ?? segment.size_estimate ?? 0;

  return {
    id: String(segment.segment_id || segment.id || ""),
    name: segment.name,
    description: segment.description || "",
    customer_count: customerCount,
    created_at:
      segment.created_at || segment.created_on || new Date().toISOString(),
    criteria: segment.criteria || {}, // Use existing criteria or empty object
  };
};

export default function SegmentSelectionModal({
  isOpen,
  onClose,
  onSelect,
  selectedSegments,
  editingSegment,
  onCreateNew,
}: SegmentSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [tempSelectedSegments, setTempSelectedSegments] =
    useState<CampaignSegment[]>(selectedSegments);
  const [segments, setSegments] = useState<CampaignSegment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const filterOptions = [
    { value: "all", label: "All Segments" },
    { value: "high_value", label: "High Value" },
    { value: "at_risk", label: "At Risk" },
    { value: "new", label: "New Customers" },
    { value: "inactive", label: "Inactive" },
  ];

  // Load only active segments from backend
  useEffect(() => {
    const loadSegments = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        const response = await segmentService.getActiveSegments({
          skipCache: true,
        });
        const backendSegments = response.data || [];
        const campaignSegments = backendSegments.map(convertToCampaignSegment);
        setSegments(campaignSegments);
      } catch (error) {
        console.error("Failed to load active segments:", error);
        setSegments([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadSegments();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedSegments(selectedSegments);
    }
  }, [isOpen, selectedSegments]);

  if (!isOpen) return null;

  const totalSelectedCustomers = tempSelectedSegments.reduce(
    (total, segment) => total + segment.customer_count,
    0
  );

  const filteredSegments = segments.filter((segment) => {
    const matchesSearch =
      segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (segment.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );

    if (selectedFilter === "all") return matchesSearch;

    // Add more filter logic here based on segment criteria
    return matchesSearch;
  });

  const handleSegmentToggle = (segment: CampaignSegment) => {
    const isSelected = tempSelectedSegments.some((s) => s.id === segment.id);
    if (isSelected) {
      setTempSelectedSegments(
        tempSelectedSegments.filter((s) => s.id !== segment.id)
      );
    } else {
      setTempSelectedSegments([...tempSelectedSegments, segment]);
    }
  };

  const handleConfirm = () => {
    onSelect(tempSelectedSegments);
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        zIndex: 9999,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <div className={`bg-white ${tw.rounded}  w-full max-w-4xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingSegment ? "Edit Segment" : "Select Audience Segments"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose segments to target with your campaign
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {tempSelectedSegments.length > 0 && (
            <div className={`${tw.rounded} p-4 border border-gray-200 bg-gray-50 text-sm text-gray-700`}>
              <div className="flex items-center justify-between">
                <span>
                  {tempSelectedSegments.length} segment
                  {tempSelectedSegments.length !== 1 ? "s" : ""} selected (
                  {totalSelectedCustomers.toLocaleString()} customers)
                </span>
                <button
                  onClick={() => setTempSelectedSegments([])}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className={`px-6 pt-6 space-y-4 flex-shrink-0 ${
            tempSelectedSegments.length === 0 ? "pb-6" : ""
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search segments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} `}
              />
            </div>
            <div className="w-48">
              <div className="[&_button]:py-2 [&_li]:py-1.5">
                <HeadlessSelect
                  options={filterOptions}
                  value={selectedFilter}
                  onChange={(value: string | number) =>
                    setSelectedFilter(value as string)
                  }
                  placeholder="Filter segments"
                />
              </div>
            </div>
            <button
              onClick={onCreateNew}
              className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium whitespace-nowrap`}
              style={{
                backgroundColor: color.primary.action,
                color: "white",
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </button>
          </div>
        </div>

        {tempSelectedSegments.length > 0 && (
          <div className="px-6 flex-shrink-0 my-3">
            <div
              className={`${tw.rounded} p-4 border text-sm`}
              style={{
                backgroundColor: `${color.primary.accent}15`,
                borderColor: `${color.primary.accent}40`,
                color: color.primary.accent,
              }}
            >
              <div className="flex items-center justify-between">
                <span>
                  {tempSelectedSegments.length} segment
                  {tempSelectedSegments.length !== 1 ? "s" : ""} selected (
                  {totalSelectedCustomers.toLocaleString()} customers)
                </span>
                <button
                  onClick={() => setTempSelectedSegments([])}
                  className="font-medium hover:opacity-80 transition-opacity"
                  style={{ color: color.primary.accent }}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-gray-500 mt-4">Loading segments...</p>
            </div>
          ) : filteredSegments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No segments found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or create a new segment
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={
                          tempSelectedSegments.length ===
                            filteredSegments.length &&
                          filteredSegments.length > 0
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSelectedSegments(filteredSegments);
                          } else {
                            setTempSelectedSegments([]);
                          }
                        }}
                        className="w-4 h-4 border-gray-400 rounded"
                        style={{
                          accentColor: "#111827",
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Segment Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Customers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSegments.map((segment) => {
                    const isSelected = tempSelectedSegments.some(
                      (s) => s.id === segment.id
                    );

                    return (
                      <tr
                        key={segment.id}
                        onClick={() => handleSegmentToggle(segment)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSegmentToggle(segment)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 border-gray-400 rounded"
                            style={{
                              accentColor: "#111827",
                            }}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {segment.name}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-600 max-w-md line-clamp-2">
                            {segment.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            {segment.customer_count.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">
                            <DateFormatter date={segment.created_at} />
                          </span>
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
        <div className="flex items-center justify-between p-6 border-t border-gray-200 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {tempSelectedSegments.length} of {filteredSegments.length} segments
            selected
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={tempSelectedSegments.length === 0}
              className={`px-5 py-2 ${tw.rounded} text-sm font-medium ${
                tempSelectedSegments.length === 0 ? "cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor:
                  tempSelectedSegments.length > 0
                    ? color.primary.action
                    : color.interactive.disabled,
                color:
                  tempSelectedSegments.length === 0
                    ? color.text.muted
                    : "white",
              }}
            >
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
