import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import { Role, CreateRoleRequest, UpdateRoleRequest, DataAccessLevel } from "../types/role";
import { roleService } from "../services/roleService";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";

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
      <div className="rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-background)" }}>
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--c-border-default)", backgroundColor: "var(--c-surface-background)" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--c-text-primary)" }}>
            {role ? "Edit Role" : "Create New Role"}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="disabled:opacity-50"
            style={{ color: "var(--c-text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Name and Code Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Input
                label="Role Name *"
                type="text"
                value={formData.name}
                onChange={(value) => setFormData({ ...formData, name: String(value) })}
                placeholder="e.g., Administrator"
                hasError={!!errors.name}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <Input
                label="Code *"
                type="text"
                value={formData.code}
                onChange={(value) => setFormData({ ...formData, code: String(value) })}
                disabled={!!role}
                placeholder="e.g., administrator"
                hasError={!!errors.code}
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code}</p>
              )}
              {role && (
                <p className="mt-1 text-xs text-[var(--c-text-muted)]">(Cannot be changed after creation)</p>
              )}
            </div>
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(value) => setFormData({ ...formData, description: value })}
            maxLength={300}
            rows={3}
            placeholder="Enter role description..."
          />

          {/* Level and Data Access Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Role Level"
              type="number"
              value={String(formData.role_level)}
              onChange={(value) => setFormData({ ...formData, role_level: parseInt(String(value)) || 0 })}
              placeholder="1-10"
            />

            <div>
              <HeadlessSelect
                label="Data Access Level (Optional)"
                options={[{ value: "", label: "None" }, ...DATA_ACCESS_LEVELS]}
                value={formData.data_access_level}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    data_access_level: (value as DataAccessLevel | ""),
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          {/* Parent Role */}
          <div>
            <HeadlessSelect
              label="Parent Role (Optional)"
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
              className="w-full"
            />
            {errors.parent_role_id && (
              <p className="mt-1 text-sm text-red-600">{errors.parent_role_id}</p>
            )}
          </div>

          {/* Max Users */}
          <div>
            <Input
              label="Max Users (Optional)"
              type="number"
              value={String(formData.max_users)}
              onChange={(value) => setFormData({ ...formData, max_users: value === "" ? "" : parseInt(String(value)) || "" })}
              placeholder="Unlimited"
              hasError={!!errors.max_users}
            />
            {errors.max_users && (
              <p className="mt-1 text-sm text-red-600">{errors.max_users}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => handleCheckboxChange({ target: { name: 'is_default', checked: !formData.is_default } } as any)}
          >
            <Checkbox
              id="is_default"
              name="is_default"
              checked={formData.is_default}
              onChange={handleCheckboxChange}
            />
            <span className="text-sm font-medium text-[var(--c-text-primary)]">Set as Default</span>
          </div>

          {/* Tags */}
          <div>
            <Input
              label="Add Tag (Press Enter)"
              type="text"
              value={tagInput}
              onChange={(value) => setTagInput(String(value))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(e as any); }}
              placeholder="e.g., administrator"
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
                      style={{ backgroundColor: "var(--c-icon-table-edit)20", color: "var(--c-icon-table-edit)" }}
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
        <div className="sticky bottom-0 px-6 py-4 border-t" style={{ borderColor: "var(--c-border-default)", backgroundColor: "var(--c-surface-background)" }}>
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="transition-colors disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80"
              style={getButtonStyles(button.bordered)}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              style={{ backgroundColor: "var(--c-primary-action)" }}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner variant="modern" size="sm" color="primary" className="mr-2" />
                  {role ? "Updating..." : "Creating..."}
                </>
              ) : (
                role ? "Update" : "Create"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
