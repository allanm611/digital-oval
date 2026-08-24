import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { offerTypeService } from "../services/offerTypeService";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useAuth } from "../../../contexts/AuthContext";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import Checkbox from "../../../shared/components/ui/Checkbox";
import ModalFooter from "../../../shared/components/ui/ModalFooter";

interface CreateOfferTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeCreated?: (typeId: number, typeData?: any) => void;
}

export default function CreateOfferTypeModal({
  isOpen,
  onClose,
  onTypeCreated,
}: CreateOfferTypeModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [isSeedingReward, setIsSeedingReward] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const resetForm = useCallback(() => {
    setNewTypeName("");
    setNewTypeDescription("");
    setIsSeedingReward(false);
  }, []);

  const handleCreateType = async () => {
    if (!newTypeName.trim()) return;

    if (!user?.user_id) {
      showError("User ID is required", "Please log in again.");
      return;
    }

    try {
      setIsCreating(true);
      const response = await offerTypeService.createOfferType({
        name: newTypeName.trim(),
        description: newTypeDescription.trim() || undefined,
        is_active: true,
        is_seeding_reward: isSeedingReward,
      });

      success(
        "Offer Type Created",
        `"${newTypeName}" has been created successfully.`,
      );

      const createdTypeId = response.data?.id;
      const createdTypeData = response.data;

      onClose();
      resetForm();

      if (createdTypeId) {
        onTypeCreated?.(createdTypeId, createdTypeData);
      }
    } catch (err) {
      console.error("Failed to create offer type:", err);
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = useCallback(() => {
    if (isCreating) return;
    onClose();
    resetForm();
  }, [isCreating, onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center backdrop-blur-sm"
      style={{ zIndex: zIndex.modal }}
      onClick={handleClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 border border-gray-100 max-h-[90vh] overflow-y-auto`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex-1 min-w-0">
            New Offer Type
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
            title="Close"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          <Input
            type="text"
            label="Type Name"
            value={newTypeName}
            onChange={(value) => setNewTypeName(String(value))}
          />

          <Textarea
            label="Description"
            value={newTypeDescription}
            onChange={(value) => setNewTypeDescription(value)}
            rows={3}
          />

          <label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              id="offer-type-seeding-reward"
              checked={isSeedingReward}
              onChange={(e) => setIsSeedingReward(e.target.checked)}
            />
            <span>
              <span className={`block text-sm font-medium ${tw.textPrimary}`}>
                Seeding reward
              </span>
              <span className={`block text-xs ${tw.textMuted} mt-0.5`}>
                When enabled, offers of this type do not require tracking. A
                default reward is managed without a tracking-source binding.
              </span>
            </span>
          </label>

          <ModalFooter
            onCancel={handleClose}
            onConfirm={handleCreateType}
            cancelText="Cancel"
            confirmText={isCreating ? "Creating..." : "Create Type"}
            isLoading={isCreating}
            disabled={!newTypeName.trim()}
            confirmClassName={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm`}
            confirmStyle={{ backgroundColor: color.primary.action }}
          />
        </div>
      </div>
    </div>
  );
}
