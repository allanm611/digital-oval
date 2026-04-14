import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { tw, color, zIndex } from "../../../../shared/utils/utils";
import Checkbox from "../../../../shared/components/ui/Checkbox";

interface SeedListConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentId: string;
  selectedSeedLists: string[];
  onSave: (segmentId: string, seedListIds: string[]) => void;
}

const AVAILABLE_SEED_LISTS = [
  { id: "marketing-staff", name: "Marketing Staff" },
  { id: "sales-staff", name: "Sales Staff" },
  { id: "support-staff", name: "Support Staff" },
  { id: "finance-staff", name: "Finance Staff" },
];

export default function SeedListConfigModal({
  isOpen,
  onClose,
  segmentId,
  selectedSeedLists,
  onSave,
}: SeedListConfigModalProps) {
  const [selected, setSelected] = useState<string[]>(selectedSeedLists);

  const handleToggle = (listId: string) => {
    setSelected((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const handleSave = () => {
    onSave(segmentId, selected);
  };

  const isApplyToAll = segmentId === "all";

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed bg-black bg-opacity-50 flex items-center justify-center"
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
        className={`bg-white ${tw.rounded} max-w-md w-full mx-4 border border-gray-300`}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
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

        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {AVAILABLE_SEED_LISTS.map((list) => (
            <div
              key={list.id}
              className="flex items-center gap-3 cursor-pointer p-3 rounded hover:bg-gray-50"
              onClick={() => handleToggle(list.id)}
            >
              <Checkbox
                id={`seed-list-${list.id}`}
                checked={selected.includes(list.id)}
                onChange={() => handleToggle(list.id)}
              />
              <span className="text-sm font-medium text-gray-900">
                {list.name}
              </span>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white rounded transition-colors"
            style={{ backgroundColor: color.primary.accent }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
