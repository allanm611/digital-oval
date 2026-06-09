import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";

interface EditQuickListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: {
    name: string;
    description?: string | null;
  }) => Promise<void>;
  initialName: string;
  initialDescription?: string | null;
}

export default function EditQuickListModal({
  isOpen,
  onClose,
  onSubmit,
  initialName,
  initialDescription,
}: EditQuickListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription(initialDescription || "");
      setError("");
    }
  }, [isOpen, initialName, initialDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update QuickList"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-white ${tw.rounded} shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Edit Quicklist</h2>
          <button
            onClick={onClose}
            className={`p-1 text-gray-400 hover:text-gray-600 ${tw.rounded} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className={`p-3 bg-red-50 border border-red-200 ${tw.rounded} text-sm text-red-600`}>
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <Input
              label="Name"
              placeholder="Enter QuickList name"
              value={name}
              onChange={setName}
              required
            />
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Description"
              value={description}
              onChange={(value) => setDescription(value)}
              rows={3}
              placeholder="Enter description (optional)"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
