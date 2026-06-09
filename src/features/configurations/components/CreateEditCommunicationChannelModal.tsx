import { useState, useEffect } from "react";
import Input from '../../../shared/components/ui/Input';
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { color, tw, zIndex, button } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface CreateEditCommunicationChannelModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initialData?: CommunicationChannel;
  onClose: () => void;
  onSave?: (data: {
    code: string;
    name: string;
    description: string;
    is_active: boolean;
  }) => Promise<void>;
}

export default function CreateEditCommunicationChannelModal({
  isOpen,
  mode,
  initialData,
  onClose,
  onSave,
}: CreateEditCommunicationChannelModalProps) {
  const { success: showSuccessToast } = useToast();
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    is_active: true,
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (mode === "edit" && initialData?.name) {
      const isActive = initialData.is_active !== undefined ? initialData.is_active : ((initialData as any).isActive ?? true);
      setFormData({
        code: initialData.code || "",
        name: initialData.name || "",
        description: initialData.description || "",
        is_active: Boolean(isActive),
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
        is_active: true,
      });
    }
    setError("");
  }, [mode, initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.code.trim()) {
      setError("Channel code is required");
      return;
    }

    if (!formData.name.trim()) {
      setError("Channel name is required");
      return;
    }

    if (formData.code.length > 50) {
      setError("Channel code must be 50 characters or less");
      return;
    }

    if (formData.name.length > 100) {
      setError("Channel name must be 100 characters or less");
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
          code: formData.code.trim(),
          name: formData.name.trim(),
          description: formData.description.trim(),
          is_active: formData.is_active,
        });
      }
      setFormData({ code: "", name: "", description: "", is_active: true });
      onClose();
    } catch (err) {
      setError(
        `Failed to ${mode === "create" ? "create" : "update"} communication channel. Please try again.`
      );
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
          <h2 className="text-lg font-bold text-gray-900">
            {mode === "create"
              ? "Create Communication Channel"
              : "Edit Communication Channel"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <Input
              label="Channel Code *"
              type="text"
              value={formData.code}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, code: String(value) }))
              }
              className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              placeholder="e.g., sms, email, push"
              maxLength={50}
              required
              disabled={mode === "edit"}
            />
            {mode === "edit" && <p className="text-xs text-gray-500 mt-1">Code cannot be changed after creation</p>}
          </div>

          <Input
            label="Channel Name *"
            type="text"
            value={formData.name}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, name: String(value) }))
            }
            className={`w-full px-3 py-2 text-sm border border-gray-300 ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
            placeholder="e.g., SMS, Email, Push"
            maxLength={100}
            required
          />

          <Textarea
            label="Description"
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

          <div className="flex items-center gap-2">
            <Checkbox
              id="active-checkbox"
              checked={formData.is_active}
              onChange={() =>
                setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))
              }
            />
            <label
              htmlFor="active-checkbox"
              className="text-sm font-medium text-gray-700 cursor-pointer"
              onClick={() =>
                setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))
              }
            >
              Active
            </label>
          </div>

          <div className="flex gap-3 mt-6">
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
              className={`flex-1 px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: button.action.background }}
              disabled={isSaving}
            >
              {isSaving ? (mode === "create" ? "Creating..." : "Updating...") : mode === "create" ? "Create" : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
