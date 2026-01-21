import { useEffect, useRef, useState } from "react";
import {
  X,
  Search,
  Mail,
  MessageSquare,
  Bell,
  MessageCircle,
  Zap,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import {
  SYSTEM_EVENTS,
  SYSTEM_EVENT_CHANNELS,
  type SystemEvent,
} from "../types/systemEvent";

interface SystemEventPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (event: SystemEvent) => void;
}

const channelIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  email: Mail,
  sms: MessageSquare,
  push: Bell,
  in_app: MessageCircle,
  other: Zap,
};

export default function SystemEventPickerModal({
  isOpen,
  onClose,
  onSelect,
}: SystemEventPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter events based on search and channel
  const filteredEvents = SYSTEM_EVENTS.filter((event) => {
    const matchesSearch =
      event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.event_description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesChannel =
      selectedChannel === "all" || event.channel === selectedChannel;

    return matchesSearch && matchesChannel;
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectEvent = (event: SystemEvent) => {
    onSelect(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className={`bg-white ${tw.rounded} shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: color.border.default }}
        >
          <div>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Select Communication Event
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose an event to add to your segment condition
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
        <div
          className="px-6 py-4 border-b space-y-4"
          style={{ borderColor: color.border.default }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border ${tw.rounded} focus:outline-none focus:ring-2`}
              style={{
                borderColor: color.border.default,
              }}
            />
          </div>

          {/* Channel Filter */}
          <div>
            <label
              className={`text-sm font-medium ${tw.textPrimary} mb-2 block`}
            >
              Filter by Channel
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedChannel("all")}
                className={`px-3 py-2 ${tw.rounded} text-sm font-medium transition-all ${
                  selectedChannel === "all"
                    ? `text-white`
                    : `${tw.textSecondary} border`
                }`}
                style={{
                  backgroundColor:
                    selectedChannel === "all"
                      ? color.primary.action
                      : "transparent",
                  borderColor:
                    selectedChannel === "all"
                      ? "transparent"
                      : color.border.default,
                }}
              >
                All Events
              </button>
              {SYSTEM_EVENT_CHANNELS.map((channel) => (
                <button
                  key={channel.value}
                  onClick={() => setSelectedChannel(channel.value)}
                  className={`px-3 py-2 ${tw.rounded} text-sm font-medium transition-all ${
                    selectedChannel === channel.value
                      ? `text-white`
                      : `${tw.textSecondary} border`
                  }`}
                  style={{
                    backgroundColor:
                      selectedChannel === channel.value
                        ? color.primary.action
                        : "transparent",
                    borderColor:
                      selectedChannel === channel.value
                        ? "transparent"
                        : color.border.default,
                  }}
                >
                  {channel.label}
                </button>
              ))}
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
                // Map channel to icon, with fallback for 'all' channel
                const iconKey =
                  event.channel === "all" ? "other" : event.channel || "other";
                const IconComponent =
                  channelIcons[iconKey as keyof typeof channelIcons] || Zap;
                return (
                  <button
                    key={event.id}
                    onClick={() => handleSelectEvent(event)}
                    className={`w-full p-3 ${tw.rounded} border transition-all text-left`}
                    style={{
                      backgroundColor: color.surface.background,
                      borderColor: color.border.default,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1">
                        <IconComponent className="w-5 h-5 flex-shrink-0" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${tw.textPrimary}`}>
                          {event.event_name}
                        </h3>
                        <p className={`text-sm ${tw.textSecondary} mt-1`}>
                          {event.event_description}
                        </p>
                        <p className={`text-xs ${tw.textSecondary} mt-1`}>
                          {event.event_code}
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
        <div
          className="px-6 py-4 border-t flex items-center justify-between"
          style={{ borderColor: color.border.default }}
        >
          <p className={`text-sm ${tw.textSecondary}`}>
            {filteredEvents.length} event
            {filteredEvents.length !== 1 ? "s" : ""} available
          </p>
          <button
            onClick={onClose}
            className={`px-4 py-2 ${tw.rounded} border font-medium transition-all`}
            style={{ borderColor: color.border.default, color: tw.textPrimary }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
