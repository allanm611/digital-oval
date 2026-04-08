import { useState } from "react";
import UnifiedPickerModal from "../../segments/components/UnifiedPickerModal";
import { type KPI } from "../types/kpi";

interface KPIPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (kpi: KPI) => void;
  kpis: KPI[];
  category: KPI["category"];
  title: string;
  searchPlaceholder?: string;
  hasSubcategories?: boolean; // Only show category filter if true
  subcategoryOptions?: Array<{ value: string; label: string }>; // Custom subcategory options
}

export default function KPIPickerModal({
  isOpen,
  onClose,
  onSelect,
  kpis,
  category,
  title,
  searchPlaceholder,
  hasSubcategories = false, // Default: no category filter
  subcategoryOptions, // Custom subcategory options
}: KPIPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(category);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Get default subcategory options or use provided ones
  const defaultSubcategoryOptions = [{ value: "all", label: "All" }];

  const finalSubcategoryOptions =
    subcategoryOptions || defaultSubcategoryOptions;

  // Filter KPIs by category, subcategory, and search
  const filteredKPIs = kpis.filter(
    (kpi) =>
      kpi.category === selectedCategory &&
      (selectedSubcategory === "all" ||
        kpi.subcategory === selectedSubcategory) &&
      (kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (kpi.description &&
          kpi.description.toLowerCase().includes(searchTerm.toLowerCase()))),
  );

  const handleSelectKPI = (kpi: KPI) => {
    onSelect(kpi);
  };

  return (
    <UnifiedPickerModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`Choose a ${title.toLowerCase()} to add to your segment condition`}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      searchPlaceholder={
        searchPlaceholder || `Search ${title.toLowerCase()}...`
      }
      filterOptions={hasSubcategories ? finalSubcategoryOptions : undefined}
      filterValue={hasSubcategories ? selectedSubcategory : undefined}
      onFilterChange={hasSubcategories ? setSelectedSubcategory : undefined}
      items={filteredKPIs.map((kpi) => ({
        id: kpi.id,
        title: kpi.name,
        description: kpi.description || "-",
        meta: kpi.subcategory ? `Subcategory: ${kpi.subcategory}` : undefined,
        raw: kpi,
      }))}
      onSelect={(item) => handleSelectKPI(item.raw)}
      emptyTitle="No KPIs found"
      emptyDescription="No KPIs found matching your criteria"
    />
  );
}
