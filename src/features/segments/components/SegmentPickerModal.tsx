import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Users, Check, Loader2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { segmentService } from "../services/segmentService";
import { segmentTypeService } from "../services/segmentTypeService";
import { SegmentType } from "../types/segment";

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
  const [segmentTypes, setSegmentTypes] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const loadSegmentTypes = async () => {
      try {
        const response = await segmentTypeService.getAllSegmentTypes();
        if (response.data) {
          setSegmentTypes(response.data);
        }
      } catch (error) {
        setSegmentTypes([
          { id: 1, name: "Static" },
          { id: 2, name: "Dynamic" },
          { id: 3, name: "Trigger" },
        ]);
      }
    };

    loadSegmentTypes();
  }, []);

  const filterOptions = [
    { value: "all", label: "All Segments" },
    ...segmentTypes.map((type) => ({
      value: type.name.toLowerCase(),
      label: type.name,
    })),
  ];

  // Load segments from backend
  useEffect(() => {
    const loadSegments = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          // Use search endpoint if user has typed search term, otherwise use get all
          let response;
          if (searchTerm.trim()) {
            response = await segmentService.searchSegments({
              q: searchTerm,
              type:
                selectedFilter !== "all"
                  ? (selectedFilter as string)
                  : undefined,
              skipCache: true,
            });
          } else {
            response = await segmentService.getSegments({
              type:
                selectedFilter !== "all"
                  ? (selectedFilter as string)
                  : undefined,
              skipCache: true,
            });
          }
          setSegments(response.data || []);
        } catch (error) {
          console.error("Failed to load segments:", error);
          setSegments([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSegments();
  }, [isOpen, searchTerm, selectedFilter]);

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
      onClick={onClose}
    >
      <div
        className={`${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
        style={{ backgroundColor: color.surface.background }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b flex-shrink-0"
          style={{ borderColor: color.border.default }}
        >
          <div>
            <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
              Select a Segment
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose a segment to use in this condition
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ color: color.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = color.interactive.hover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter */}
        <div className="px-6 pt-6 pb-4 space-y-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <SearchInput
              placeholder="Search segments..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
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
            <div className="text-center py-12">
              <Loader2
                className="w-12 h-12 mx-auto mb-4 animate-spin"
                strokeWidth={1.5}
                style={{ color: color.text.primary }}
              />
              <p className={tw.textSecondary}>Loading segments...</p>
            </div>
          ) : segments.length === 0 ? (
            <div className="text-center py-12">
              <Users
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: color.text.muted }}
              />
              <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                No segments found
              </h3>
              <p className={tw.textSecondary}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className="sticky top-0 z-10"
                  style={{ backgroundColor: color.surface.tableHeader }}
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-20"
                      style={{ color: color.text.secondary }}
                    >
                      Select
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary }}
                    >
                      Segment Name
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary }}
                    >
                      Description
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32"
                      style={{ color: color.text.secondary }}
                    >
                      Type
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-24"
                      style={{ color: color.text.secondary }}
                    >
                      Size
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32"
                      style={{ color: color.text.secondary }}
                    >
                      Created Date
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="divide-y"
                  style={{ borderColor: color.border.muted }}
                >
                  {segments.map((segment) => {
                    const isSelected = selectedSegmentId === segment.id;
                    const isHovered = hoveredSegmentId === segment.id;

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
                            : isHovered
                              ? color.interactive.hover
                              : "white",
                        }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            {isSelected ? (
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center"
                                style={{
                                  backgroundColor: color.primary.action,
                                }}
                              >
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div
                                className="w-5 h-5 rounded border-2"
                                style={{
                                  borderColor: color.border.default,
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className={`text-sm font-medium ${tw.textPrimary}`}>
                            {segment.name}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div
                            className={`text-sm max-w-md line-clamp-2 ${tw.textSecondary}`}
                          >
                            {segment.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${tw.textPrimary}`}>
                            {segment.type || "Static"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${tw.textPrimary}`}>
                            {segment.size_estimate
                              ? segment.size_estimate.toLocaleString()
                              : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`text-sm ${tw.textSecondary}`}>
                            {segment.created_at
                              ? new Date(segment.created_at).toLocaleDateString()
                              : "-"}
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
      </div>
    </div>,
    document.body
  );
}
