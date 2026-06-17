import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { color, tw, zIndex, button, getButtonStyles } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useToast } from "../../../contexts/ToastContext";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { kpiCategoryService } from "../services/kpiCategoryService";

export interface KpiCategory {
  id?: number;
  name: string;
  description?: string;
  display_order?: number;
  parent_category_id?: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface KpiCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: KpiCategory) => Promise<void>;
  category?: KpiCategory;
  parentCategories: KpiCategory[];
  isSaving?: boolean;
}

export default function KpiCategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  parentCategories,
  isSaving = false,
}: KpiCategoryModalProps) {
  const { t } = useLanguage();
  const { error: showError } = useToast();
  const [formData, setFormData] = useState<KpiCategory>({
    name: "",
    description: "",
    display_order: 0,
    parent_category_id: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (category) {
        setFormData(category);
      } else {
        setFormData({
          name: "",
          description: "",
          display_order: 0,
          parent_category_id: null,
        });
      }
      setErrors({});
    }
  }, [isOpen, category]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Category name is required";
    } else if (formData.name.length < 3 || formData.name.length > 50) {
      newErrors.name = "Category name must be 3-50 characters";
    }

    if (
      formData.description &&
      formData.description.length > 255
    ) {
      newErrors.description = "Description must be 255 characters or less";
    }

    if (formData.display_order && typeof formData.display_order !== "number") {
      newErrors.display_order = "Display order must be a number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload: KpiCategory = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        display_order: formData.display_order || 0,
        parent_category_id: formData.parent_category_id || undefined,
        is_active: true,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Failed to save KPI category:", err);
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to save category"
      );
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-h-[90vh] overflow-y-auto`}
        style={{ maxWidth: "500px" }}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? "Edit KPI Category" : "Create KPI Category"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors`}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name Field */}
            <div>
              <Input
                label="Category Name"
                type="text"
                value={formData.name}
                onChange={(value) => setFormData((prev) => ({ ...prev, name: String(value) }))}
                placeholder="e.g., Revenue Metrics"
                maxLength={50}
                required
                hasError={!!errors.name}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Description Field */}
            <div>
              <Textarea
                label="Description"
                value={formData.description || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: value,
                  }))
                }
                placeholder="Category description..."
                rows={3}
                maxLength={255}
                hasError={!!errors.description}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Display Order Field */}
            <div>
              <Input
                label="Display Order"
                type="number"
                value={String(formData.display_order || 0)}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    display_order: parseInt(String(value), 10) || 0,
                  }))
                }
                placeholder="0"
                hasError={!!errors.display_order}
              />
              {errors.display_order && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.display_order}
                </p>
              )}
            </div>

            {/* Parent Category Field */}
            <div>
              <HeadlessSelect
                label="Parent Category"
                value={formData.parent_category_id?.toString() || ""}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    parent_category_id: value
                      ? parseInt(value as string, 10)
                      : null,
                  }))
                }
                options={[
                  { label: "None", value: "" },
                  ...parentCategories
                    .filter((cat) => cat.id !== category?.id)
                    .map((cat) => ({
                      label: cat.name,
                      value: cat.id?.toString() || "",
                    })),
                ]}
                placeholder="Select a parent category"
                className="w-full"
              />
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
              style={getButtonStyles(button.bordered)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-white ${tw.rounded} transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving
                ? category
                  ? "Updating..."
                  : "Creating..."
                : category
                  ? "Update"
                  : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
