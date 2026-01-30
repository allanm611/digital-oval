import { useEffect, useRef, useState } from "react";
import { X, Search } from "lucide-react";
import { dummyKPIs, DummyKPI } from "../types/dummyData";

interface KPIPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (kpi: DummyKPI) => void;
  category: DummyKPI["category"];
  title: string;
  searchPlaceholder?: string;
}

export default function KPIPickerModal({
  isOpen,
  onClose,
  onSelect,
  category,
  title,
  searchPlaceholder,
}: KPIPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  // Filter KPIs by category and search
  const filteredKPIs = dummyKPIs.filter(
    (kpi) =>
      kpi.category === category &&
      (kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  const handleSelectKPI = (kpi: DummyKPI) => {
    onSelect(kpi);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a {title.toLowerCase()} to add to your segment condition
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={searchPlaceholder || `Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded focus:outline-none focus:ring-2"
            />
          </div>
        </div>
        {/* KPI List */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {filteredKPIs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No KPIs found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredKPIs.map((kpi) => (
                <button
                  key={kpi.id}
                  onClick={() => handleSelectKPI(kpi)}
                  className="w-full p-3 rounded border transition-all text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-medium">{kpi.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{kpi.description}</p>
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
            className="px-4 py-2 rounded border font-medium transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
