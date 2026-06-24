import { useState, useMemo, useEffect } from "react";
import UnifiedPickerModal from "./UnifiedPickerModal";

interface FieldOption {
  value: string;
  label: string;
  description?: string;
  type?: string;
  subcategory?: string;
  subcategory_id?: number;
}

interface FieldPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (field: FieldOption) => void;
  fields: FieldOption[];
  categoryName?: string;
  selectedValue?: string;
  isAllMode?: boolean;
}

export default function FieldPickerModal({
  isOpen,
  onClose,
  onSelect,
  fields,
  categoryName = "Field",
  selectedValue,
  isAllMode = false,
}: FieldPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");

  useEffect(() => {
    if (isOpen && isAllMode) {
      setSelectedSubcategory("");
    }
  }, [isOpen, isAllMode]);

  const subcategoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const options: string[] = [];
    fields.forEach((field) => {
      if (field.subcategory && !seen.has(field.subcategory)) {
        seen.add(field.subcategory);
        options.push(field.subcategory);
      }
    });
    return options.sort();
  }, [fields]);

  const filteredFields = useMemo(() => {
    return (fields || []).filter((field) => {
      const matchesSearch =
        (field.label || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (field.value || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubcategory = !selectedSubcategory || field.subcategory === selectedSubcategory;
      return matchesSearch && matchesSubcategory;
    });
  }, [fields, searchTerm, selectedSubcategory]);

  if (!isOpen) return null;

  const handleSelectField = (fieldData: FieldOption) => {
    onSelect(fieldData);
  };

  // Build filter options when in "All" mode
  const filterOptions = isAllMode && subcategoryOptions.length > 0
    ? [{ value: "", label: "All" }, ...subcategoryOptions.map((subcat) => ({ value: subcat, label: subcat }))]
    : undefined;

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
        raw: field,
      }))}
      onSelect={(item) => handleSelectField(item.raw)}
      selectedId={selectedValue}
      emptyTitle="No fields found"
      emptyDescription="Try adjusting your search or filter"
      filterOptions={filterOptions}
      filterValue={selectedSubcategory}
      onFilterChange={(value) => setSelectedSubcategory(value)}
    />
  );
}
