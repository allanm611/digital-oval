import { useState } from "react";
import UnifiedPickerModal from "./UnifiedPickerModal";
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

  const handleSelectEvent = (event: SystemEvent) => {
    onSelect(event);
  };

  return (
    <UnifiedPickerModal
      isOpen={isOpen}
      onClose={onClose}
      title="Select System Event"
      subtitle="Choose a business/system event to add to your segment condition"
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      searchPlaceholder="Search events..."
      filterOptions={[
        { value: "all", label: "All Events" },
        ...SYSTEM_EVENT_CATEGORIES.map((cat) => ({
          value: cat.value,
          label: cat.label,
        })),
      ]}
      filterValue={selectedCategory}
      onFilterChange={setSelectedCategory}
      items={filteredEvents.map((event) => ({
        id: event.id,
        title: event.event_name,
        description: event.event_description,
        raw: event,
      }))}
      onSelect={(item) => handleSelectEvent(item.raw)}
      emptyTitle="No events found"
      emptyDescription="No events found matching your criteria"
    />
  );
}
