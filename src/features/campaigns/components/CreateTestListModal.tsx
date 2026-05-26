import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Input from "../../../shared/components/ui/Input";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { tw, color, button, getButtonStyles } from "../../../shared/utils/utils";

interface CreateTestListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTestListRequest) => Promise<void>;
  isLoading?: boolean;
  mode?: "create" | "edit";
  initialData?: {
    name?: string;
    description?: string;
  } | null;
}

interface CreateTestListRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
}

export default function CreateTestListModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  mode = "create",
  initialData = null,
}: CreateTestListModalProps) {
  const [formData, setFormData] = useState<CreateTestListRequest>({
    name: "",
    description: "",
    isActive: true,
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
        isActive: true,
      });
    } else {
      setFormData({ name: "", description: "", isActive: true });
    }
    setErrors({});
  }, [isOpen, mode, initialData]);

  const handleChange = (field: keyof CreateTestListRequest, value: string) => {
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
    } catch {
      // Error is handled by parent
    }
  };

  const handleClose = () => {
    setFormData({ name: "", description: "", isActive: true });
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
              {mode === "edit" ? "Edit Test List" : "Create Test List"}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === "edit"
                ? "Update test list details"
                : "Create a new test recipient list"}
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
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              List Name *
            </label>
            <Input
              placeholder="Enter list name"
              value={formData.name}
              onChange={(value) => handleChange("name", value)}
              hasError={!!errors.name}
              variant="medium"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Enter description (optional)"
              disabled={isLoading}
              rows={3}
              className={`w-full px-3 py-2.5 border ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 disabled:opacity-50 disabled:bg-gray-100 resize-none ${
                errors.description
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-[#588157]"
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          {/* Active Status Checkbox - Commented out: status always defaults to active */}
          {/* <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
            setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
          }>
            <Checkbox
              id="active-checkbox"
              checked={formData.isActive ?? true}
              onChange={() =>
                setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
              }
            />
            <span className="text-sm font-medium text-gray-700">
              Active
            </span>
          </div> */}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
            style={getButtonStyles(button.bordered)}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 text-white font-medium text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: color.primary.action }}
          >
            {isLoading
              ? "Saving..."
              : mode === "edit"
                ? "Update List"
                : "Create List"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
