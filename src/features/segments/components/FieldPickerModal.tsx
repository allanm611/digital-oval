import { useState } from "react";
import UnifiedPickerModal from "./UnifiedPickerModal";

interface FieldOption {
  value: string;
  label: string;
  description?: string;
  type?: string;
}

interface FieldPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  fields: FieldOption[];
  categoryName?: string;
  selectedValue?: string;
}

export default function FieldPickerModal({
  isOpen,
  onClose,
  onSelect,
  fields,
  categoryName = "Field",
  selectedValue,
}: FieldPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFields = fields.filter(
    (field) =>
      (field.label || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (field.value || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  const handleSelectField = (value: string) => {
    onSelect(value);
  };

  return (
    <UnifiedPickerModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Select ${categoryName}`}
      subtitle={`Choose a field from ${categoryName}`}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      searchPlaceholder="Search fields..."
      items={filteredFields.map((field) => ({
        id: field.value,
        title: field.label || "-",
        description: field.description || "-",
        meta: `Value: ${field.value || "-"}${field.type ? ` | Type: ${field.type}` : ""}`,
        raw: field,
      }))}
      onSelect={(item) => handleSelectField(item.raw.value)}
      selectedId={selectedValue}
      emptyTitle="No fields found"
      emptyDescription="Try adjusting your search"
    />
  );
}
