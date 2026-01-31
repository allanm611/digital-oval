import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import {
  SYSTEM_EVENTS,
  SYSTEM_EVENT_CATEGORIES,
  type SystemEvent,
} from "../../kpis/types/systemEvent";

interface SystemEventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: SystemEvent) => void;
}

export default function SystemEventPickerModal({
  isOpen,
  onClose,
  onSelect,
}: SystemEventPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Filter events based on search and category
  const filteredEvents = SYSTEM_EVENTS.filter((event) => {
    const matchesSearch =
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || event.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  const handleSelectEvent = (event: SystemEvent) => {
    onSelect(event);
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
        className={`bg-white ${tw.rounded} shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Select System Event
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose a business/system event to add to your segment condition
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 space-y-3">
          {/* Search and Category Filter - Side by side */}
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border text-sm ${tw.rounded} focus:outline-none focus:ring-2`}
                style={{
                  borderColor: color.border.default,
                }}
              />
            </div>

            {/* Category Filter - HeadlessSelect */}
            <div className="min-w-[160px]">
              <HeadlessSelect
                options={[
                  { value: "all", label: "All Events" },
                  ...SYSTEM_EVENT_CATEGORIES.map((cat) => ({
                    value: cat.value,
                    label: cat.label,
                  })),
                ]}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value as string)}
                placeholder="Filter by..."
                className="text-sm"
                zIndex={zIndex.popover}
              />
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-8">
              <p className={tw.textSecondary}>
                No events found matching your criteria
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredEvents.map((event) => {
                return (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className={`w-full p-3 ${tw.rounded} border transition-all text-left hover:border-gray-400`}
                    style={{
                      backgroundColor: color.surface.background,
                      borderColor: color.border.default,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h3 className={`text-sm font-medium ${tw.textPrimary}`}>
                          {event.event_name}
                        </h3>
                        <p className={`text-xs ${tw.textSecondary} mt-1.5`}>
                          {event.event_description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm ${tw.rounded} border font-medium transition-all`}
            style={{ borderColor: color.border.default, color: tw.textPrimary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
