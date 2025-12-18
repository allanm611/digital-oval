import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, List, Check } from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";

// Type pour les QuickLists (simplifié pour la sélection)
interface QuickListItem {
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
}

interface QuickListPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (quicklist: QuickListItem) => void;
  selectedQuickListId?: number;
}

// Données mockées pour les QuickLists (en attendant le backend)
export const MOCK_QUICKLISTS: QuickListItem[] = [
  {
    id: 1,
    name: "Campaign Oct 2024 - Email List",
    description: "Email addresses for October campaign",
    upload_type: "email",
    row_count: 15230,
    created_at: "2024-10-15T10:30:00Z",
  },
  {
    id: 2,
    name: "VIP Customers - Mobile",
    description: "Mobile numbers of VIP customers",
    upload_type: "phone",
    row_count: 8542,
    created_at: "2024-10-20T14:15:00Z",
  },
  {
    id: 3,
    name: "Promo Subscribers Q4",
    description: "Subscribers who opted in for Q4 promotions",
    upload_type: "email",
    row_count: 22104,
    created_at: "2024-11-01T09:00:00Z",
  },
  {
    id: 4,
    name: "New Year Campaign - SMS",
    description: "Phone numbers for New Year SMS campaign",
    upload_type: "phone",
    row_count: 12876,
    created_at: "2024-11-10T16:45:00Z",
  },
  {
    id: 5,
    name: "Black Friday - All Channels",
    description: "Combined list for Black Friday campaign",
    upload_type: "multi",
    row_count: 31450,
    created_at: "2024-11-15T08:20:00Z",
  },
  {
    id: 6,
    name: "Abandoned Cart Recovery",
    description: "Customers with abandoned carts",
    upload_type: "email",
    row_count: 5628,
    created_at: "2024-11-18T11:30:00Z",
  },
  {
    id: 7,
    name: "Loyalty Program Members",
    description: "All active loyalty program members",
    upload_type: "multi",
    row_count: 18934,
    created_at: "2024-11-19T13:00:00Z",
  },
];

export default function QuickListPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedQuickListId,
}: QuickListPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [hoveredQuickListId, setHoveredQuickListId] = useState<number | null>(
    null
  );

  if (!isOpen) return null;

  const filterOptions = [
    { value: "all", label: "All Types" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "multi", label: "Multi-Channel" },
  ];

  const filteredQuickLists = MOCK_QUICKLISTS.filter((quicklist) => {
    const matchesSearch =
      quicklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quicklist.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );

    if (selectedFilter === "all") return matchesSearch;

    return matchesSearch && quicklist.upload_type === selectedFilter;
  });

  const handleQuickListSelect = (quicklist: QuickListItem) => {
    onSelect(quicklist);
    onClose();
  };

  const getUploadTypeBadgeColor = (uploadType: string) => {
    switch (uploadType) {
      case "email":
        return { bg: "#3B82F620", text: "#3B82F6" };
      case "phone":
        return { bg: "#10B98120", text: "#10B981" };
      case "multi":
        return { bg: "#8B5CF620", text: "#8B5CF6" };
      default:
        return { bg: `${color.primary.accent}20`, text: color.primary.accent };
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
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: color.text.muted }}
                />
                <input
                  type="text"
                  placeholder="Search quicklists..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 border ${tw.rounded} focus:outline-none focus:ring-2 text-sm`}
                  style={{
                    borderColor: color.border.default,
                    color: color.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = color.primary.accent;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = color.border.default;
                  }}
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

          {/* QuickLists List */}
          <div className="flex-1 overflow-y-auto px-6">
            {filteredQuickLists.length === 0 ? (
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
                        quicklist.upload_type
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
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
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
                                quicklist.created_at
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
    </>,
    document.body
  );
}
