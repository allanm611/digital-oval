import { useState, useEffect } from "react";
import { X, GripVertical } from "lucide-react";
import type { ColumnConfig } from "../hooks/useDynamicColumns";
import Checkbox from "./ui/Checkbox";
import { button, getButtonStyles } from "../utils/utils";

interface ColumnPickerModalProps {
  isOpen: boolean;
  columns: ColumnConfig[];
  onClose: () => void;
  onToggleColumn: (columnId: string) => void;
  onReorderColumns: (newOrder: ColumnConfig[]) => void;
  onResetToDefaults: () => void;
}

export const ColumnPickerModal = ({
  isOpen,
  columns,
  onClose,
  onToggleColumn,
  onReorderColumns,
  onResetToDefaults,
}: ColumnPickerModalProps) => {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync localColumns with columns prop when it changes
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  if (!isOpen) return null;

  const handleToggle = (columnId: string) => {
    setLocalColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleSave = () => {
    onReorderColumns(localColumns);
    onClose();
  };

  const filteredColumns = localColumns.filter((col) =>
    col.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIdx = localColumns.findIndex((c) => c.id === draggedItem);
    const targetIdx = localColumns.findIndex((c) => c.id === targetId);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newColumns = [...localColumns];
    const [draggedColumn] = newColumns.splice(draggedIdx, 1);
    newColumns.splice(targetIdx, 0, draggedColumn);

    setLocalColumns(newColumns);
    setDraggedItem(null);
  };

  const handleReset = () => {
    onResetToDefaults();
    setLocalColumns(columns);
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Customize Columns
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 mb-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {filteredColumns.map((column) => (
                <div
                  key={column.id}
                  draggable
                  onDragStart={() => handleDragStart(column.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    draggedItem === column.id
                      ? "bg-blue-50 border-blue-200"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <GripVertical
                    size={16}
                    className="text-gray-400 cursor-move flex-shrink-0"
                  />
                  <Checkbox
                    id={`col-${column.id}`}
                    checked={column.visible !== false}
                    onChange={() => handleToggle(column.id)}
                  />
                  <label
                    htmlFor={`col-${column.id}`}
                    className="flex-1 cursor-pointer text-sm"
                    onClick={() => handleToggle(column.id)}
                  >
                    {column.label}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Defaults
              </button>
              <button
                onClick={handleSave}
                className="flex-1 text-sm font-medium transition-colors"
                style={getButtonStyles(button.action)}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
