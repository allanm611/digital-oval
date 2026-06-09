import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import { tw, color } from "../../../shared/utils/utils";

interface CreateVIPListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVIPListRequest) => Promise<void>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  initialData?: {
    name?: string;
    description?: string;
  } | null;
}

interface CreateVIPListRequest {
  name: string;
  description?: string;
  created_by?: string;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export default function CreateVIPListModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode = "create",
  initialData = null,
}: CreateVIPListModalProps) {
  const [formData, setFormData] = useState<CreateVIPListRequest>({
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
    setErrors({});
  }, [isOpen, mode, initialData]);

  const handleChange = (field: keyof CreateVIPListRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "List name is required";
    } else if (formData.name.length > 255) {
      newErrors.name = "List name must be at most 255 characters";
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = "Description must be at most 1000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      // Error is handled by parent
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "" });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className={`bg-white ${tw.rounded} w-full max-w-md`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-black">
              {mode === "edit" ? "Edit VIP List" : "Create VIP List"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === "edit"
                ? "Update VIP list details"
                : "Create a new VIP customer list"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* List Name */}
          <div>
            <Input
              label="List Name *"
              placeholder="Enter list name"
              value={formData.name}
              onChange={(value) => handleChange("name", value)}
              hasError={!!errors.name}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Description"
              value={formData.description || ""}
              onChange={(value) => handleChange("description", value)}
              placeholder="Enter description (optional)"
              disabled={isLoading}
              rows={3}
              hasError={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors disabled:opacity-50`}
            style={{
              background: "transparent",
              color: color.primary.action,
              border: `1px solid ${color.primary.action}`,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !formData.name.trim()}
            className={`px-5 py-2 ${tw.rounded} text-sm font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: formData.name.trim()
                ? color.primary.action
                : color.text.muted,
            }}
          >
            {isLoading
              ? mode === "edit"
                ? "Updating..."
                : "Creating..."
              : mode === "edit"
                ? "Update"
                : "Create"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
