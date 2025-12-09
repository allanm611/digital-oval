import { useState } from "react";
import { X } from "lucide-react";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { color , tw} from "../utils/utils";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (categoryId: number) => void;
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
}: CreateCategoryModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    // Ensure created_by is a number
    const createdBy = user?.user_id;
    if (!createdBy) {
      showError("User ID is required", "Please log in again.");
      return;
    }

    // Convert to number if it's a string
    const createdByNumber =
      typeof createdBy === "string" ? parseInt(createdBy, 10) : createdBy;

    if (isNaN(createdByNumber)) {
      showError("Invalid user ID", "Please log in again.");
      return;
    }

    try {
      setIsCreating(true);
      const response = await productCategoryService.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || undefined,
        parent_category_id: undefined, // optional, default to undefined
        is_active: true, // optional, default to true
        created_by: createdByNumber, // required, must be a number
      });

      success(
        "Category Created",
        `"${newCategoryName}" has been created successfully.`
      );

      const createdCategoryId = response.data?.id;

      onClose();
      setNewCategoryName("");
      setNewCategoryDescription("");

      if (createdCategoryId) {
        onCategoryCreated?.(createdCategoryId);
      }
    } catch (err) {
      console.error("Failed to create category:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to create category"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
    setNewCategoryName("");
    setNewCategoryDescription("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] backdrop-blur-sm">
      <div className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">
            New Catalog
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
              Catalog Name *
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              placeholder="e.g., Data, Voice, SMS..."
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none`}
              placeholder="Catalog description..."
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
              onClick={handleCreateCategory}
              disabled={!newCategoryName.trim() || isCreating}
              className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isCreating ? "Creating..." : "Create Catalog"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
