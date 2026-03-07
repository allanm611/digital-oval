import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { segmentService } from "../services/segmentService";
import { SegmentType } from "../types/segment";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

interface SegmentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (segment: SegmentType) => void;
  selectedSegmentId?: number;
}

export default function SegmentPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedSegmentId,
}: SegmentPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [segments, setSegments] = useState<SegmentType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredSegmentId, setHoveredSegmentId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalSegments, setTotalSegments] = useState(0);

  const filterOptions = [
    { value: "all", label: "All Segments" },
    { value: "static", label: "Static" },
    { value: "dynamic", label: "Dynamic" },
    { value: "trigger", label: "Trigger" },
  ];

  // Load segments from backend with pagination
  useEffect(() => {
    const loadSegments = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const response = await segmentService.getSegments({
            search: searchTerm || undefined,
            type: selectedFilter !== "all" ? (selectedFilter as "static" | "dynamic" | "trigger") : undefined,
            offset: (currentPage - 1) * pageSize,
            limit: pageSize,
            skipCache: false,
          });
          setSegments(response.data || []);
          setTotalSegments(response.pagination?.total || 0);
        } catch (error) {
          console.error("Failed to load segments:", error);
          setSegments([]);
          setTotalSegments(0);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSegments();
  }, [isOpen, currentPage, pageSize, searchTerm, selectedFilter]);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter]);

  if (!isOpen) return null;

  const handleSegmentSelect = (segment: SegmentType) => {
    onSelect(segment);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        zIndex: zIndex.modal,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
      }}
    >
      <div
        className={`${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: color.surface.background }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select a Segment
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a segment to use in this condition
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors text-lg font-medium"
          >
            ✕
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 pt-6 pb-4 space-y-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search segments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-2 border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
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
                  placeholder="Filter by type"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Segments List */}
        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-gray-500 mt-4">Loading segments...</p>
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No segments found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}>
                <thead style={{ background: color.surface.tableHeader }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Segment Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider" style={{ color: color.surface.tableHeaderText }}>
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-24" style={{ color: color.surface.tableHeaderText }}>
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-32" style={{ color: color.surface.tableHeaderText }}>
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-32" style={{ color: color.surface.tableHeaderText }}>
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((segment) => {
                    const isSelected = selectedSegmentId === segment.id;

                    return (
                      <tr
                        key={segment.id}
                        onClick={() => handleSegmentSelect(segment)}
                        onMouseEnter={() => setHoveredSegmentId(segment.id)}
                        onMouseLeave={() => setHoveredSegmentId(null)}
                        className="cursor-pointer transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? `${color.primary.accent}15`
                            : "transparent",
                        }}
                      >
                        <td
                          className="px-6 py-4 text-sm text-black"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <div className="truncate">
                            {segment.name}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-black"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          <div className="max-w-md line-clamp-2">
                            {segment.description || "-"}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-black"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {segment.type || "Static"}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-black"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {segment.size_estimate
                            ? segment.size_estimate.toLocaleString()
                            : "-"}
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap text-sm text-black"
                          style={{ backgroundColor: color.surface.tablebodybg }}
                        >
                          {segment.created_at
                            ? new Date(
                                segment.created_at
                              ).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination Controls */}
              {totalSegments > pageSize && (
                <div className="flex items-center justify-between gap-4 mt-4 px-6 py-3 border-t border-gray-200">
                  <span className="text-xs text-gray-600">
                    Showing{" "}
                    <strong>
                      {(currentPage - 1) * pageSize + 1}-
                      {Math.min(currentPage * pageSize, totalSegments)}
                    </strong>{" "}
                    of <strong>{totalSegments}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      style={{ borderColor: "#d1d5db" }}
                      title="Previous page"
                    >
                      ←
                    </button>
                    <span className="text-xs text-gray-600 min-w-[40px] text-center">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage * pageSize >= totalSegments}
                      className="px-3 py-2 rounded border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      style={{ borderColor: "#d1d5db" }}
                      title="Next page"
                    >
                      →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className={`px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-colors`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
