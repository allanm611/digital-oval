import { useState, useEffect } from "react";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import { X } from "lucide-react";
import { productCategoryService } from "../../features/products/services/productCategoryService";
import { color, tw, zIndex, button, getButtonStyles } from "../utils/utils";
import { useToast } from "../../contexts/ToastContext";
import { extractBackendError } from "../utils/errorHandler";;;
import { useAuth } from "../../contexts/AuthContext";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: (categoryId: number) => void;
  onCategoryUpdated?: () => void;
  entityType?: "product" | "campaign" | "offer" | "segment";
  category?: { id?: number; name?: string; description?: string } | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onCategoryCreated,
  onCategoryUpdated,
  entityType = "product",
  category = null,
}: CategoryModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const isEditMode = !!category?.id;

  // Populate form when editing or clear when creating
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && category) {
        setNewCategoryName(category.name || "");
        setNewCategoryDescription(category.description || "");
      } else {
        setNewCategoryName("");
        setNewCategoryDescription("");
      }
    }
  }, [isOpen, isEditMode, category]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setIsCreating(true);
      let response;

      if (isEditMode && category?.id) {
        // EDIT MODE
        if (entityType === "campaign") {
          const { campaignService } = await import(
            "../../features/campaigns/services/campaignService"
          );
          response = await campaignService.updateCampaignCategory(category.id, {
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || "",
          });
        } else if (entityType === "offer") {
          const { offerCategoryService } = await import(
            "../../features/offers/services/offerCategoryService"
          );
          response = await offerCategoryService.updateCategory(category.id, {
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || undefined,
          });
        } else if (entityType === "segment") {
          const { segmentService } = await import(
            "../../features/segments/services/segmentService"
          );
          response = await segmentService.updateSegmentCategory(category.id, {
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || "",
          });
        } else {
          response = await productCategoryService.updateCategory(category.id, {
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || undefined,
          });
        }

        success(
          "Category Updated",
          `"${newCategoryName}" has been updated successfully.`
        );

        onClose();
        setNewCategoryName("");
        setNewCategoryDescription("");
        onCategoryUpdated?.();
      } else {
        // CREATE MODE
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
      }
    } catch (err) {
      console.error("Failed to save category:", err);
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100 max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">
            {isEditMode ? "Edit Catalog" : "New Catalog"}
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0`}
            title="Close"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <Input
            type="text"
            label="Catalog Name *"
            value={newCategoryName}
            onChange={(value) => setNewCategoryName(String(value))}
            placeholder="e.g., Data, Voice, SMS..."
            required
          />

          <Textarea
            label="Description"
            value={newCategoryDescription}
            onChange={(value) => setNewCategoryDescription(value)}
            rows={3}
            placeholder="Catalog description..."
          />

          <div className="flex justify-end gap-3">
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
              disabled={isCreating}
              className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isCreating ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update" : "Create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
