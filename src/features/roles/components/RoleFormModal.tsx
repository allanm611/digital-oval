import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { Role, CreateRoleRequest, UpdateRoleRequest, DataAccessLevel } from "../types/role";
import { roleService } from "../services/roleService";
import { color } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  role?: Role;
  onSave: () => void;
  allRoles?: Role[];
  userId: number;
}

interface FormData {
  name: string;
  code: string;
  description: string;
  parent_role_id: number | "";
  role_level: number;
  data_access_level: DataAccessLevel | "";
  max_users: number | "";
  is_default: boolean;
  tags: string[];
}

const DATA_ACCESS_LEVELS = [
  { value: "public", label: "Public" },
  { value: "internal", label: "Internal" },
  { value: "confidential", label: "Confidential" },
  { value: "restricted", label: "Restricted" },
];

export default function RoleFormModal({
  isOpen,
  onClose,
  role,
  onSave,
  allRoles = [],
  userId: propUserId,
}: RoleFormModalProps) {
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  const userId = propUserId || user?.user_id;

  useEffect(() => {
  }, [userId]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    code: "",
    description: "",
    parent_role_id: "",
    role_level: 5,
    data_access_level: "",
    max_users: "",
    is_default: false,
    tags: [],
  });

  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && role) {
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description || "",
        parent_role_id: role.parent_role_id || "",
        role_level: role.role_level,
        data_access_level: role.data_access_level,
        max_users: role.max_users || "",
        is_default: role.is_default,
        tags: role.tags || [],
      });
      setErrors({});
    } else if (isOpen) {
      setFormData({
        name: "",
        code: "",
        description: "",
        parent_role_id: "",
        role_level: 5,
        data_access_level: "",
        max_users: "",
        is_default: false,
        tags: [],
      });
      setErrors({});
    }
    setTagInput("");
  }, [isOpen, role]);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Role name is required";
    }

    if (!formData.code.trim()) {
      newErrors.code = "Role code is required";
    }

    if (formData.parent_role_id) {
      const parentRole = allRoles.find((r) => r.id === formData.parent_role_id);
      if (!parentRole) {
        newErrors.parent_role_id = "Parent role must exist";
      }
    }

    if (formData.max_users && formData.max_users < 1) {
      newErrors.max_users = "Max users must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, allRoles]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "role_level" || name === "max_users") {
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
      [name]: value === "" ? "" : (name === "parent_role_id" ? Number(value) : value),
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

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
      e.preventDefault();
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      if (role) {
        const updateData: UpdateRoleRequest = {
          name: formData.name,
          description: formData.description || undefined,
          parent_role_id: formData.parent_role_id ? (formData.parent_role_id as number) : undefined,
          role_level: formData.role_level,
          data_access_level: formData.data_access_level || undefined,
          max_users: formData.max_users ? (formData.max_users as number) : undefined,
          is_default: formData.is_default,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          userId,
        };
        await roleService.updateRole(role.id, updateData);
        success("Success", `Role "${formData.name}" has been updated`);
      } else {
        const createData: CreateRoleRequest = {
          name: formData.name,
          code: formData.code,
          description: formData.description || undefined,
          parent_role_id: formData.parent_role_id ? (formData.parent_role_id as number) : undefined,
          role_level: formData.role_level,
          data_access_level: formData.data_access_level || undefined,
          max_users: formData.max_users ? (formData.max_users as number) : undefined,
          is_default: formData.is_default,
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          userId,
        };
        await roleService.createRole(createData);
        success("Success", `Role "${formData.name}" has been created`);
      }

      onSave();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";

      // Map duplicate errors
      if (errorMessage.includes("roles_name_key")) {
        setErrors({ name: "This role name already exists" });
      } else if (errorMessage.includes("roles_code_key")) {
        setErrors({ code: "This role code already exists" });
      } else {
        showError(
          role ? "Update Error" : "Creation Error",
          errorMessage
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const availableParentRoles = allRoles.filter((r) => !role || r.id !== role.id);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {role ? "Edit Role" : "Create New Role"}
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
                Role Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Administrator"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                  errors.name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                disabled={!!role}
                maxLength={50}
                placeholder="e.g., administrator"
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.code
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
              {role && (
                <p className="mt-1 text-xs text-gray-500">(Cannot be changed after creation)</p>
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
              maxLength={300}
              rows={3}
              placeholder="Enter role description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Level and Data Access Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Level
              </label>
              <input
                type="number"
                name="role_level"
                value={formData.role_level}
                onChange={handleInputChange}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Access Level (Optional)
              </label>
              <HeadlessSelect
                options={[{ value: "", label: "None" }, ...DATA_ACCESS_LEVELS]}
                value={formData.data_access_level}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    data_access_level: (value as DataAccessLevel | ""),
                  }))
                }
              />
            </div>
          </div>

          {/* Parent Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Role (Optional)
            </label>
            <HeadlessSelect
              options={[
                { value: "", label: "None" },
                ...availableParentRoles.map((r) => ({
                  value: String(r.id),
                  label: `${r.name} (Level ${r.role_level})`,
                })),
              ]}
              value={String(formData.parent_role_id)}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  parent_role_id: value === "" ? "" : Number(value),
                }))
              }
              error={!!errors.parent_role_id}
            />
            {errors.parent_role_id && (
              <p className="mt-1 text-sm text-red-600">{errors.parent_role_id}</p>
            )}
          </div>

          {/* Max Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Users (Optional)
            </label>
            <input
              type="number"
              name="max_users"
              value={formData.max_users}
              onChange={handleInputChange}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                errors.max_users
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.max_users && (
              <p className="mt-1 text-sm text-red-600">{errors.max_users}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleCheckboxChange}
              className="w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_default" className="text-sm font-medium text-gray-700 cursor-pointer">
              Set as Default
            </label>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Tag (Press Enter)
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleAddTag}
              placeholder="e.g., administrator"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => {
                  const tagName = typeof tag === "object" && tag !== null ? (tag as any).name || String(tag) : String(tag);
                  const tagKey = typeof tag === "object" && tag !== null ? (tag as any).id || index : `${tag}-${index}`;
                  return (
                    <div
                      key={tagKey}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-sm font-medium"
                      style={{ backgroundColor: color.primary.action + "20", color: color.primary.action }}
                    >
                      {tagName}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:opacity-70 transition-opacity font-bold"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            {isLoading ? (role ? "Updating..." : "Creating...") : (role ? "Update" : "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}
