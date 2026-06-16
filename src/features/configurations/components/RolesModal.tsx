import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import { useAuth } from "../../../contexts/AuthContext";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { roleService } from "../../roles/services/roleService";
import { Role, CreateRoleRequest, UpdateRoleRequest } from "../../roles/types/role";

interface RolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingRole: Role | null;
}

const DATA_ACCESS_LEVELS = [
  { value: "PUBLIC", label: "Public" },
  { value: "INTERNAL", label: "Internal" },
  { value: "CONFIDENTIAL", label: "Confidential" },
  { value: "RESTRICTED", label: "Restricted" },
];

export default function RolesModal({
  isOpen,
  onClose,
  onSubmit,
  editingRole,
}: RolesModalProps) {
  const { error: showError, success: showSuccess } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    data_access_level: "PUBLIC" as any,
    role_level: 0,
    max_users: "",
  });

  useEffect(() => {
    if (editingRole) {
      setFormData({
        name: editingRole.name,
        code: editingRole.code,
        description: editingRole.description || "",
        data_access_level: editingRole.data_access_level || "PUBLIC",
        role_level: editingRole.role_level || 0,
        max_users: editingRole.max_users ? String(editingRole.max_users) : "",
      });
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        data_access_level: "PUBLIC",
        role_level: 0,
        max_users: "",
      });
    }
  }, [editingRole, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Name is required");
      return;
    }

    if (!formData.code.trim()) {
      showError("Code is required");
      return;
    }

    const userId = user?.user_id || 0;
    setIsSubmitting(true);
    try {
      if (editingRole) {
        const payload: UpdateRoleRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          data_access_level: formData.data_access_level,
          role_level: formData.role_level || undefined,
          max_users: formData.max_users ? parseInt(formData.max_users) : undefined,
          userId,
        };
        await roleService.updateRole(editingRole.id, payload);
        showSuccess("Role updated successfully");
      } else {
        const payload: CreateRoleRequest = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || undefined,
          data_access_level: formData.data_access_level,
          role_level: formData.role_level || undefined,
          max_users: formData.max_users ? parseInt(formData.max_users) : undefined,
          userId,
        };
        await roleService.createRole(payload);
        showSuccess("Role created successfully");
      }

      onSubmit();
    } catch (error) {
      showError(
        editingRole ? "Failed to update role" : "Failed to create role",
        error instanceof Error ? error.message : ""
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className={`${tw.rounded} bg-white w-full max-w-md shadow-lg`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: color.border.default }}
        >
          <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
            {editingRole ? "Edit Role" : "Create Role"}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 ${tw.rounded} transition-colors`}
            style={{
              color: color.primary.action,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${color.primary.action}10`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <Input
            label={<>Name <span className="text-red-500">*</span></>}
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Administrator"
            className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.input,
            }}
            onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
            onBlur={(e) => (e.target.style.borderColor = color.border.default)}
          />

          {/* Code */}
          <Input
            label={<>Code <span className="text-red-500">*</span></>}
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g., ADMIN"
            className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.input,
            }}
            onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
            onBlur={(e) => (e.target.style.borderColor = color.border.default)}
          />

          {/* Description */}
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optional description"
            rows={2}
            className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none resize-none`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.input,
            }}
            onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
            onBlur={(e) => (e.target.style.borderColor = color.border.default)}
          />

          {/* Data Access Level */}
          <div>
            <HeadlessSelect
              label="Data Access Level"
              options={DATA_ACCESS_LEVELS}
              value={formData.data_access_level}
              onChange={(value) => setFormData({ ...formData, data_access_level: String(value) })}
              placeholder="Select access level..."
              className="w-full"
            />
          </div>

          {/* Role Level */}
          <Input
            label="Role Level"
            type="number"
            value={formData.role_level}
            onChange={(e) => setFormData({ ...formData, role_level: parseInt(e.target.value) || 0 })}
            placeholder="0"
            className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.input,
            }}
            onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
            onBlur={(e) => (e.target.style.borderColor = color.border.default)}
          />

          {/* Max Users */}
          <Input
            label="Max Users"
            type="number"
            value={formData.max_users}
            onChange={(e) => setFormData({ ...formData, max_users: e.target.value })}
            placeholder="Unlimited"
            className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.input,
            }}
            onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
            onBlur={(e) => (e.target.style.borderColor = color.border.default)}
          />

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="transition-colors disabled:opacity-60"
              style={getButtonStyles(button.bordered)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60`}
              style={{ backgroundColor: color.primary.action }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {editingRole ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingRole ? "Update" : "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
