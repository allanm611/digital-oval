import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { tw, color, zIndex, getButtonStyles, button } from "../utils/utils";
import Checkbox from "./ui/Checkbox";
import SearchInput from "./ui/SearchInput";
import HeadlessSelect from "./ui/HeadlessSelect";
import { seedListService, SeedList, SeedListRecipient } from "../services/seedListService";
import LoadingSpinner from "./ui/LoadingSpinner";

interface SeedListRecipientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId: string;
  selectedSeedLists: string[];
  onSave: (segmentId: string, recipients: SeedListRecipient[]) => void;
}

export default function SeedListRecipientsModal({
  isOpen,
  onClose,
  segmentId,
  selectedSeedLists,
  onSave,
}: SeedListRecipientsModalProps) {
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
        // Auto-select first seedlist
        if (seedLists && seedLists.length > 0) {
          setSelectedSeedListId(seedLists[0].id);
        }
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
    setSelectedSeedListId(listId);
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
    // Return actual recipient objects
    const selectedRecipientObjects = recipients.filter((r) =>
      selectedRecipients.includes(r.id)
    );
    onSave(segmentId, selectedRecipientObjects);
  };

  if (!isOpen) return null;

  const currentSeedList = availableSeedLists.find((sl) => sl.id === selectedSeedListId);
  const filteredRecipients = recipients.filter((r) =>
    `${r.customer_name || ''} ${r.customer_email || ''} ${r.customer_phone || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

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
              Select Recipients
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Choose recipients from your seed list to test
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seedlist Selector */}
        {!isLoading && (
          <div className="px-6 pt-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <label className="text-sm font-medium text-gray-900 block mb-2">
              Seed List
            </label>
            <HeadlessSelect
              value={selectedSeedListId?.toString() || ""}
              onChange={(value) => handleSelectSeedList(Number(value))}
              options={availableSeedLists.map((list) => ({
                value: list.id.toString(),
                label: `${list.name} (${list.rows_imported || 0} recipients)`,
              }))}
              placeholder="Select a seed list"
              zIndex={zIndex.popover}
            />
          </div>
        )}

        {/* Search Bar */}
        <div className="px-6 pt-4 pb-4 flex-shrink-0">
          <SearchInput
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {/* Recipients List */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm text-gray-500 mt-4">Loading seed lists...</p>
            </div>
          ) : isLoadingRecipients ? (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner variant="modern" size="lg" color="primary" />
              <p className="text-sm text-gray-500 mt-4">Loading recipients...</p>
            </div>
          ) : recipients.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-black mb-2">
                No recipients found
              </h3>
              <p className="text-sm text-gray-600">
                {currentSeedList?.name ? `${currentSeedList.name} has no active recipients` : "Select a seed list to view recipients"}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-12">
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider w-20">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody
                  className="bg-white divide-y"
                  style={{ borderColor: color.border.default }}
                >
                  {filteredRecipients.map((recipient) => {
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
                          <p className="text-sm text-gray-600 truncate">
                            {recipient.customer_email || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">
                            {recipient.customer_phone || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">
                            {recipient.status === "active" ? "Active" : "Inactive"}
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
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="text-sm text-gray-600">
            {selectedRecipients.length} of {recipients.length} recipients selected
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
              disabled={selectedRecipients.length === 0}
              style={{
                ...getButtonStyles(button.action),
                opacity: selectedRecipients.length === 0 ? 0.5 : 1,
                cursor: selectedRecipients.length === 0 ? "not-allowed" : "pointer",
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
