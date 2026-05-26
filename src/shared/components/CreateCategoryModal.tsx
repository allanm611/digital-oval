import { useState } from "react";
import Input from "./ui/Input";
import { X } from "lucide-react";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { color, tw, zIndex, button, getButtonStyles } from "../utils/utils";
import { useToast } from "../../contexts/ToastContext";
import { extractBackendError } from "../utils/errorHandler";;;
import { useAuth } from "../../contexts/AuthContext";

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (categoryId: number) => void;
  entityType?: "product" | "campaign" | "offer" | "segment";
}

export default function CreateCategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
  entityType = "product",
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
      let response;

      if (entityType === "campaign") {
        const { campaignService } = await import(
          "../../features/campaigns/services/campaignService"
        );
        response = await campaignService.createCampaignCategory({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || "",
          parent_category_id: undefined,
          is_active: true,
          created_by: createdByNumber,
        });
      } else if (entityType === "offer") {
        const { offerCategoryService } = await import(
          "../../features/offers/services/offerCategoryService"
        );
        response = await offerCategoryService.createCategory({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          parent_category_id: undefined,
        });
      } else if (entityType === "segment") {
        const { segmentService } = await import(
          "../../features/segments/services/segmentService"
        );
        response = await segmentService.createSegmentCategory({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || "",
          is_active: true,
        });
      } else {
        response = await productCategoryService.createCategory({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || undefined,
          parent_category_id: undefined,
          is_active: true,
          created_by: createdByNumber,
        });
      }

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
      showError("Error", extractBackendError(err, "Error. Please try again."));
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
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100 max-h-[90vh] overflow-y-auto`}
      >
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
            <Input type="text"
              value={newCategoryName}
              onChange={(value) => setNewCategoryName(String(value))}
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
              className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
              style={getButtonStyles(button.bordered)}
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
