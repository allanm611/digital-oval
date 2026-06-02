import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { Permission, CreatePermissionRequest, UpdatePermissionRequest } from "../types/role";
import { permissionService } from "../services/permissionService";
import { color } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";

interface PermissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  permission?: Permission;
  onSave: () => void;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  action: string;
  resource_type_id: number | "";
  is_sensitive: boolean;
  requires_mfa: boolean;
  requires_justification: boolean;
}

const AVAILABLE_ACTIONS = [
  { value: "create", label: "Create" },
  { value: "read", label: "Read" },
  { value: "update", label: "Update" },
  { value: "delete", label: "Delete" },
  { value: "execute", label: "Execute" },
  { value: "manage", label: "Manage" },
];

export default function PermissionFormModal({
  isOpen,
  onClose,
  permission,
  onSave,
}: PermissionFormModalProps) {
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    description: "",
    action: "read",
    resource_type_id: "",
    is_sensitive: false,
    requires_mfa: false,
    requires_justification: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && permission) {
      setFormData({
        name: permission.name,
        code: permission.code,
        description: permission.description || "",
        action: permission.action,
        resource_type_id: permission.resource_type_id || "",
        is_sensitive: permission.is_sensitive,
        requires_mfa: permission.requires_mfa,
        requires_justification: permission.requires_justification,
      });
      setErrors({});
    } else if (isOpen) {
      setFormData({
        name: "",
        code: "",
        description: "",
        action: "read",
        resource_type_id: "",
        is_sensitive: false,
        requires_mfa: false,
        requires_justification: false,
      });
      setErrors({});
    }
  }, [isOpen, permission]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Permission name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Permission code is required";
    } else if (!formData.code.includes(".")) {
      newErrors.code = "Permission code must use dot notation (e.g., permission.action.resource)";
    }

    if (!formData.action) {
      newErrors.action = "Action is required";
    } else if (!AVAILABLE_ACTIONS.some((a) => a.value === formData.action)) {
      newErrors.action = "Invalid action selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "resource_type_id") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      if (permission) {
        const updateData: UpdatePermissionRequest = {
          action: formData.action,
          is_sensitive: formData.is_sensitive,
          requires_mfa: formData.requires_mfa,
          requires_justification: formData.requires_justification,
          description: formData.description || undefined,
          resource_type_id: formData.resource_type_id ? (formData.resource_type_id as number) : undefined,
        };
        await permissionService.updatePermission(permission.id, updateData);
        success("Success", `Permission "${formData.name}" has been updated`);
      } else {
        const createData: CreatePermissionRequest = {
          name: formData.name,
          code: formData.code,
          description: formData.description || undefined,
          action: formData.action,
          resource_type_id: formData.resource_type_id ? (formData.resource_type_id as number) : undefined,
          is_sensitive: formData.is_sensitive,
          requires_mfa: formData.requires_mfa,
          requires_justification: formData.requires_justification,
        };
        await permissionService.createPermission(createData);
        success("Success", `Permission "${formData.name}" has been created`);
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      // Map duplicate errors
      if (errorMessage.includes("permissions_name_key")) {
        setErrors({ name: "This permission name already exists" });
      } else if (errorMessage.includes("permissions_code_key")) {
        setErrors({ code: "This permission code already exists" });
      } else {
        showError(
          permission ? "Update Error" : "Creation Error",
          errorMessage
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {permission ? "Edit Permission" : "Create New Permission"}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Name and Code Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permission Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: String(value) })}
                placeholder="e.g., User Management"
                hasError={!!errors.name}
                variant="medium"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(value) => setFormData({ ...formData, code: String(value) })}
                disabled={!!permission}
                placeholder="e.g., permission.action.resource"
                hasError={!!errors.code}
                variant="medium"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
              {!errors.code && !permission && (
                <p className="mt-1 text-xs text-gray-500">Use dot notation for readability</p>
              )}
              {permission && (
                <p className="mt-1 text-xs text-gray-500">(Cannot be changed)</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Enter permission description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action and Resource Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action *
              </label>
              <HeadlessSelect
                options={AVAILABLE_ACTIONS}
                value={formData.action}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    action: String(value),
                  }))
                }
                error={!!errors.action}
              />
              {errors.action && (
                <p className="mt-1 text-sm text-red-600">{errors.action}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Type ID (Optional)
              </label>
              <Input
                type="number"
                value={String(formData.resource_type_id)}
                onChange={(value) => setFormData({ ...formData, resource_type_id: value === "" ? "" : parseInt(String(value)) || "" })}
                placeholder="e.g., 1"
                variant="medium"
              />
            </div>
          </div>

          {/* Security Checkboxes */}
          <div className="space-y-3">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleCheckboxChange({ target: { name: 'is_sensitive', checked: !formData.is_sensitive } } as any)}
            >
              <Checkbox
                id="is_sensitive"
                name="is_sensitive"
                checked={formData.is_sensitive}
                onChange={handleCheckboxChange}
              />
              <span className="text-sm font-medium text-gray-700">Mark as Sensitive</span>
            </div>

            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => handleCheckboxChange({ target: { name: 'requires_mfa', checked: !formData.requires_mfa } } as any)}
            >
              <Checkbox
                id="requires_mfa"
                name="requires_mfa"
                checked={formData.requires_mfa}
                onChange={handleCheckboxChange}
              />
              <span className="text-sm font-medium text-gray-700">Requires MFA Authentication</span>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="requires_justification"
                name="requires_justification"
                checked={formData.requires_justification}
                onChange={handleCheckboxChange}
                className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500" />
              <label htmlFor="requires_justification" className="text-sm font-medium text-gray-700 cursor-pointer">
                Requires Justification
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: color.primary.action }}
          >
            {isLoading && <LoadingSpinner />}
            {isLoading ? (permission ? "Updating..." : "Creating...") : (permission ? "Update" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}
