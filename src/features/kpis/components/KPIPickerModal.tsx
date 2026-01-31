import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Search } from "lucide-react";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { type KPI } from "../types/kpi";

interface KPIPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (kpi: KPI) => void;
  kpis: KPI[];
  category: KPI["category"];
  title: string;
  searchPlaceholder?: string;
  hasSubcategories?: boolean;  // Only show category filter if true
  subcategoryOptions?: Array<{ value: string; label: string }>;  // Custom subcategory options
}

export default function KPIPickerModal({
  isOpen,
  onClose,
  onSelect,
  kpis,
  category,
  title,
  searchPlaceholder,
  hasSubcategories = false,  // Default: no category filter
  subcategoryOptions,  // Custom subcategory options
}: KPIPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(category);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("all");

  // Get default subcategory options or use provided ones
  const defaultSubcategoryOptions = [
    { value: "all", label: "All" },
  ];

  const finalSubcategoryOptions = subcategoryOptions || defaultSubcategoryOptions;

  // Filter KPIs by category, subcategory, and search
  const filteredKPIs = kpis.filter(
    (kpi) =>
      kpi.category === selectedCategory &&
      (selectedSubcategory === "all" || kpi.subcategory === selectedSubcategory) &&
      (kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  const handleSelectKPI = (kpi: DummyKPI) => {
    onSelect(kpi);
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
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>{title}</h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose a {title.toLowerCase()} to add to your segment condition
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
          {/* Search and Category Filter - Side by side (or search only) */}
          <div className={`flex gap-3 ${hasSubcategories ? "flex-row" : "flex-row"}`}>
            {/* Search */}
            <div className={`relative ${hasSubcategories ? "flex-1" : "w-full"}`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border text-sm ${tw.rounded} focus:outline-none focus:ring-2`}
                style={{
                  borderColor: color.border.default,
                }}
              />
            </div>

            {/* Subcategory Filter - Only show if hasSubcategories is true */}
            {hasSubcategories && (
              <div className="min-w-[160px]">
                <HeadlessSelect
                  options={finalSubcategoryOptions}
                  value={selectedSubcategory}
                  onChange={(value) => setSelectedSubcategory(value as string)}
                  placeholder="Filter by..."
                  className="text-sm"
                  zIndex={zIndex.popover}
                />
              </div>
            )}
          </div>
        </div>

        {/* KPI List */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {filteredKPIs.length === 0 ? (
            <div className="text-center py-8">
              <p className={tw.textSecondary}>
                No KPIs found matching your criteria
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredKPIs.map((kpi) => (
                <button
                  key={kpi.id}
                  onClick={() => handleSelectKPI(kpi)}
                  className={`w-full p-3 ${tw.rounded} border transition-all text-left hover:border-gray-400`}
                  style={{
                    backgroundColor: color.surface.background,
                    borderColor: color.border.default,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${tw.textPrimary}`}>
                        {kpi.name}
                      </h3>
                      <p className={`text-xs ${tw.textSecondary} mt-1.5`}>
                        {kpi.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
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
