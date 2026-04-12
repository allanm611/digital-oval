import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface CreateUtilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (utility: { name: string; description: string; isActive: boolean }) => Promise<void>;
}

export default function CreateUtilityModal({
  isOpen,
  onClose,
  onSave,
}: CreateUtilityModalProps) {
  const { success: showSuccessToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Utility name is required");
      return;
    }

    if (formData.name.length > 100) {
      setError("Utility name must be 100 characters or less");
      return;
    }

    if (formData.description.length > 500) {
      setError("Description must be 500 characters or less");
      return;
    }

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave({
          name: formData.name.trim(),
          description: formData.description.trim(),
          isActive: formData.isActive,
        });
      }
      showSuccessToast("Utility created successfully");
      setFormData({ name: "", description: "", isActive: true });
      onClose();
    } catch (err) {
      setError("Failed to create utility. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-md`}>
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-bold text-gray-900">
            Create Utility
          </h2>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-2 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utility Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="Enter utility name"
              maxLength={100}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none`}
              placeholder="Enter description"
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Status Checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="active-checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
            />
            <label
              htmlFor="active-checkbox"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>

          <div className="flex gap-3 mt-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 ${tw.rounded} hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSaving}
            >
              {isSaving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
