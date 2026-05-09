import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft } from "lucide-react";
import { tw, color, zIndex } from "../../../../shared/utils/utils";
import Checkbox from "../../../../shared/components/ui/Checkbox";
import SearchInput from "../../../../shared/components/ui/SearchInput";
import { seedListService, SeedList, SeedListRecipient } from "../../../../shared/services/seedListService";
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

  // Recipients state
  const [selectedSeedListId, setSelectedSeedListId] = useState<number | null>(null);
  const [recipients, setRecipients] = useState<SeedListRecipient[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSeedListId(null);
      setRecipients([]);
      setSelectedRecipients([]);
      return;
    }

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

  // Fetch recipients when a seedlist is selected
  useEffect(() => {
    if (!selectedSeedListId) {
      setRecipients([]);
      setSelectedRecipients([]);
      return;
    }

    const fetchRecipients = async () => {
      setIsLoadingRecipients(true);
      try {
        const members = await seedListService.getMembers(selectedSeedListId);
        setRecipients(members || []);
        setSelectedRecipients([]);
      } catch (error) {
        console.error("Failed to fetch recipients:", error);
        setRecipients([]);
      } finally {
        setIsLoadingRecipients(false);
      }
    };

    fetchRecipients();
  }, [selectedSeedListId]);

  const handleSelectSeedList = (listId: number) => {
    setSelectedSeedListId(selectedSeedListId === listId ? null : listId);
  };

  const handleToggleRecipient = (recipientId: number) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId)
        ? prev.filter((id) => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSelectAllRecipients = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(recipients.map((r) => r.id));
    }
  };

  const handleSave = () => {
    // Return selected recipients as strings
    const recipientIds = selectedRecipients.map((id) => String(id));
    onSave(segmentId, recipientIds);
  };

  const handleBackToSeedLists = () => {
    setSelectedSeedListId(null);
    setRecipients([]);
    setSelectedRecipients([]);
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
          <div className="flex items-center gap-3 flex-1">
            {selectedSeedListId && (
              <button
                onClick={handleBackToSeedLists}
                className="p-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {selectedSeedListId
                  ? "Select Recipients"
                  : isApplyToAll
                    ? "Select Seed Lists"
                    : "Configure Seed List"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedSeedListId
                  ? `Choose recipients to test from this seed list`
                  : isApplyToAll
                    ? "Choose seed lists to apply to all segments"
                    : "Select seed lists for this segment"}
              </p>
            </div>
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
            placeholder={selectedSeedListId ? "Search recipients..." : "Search seed lists..."}
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {!selectedSeedListId ? (
            // SEEDLISTS VIEW
            isLoading ? (
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
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="seedlist-select"
                          className="w-4 h-4"
                          id="no-selection"
                          checked={selectedSeedListId === null}
                          onChange={() => setSelectedSeedListId(null)}
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
                      Recipients
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
                    const isSelected = selectedSeedListId === list.id;
                    return (
                      <tr
                        key={list.id}
                        onClick={() => handleSelectSeedList(list.id)}
                        className="cursor-pointer transition-colors hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="seedlist-select"
                              className="w-4 h-4"
                              id={`seed-list-${list.id}`}
                              checked={isSelected}
                              onChange={() => handleSelectSeedList(list.id)}
                              onClick={(e) => e.stopPropagation()}
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
                            {list.rows_imported || 0}
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
          )
          ) : (
            // RECIPIENTS VIEW
            isLoadingRecipients ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-gray-500 mt-4">Loading recipients...</p>
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                No recipients found
              </h3>
              <p className="text-gray-600">
                This seed list has no active recipients
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
                        onClick={handleSelectAllRecipients}
                      >
                        <Checkbox
                          id="select-all-recipients"
                          checked={
                            selectedRecipients.length === recipients.length &&
                            recipients.length > 0
                          }
                          onChange={handleSelectAllRecipients}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y"
                  style={{ borderColor: color.border.default }}
                >
                  {recipients
                    .filter((r) =>
                      `${r.customer_name || ''} ${r.customer_email || ''} ${r.customer_phone || ''}`
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase())
                    )
                    .map((recipient) => {
                      const isSelected = selectedRecipients.includes(recipient.id);
                      return (
                        <tr
                          key={recipient.id}
                          onClick={() => handleToggleRecipient(recipient.id)}
                          className="cursor-pointer transition-colors hover:bg-gray-50"
                        >
                          <td className="px-4 py-3">
                            <div
                              className="flex items-center gap-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRecipient(recipient.id);
                              }}
                            >
                              <Checkbox
                                id={`recipient-${recipient.id}`}
                                checked={isSelected}
                                onChange={() => handleToggleRecipient(recipient.id)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {recipient.customer_name || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600">
                              {recipient.customer_email || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600">
                              {recipient.customer_phone || "-"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-600">
                              {recipient.status === "active" ? "Active" : "Inactive"}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedSeedListId
              ? `${selectedRecipients.length} of ${recipients.length} recipients selected`
              : "Select a seed list to continue"}
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
              disabled={!selectedSeedListId || selectedRecipients.length === 0}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                !selectedSeedListId || selectedRecipients.length === 0 ? "cursor-not-allowed" : ""
              }`}
              style={{
                backgroundColor:
                  selectedSeedListId && selectedRecipients.length > 0
                    ? color.primary.action
                    : color.interactive.disabled,
                color:
                  !selectedSeedListId || selectedRecipients.length === 0
                    ? color.text.muted
                    : "white",
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
