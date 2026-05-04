import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { tw, color, zIndex } from "../../../../shared/utils/utils";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import { seedListService, SeedList } from "../../../../shared/services/seedListService";
import LoadingSpinner from "../../../../shared/components/ui/LoadingSpinner";

interface SeedListConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId: string;
  selectedSeedLists: string[];
  onSave: (segmentId: string, seedListIds: string[]) => void;
}

export default function SeedListConfigModal({
  isOpen,
  onClose,
  segmentId,
  selectedSeedLists,
  onSave,
}: SeedListConfigModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedSeedLists);
  const [availableSeedLists, setAvailableSeedLists] = useState<SeedList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchSeedLists = async () => {
      setIsLoading(true);
      try {
        const seedLists = await seedListService.getAll();
        setAvailableSeedLists(seedLists || []);
      } catch (error) {
        console.error("Failed to fetch seed lists:", error);
        setAvailableSeedLists([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeedLists();
  }, [isOpen]);

  const handleToggle = (listId: string) => {
    setSelected((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSelectAll = () => {
    if (selected.length === filteredSeedLists.length) {
      setSelected([]);
    } else {
      setSelected(filteredSeedLists.map((list) => String(list.id)));
    }
  };

  const handleSave = () => {
    onSave(segmentId, selected);
  };

  const isApplyToAll = segmentId === "all";

  const filteredSeedLists = availableSeedLists.filter((list) =>
    (list.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusText = (status?: string) => {
    if (!status) return "-";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: zIndex.modal,
      }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              {isApplyToAll ? "Select Seed Lists" : "Configure Seed List"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {isApplyToAll
                ? "Choose seed lists to apply to all segments"
                : "Select seed lists for this segment"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 pt-6 flex-shrink-0 pb-4">
          <SearchInput
            placeholder="Search seed lists..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-gray-500 mt-4">Loading seed lists...</p>
            </div>
          ) : filteredSeedLists.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                No seed lists found
              </h3>
              <p className="text-gray-600">
                {searchTerm ? "Try adjusting your search" : "No seed lists available"}
              </p>
            </div>
          ) : (
            <div
              className={`border ${tw.rounded} overflow-hidden`}
              style={{ borderColor: color.border.default }}
            >
              <table
                className="min-w-full divide-y"
                style={{ borderColor: color.border.default }}
              >
                <thead style={{ backgroundColor: color.surface.cards }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      <div
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={handleSelectAll}
                      >
                        <Checkbox
                          id="select-all-seedlists"
                          checked={
                            selected.length === filteredSeedLists.length &&
                            filteredSeedLists.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seed List Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y"
                  style={{ borderColor: color.border.default }}
                >
                  {filteredSeedLists.map((list) => {
                    const isSelected = selected.includes(String(list.id));
                    return (
                      <tr
                        key={list.id}
                        onClick={() => handleToggle(String(list.id))}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggle(String(list.id));
                            }}
                          >
                            <Checkbox
                              id={`seed-list-${list.id}`}
                              checked={isSelected}
                              onChange={() => handleToggle(String(list.id))}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">
                            {list.name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {list.description || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {getStatusText(list.processing_status)}
                          </div>
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selected.length} of {filteredSeedLists.length} seed lists selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selected.length === 0}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                selected.length === 0 ? "cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor:
                  selected.length > 0
                    ? color.primary.action
                    : color.interactive.disabled,
                color: selected.length === 0 ? color.text.muted : "white",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
