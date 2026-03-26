import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Search, Check } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";

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

  const filteredFields = fields.filter((field) =>
    (field.label || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (field.value || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  const handleSelectField = (value: string) => {
    onSelect(value);
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
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-200">
          <div>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Select {categoryName}
            </h2>
            <p className={`text-sm ${tw.textSecondary} mt-1`}>
              Choose a field from {categoryName}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className={`w-full pl-10 pr-4 py-2 border text-sm ${tw.rounded} focus:outline-none focus:ring-2`}
              style={{
                borderColor: color.border.default,
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {filteredFields.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className="sticky top-0 z-10 bg-gray-50"
                  style={{ backgroundColor: color.surface.tableHeader || "#f9fafb" }}
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-16"
                      style={{ color: color.text.secondary || "#6b7280" }}
                    >
                      Select
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary || "#6b7280" }}
                    >
                      Field Name
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary || "#6b7280" }}
                    >
                      Value
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: color.text.secondary || "#6b7280" }}
                    >
                      Description
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-32"
                      style={{ color: color.text.secondary || "#6b7280" }}
                    >
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFields.map((field) => {
                    const isSelected = selectedValue === field.value;
                    return (
                      <tr
                        key={field.value}
                        onClick={() => handleSelectField(field.value)}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        style={{
                          backgroundColor: isSelected ? `${color.primary.accent || "#00BBCC"}15` : "white",
                        }}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center">
                            {isSelected ? (
                              <div
                                className="w-5 h-5 rounded flex items-center justify-center"
                                style={{
                                  backgroundColor: color.primary.action || "#3b8169",
                                }}
                              >
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div
                                className="w-5 h-5 rounded border-2"
                                style={{
                                  borderColor: color.border.default || "#d1d5db",
                                }}
                              />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {field.label || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600">
                            {field.value || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 max-w-md line-clamp-2">
                            {field.description || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-600">
                            {field.type || "-"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-center">
              <p className="text-gray-500 text-sm">No fields found</p>
              <p className="text-gray-400 text-xs mt-1">
                Try adjusting your search
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
