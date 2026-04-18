import { useState } from "react";
import { X } from "lucide-react";
import { productTypeService } from "../services/productTypeService";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";

interface CreateProductTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeCreated?: (typeId: number) => void;
}

export default function CreateProductTypeModal({
  isOpen,
  onClose,
  onTypeCreated,
}: CreateProductTypeModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;

    if (!user?.user_id) {
      showError("User ID is required", "Please log in again.");
      return;
    }

    try {
      setIsCreating(true);
      const response = await productTypeService.createProductType({
        name: newTypeName.trim(),
        description: newTypeDescription.trim() || undefined,
        is_active: true,
      });

      success(
        "Product Type Created",
        `"${newTypeName}" has been created successfully.`
      );

      const createdTypeId = response.data?.id;

      onClose();
      setNewTypeName("");
      setNewTypeDescription("");

      if (createdTypeId) {
        onTypeCreated?.(createdTypeId);
      }
    } catch (err) {
      console.error("Failed to create product type:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to create product type"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setNewTypeName("");
    setNewTypeDescription("");
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">
            New Product Type
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0`}
            title="Close"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type Name *
            </label>
            <input
              type="text"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              placeholder="e.g., Data, Voice, Bundle..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newTypeDescription}
              onChange={(e) => setNewTypeDescription(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              placeholder="Product type description..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors text-sm`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateType}
              disabled={!newTypeName.trim() || isCreating}
              className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isCreating ? "Creating..." : "Create Type"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
