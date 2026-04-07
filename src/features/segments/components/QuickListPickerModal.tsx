import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, List, Check, Loader2 } from "lucide-react";
import SearchInput from "../../../shared/components/ui/SearchInput";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import CreateButton from "../../../shared/components/ui/CreateButton";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { quicklistService } from "../../quicklists/services/quicklistService";
import CreateQuickListModal from "../../quicklists/components/CreateQuickListModal";
import type { CreateQuickListRequest } from "../../quicklists/types/quicklist";

// Type pour les QuickLists (simplifié pour la sélection)
interface QuickListItem {
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
  status?: string;
}

interface QuickListPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (quicklist: QuickListItem) => void;
  selectedQuickListId?: number;
}

export default function QuickListPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedQuickListId,
}: QuickListPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // Default to "all" - no filter required
  const [hoveredQuickListId, setHoveredQuickListId] = useState<number | null>(
    null,
  );
  const [quickLists, setQuickLists] = useState<QuickListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadQuickLists();
    }
  }, [isOpen]);

  const loadQuickLists = async () => {
    try {
      setIsLoading(true);
      const response = await quicklistService.getAllQuickLists({
        offset: 0,
        limit: 100,
      });
      if (response.success && response.data) {
        // Map backend response to QuickListItem format and filter only completed quicklists
        const lists = response.data
          .filter((item: any) => item.status === "completed" || item.processing_status === "completed")
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            upload_type: item.processing_status || "multi",
            row_count: item.rows_imported || 0,
            created_at: item.created_at,
            status: item.status || item.processing_status,
          }));
        setQuickLists(lists);
      }
    } catch (err) {
      console.error("Failed to load quicklists:", err);
      setQuickLists([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filterOptions = [
    { value: "all", label: "All Types" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "multi", label: "Multi-Channel" },
  ];

  const filteredQuickLists = quickLists.filter((quicklist) => {
    const matchesSearch =
      quicklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quicklist.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      );

    if (selectedFilter === "all") return matchesSearch;

    return matchesSearch && quicklist.upload_type === selectedFilter;
  });

  const handleQuickListSelect = (quicklist: QuickListItem) => {
    onSelect(quicklist);
    onClose();
  };

  const handleCreateQuickList = async (request: CreateQuickListRequest) => {
    try {
      const response = await quicklistService.createQuickList(request);

      // Extract the actual ID from response (could be id, quicklist_id, or nested in data)
      const quicklistId = response?.id || response?.quicklist_id || response?.data?.id || response?.data?.quicklist_id;

      if (quicklistId) {
        // Reload the list first to get fresh data
        await loadQuickLists();

        // Now select the newly created quicklist
        const newQuickList: QuickListItem = {
          id: quicklistId,
          name: request.name,
          description: request.description || undefined,
          upload_type: "multi",
          row_count: response?.rows_imported || response?.data?.rows_imported || 0,
          created_at: new Date().toISOString(),
        };

        onSelect(newQuickList);
        setShowCreateModal(false);
        onClose();
      } else {
        console.error("No quicklist ID in response:", response);
        throw new Error("Failed to extract quicklist ID from response");
      }
    } catch (err) {
      console.error("Failed to create quicklist:", err);
      throw err;
    }
  };

  const getUploadTypeBadgeColor = (uploadType: string) => {
    switch (uploadType) {
      case "email":
        return { bg: "#F3F4F620", text: color.text.primary };
      case "phone":
        return { bg: "#F3F4F620", text: color.text.primary };
      case "multi":
        return { bg: "#F3F4F620", text: color.text.primary };
      default:
        return { bg: "#F3F4F620", text: color.text.primary };
    }
  };

  return createPortal(
    <>
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
          className={`bg-white ${tw.rounded} w-full max-w-4xl max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-6 border-b flex-shrink-0"
            style={{ borderColor: color.border.default }}
          >
            <div>
              <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
                Select a QuickList
              </h2>
              <p className={`text-sm ${tw.textSecondary} mt-1`}>
                Choose a quicklist to use in this condition
              </p>
            </div>
            <div className="flex items-center gap-2">
              <CreateButton onClick={() => setShowCreateModal(true)} />
              <button
                onClick={onClose}
                className="p-2 transition-colors"
                style={{ color: color.text.secondary }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    color.interactive.hover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="px-6 pt-6 pb-4 space-y-4 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <SearchInput
                placeholder="Search quicklists..."
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

          {/* QuickLists List */}
          <div className="flex-1 overflow-y-auto px-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2
                  className="w-12 h-12 mx-auto mb-4 animate-spin"
                  strokeWidth={1.5}
                  style={{ color: color.text.primary }}
                />
                <p className={tw.textSecondary}>Loading quicklists...</p>
              </div>
            ) : filteredQuickLists.length === 0 ? (
              <div className="text-center py-12">
                <List
                  className="w-12 h-12 mx-auto mb-4"
                  style={{ color: color.text.muted }}
                />
                <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
                  No quicklists found
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
                        QuickList Name
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
                        Rows
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
                    {filteredQuickLists.map((quicklist) => {
                      const isSelected = selectedQuickListId === quicklist.id;
                      const isHovered = hoveredQuickListId === quicklist.id;
                      const badgeColor = getUploadTypeBadgeColor(
                        quicklist.upload_type,
                      );

                      return (
                        <tr
                          key={quicklist.id}
                          onClick={() => handleQuickListSelect(quicklist)}
                          onMouseEnter={() =>
                            setHoveredQuickListId(quicklist.id)
                          }
                          onMouseLeave={() => setHoveredQuickListId(null)}
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
                                  <Check className={`w-3 h-3 `} />
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
                            <div
                              className={`text-sm font-medium ${tw.textPrimary}`}
                            >
                              {quicklist.name}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div
                              className={`text-sm max-w-md line-clamp-2 ${tw.textSecondary}`}
                            >
                              {quicklist.description || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium capitalize"
                              style={{
                                backgroundColor: badgeColor.bg,
                                color: badgeColor.text,
                              }}
                            >
                              {quicklist.upload_type}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${tw.textPrimary}`}
                            >
                              {quicklist.row_count?.toLocaleString() || 0}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`text-sm ${tw.textSecondary}`}>
                              {new Date(
                                quicklist.created_at,
                              ).toLocaleDateString()}
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
          <div
            className="flex items-center justify-end p-6 border-t flex-shrink-0"
            style={{ borderColor: color.border.default }}
          >
            <button
              onClick={onClose}
              className={`px-4 py-2 border ${tw.rounded} text-sm font-medium transition-colors`}
              style={{
                borderColor: color.border.default,
                color: color.text.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = color.interactive.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Create QuickList Modal */}
      {showCreateModal && (
        <CreateQuickListModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateQuickList}
        />
      )}
    </>,
    document.body,
  );
}
