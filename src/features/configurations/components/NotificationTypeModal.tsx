import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { notificationTypeService, NotificationRule, CreateNotificationRuleRequest } from "../../../shared/services/notificationTypeService";

interface NotificationTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingRule: NotificationRule | null;
}

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
];

export default function NotificationTypeModal({
  isOpen,
  onClose,
  onSubmit,
  editingRule,
}: NotificationTypeModalProps) {
  const { error: showError, success: showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [tableOptions, setTableOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    table_name: "",
    action_type: "",
    message_template: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      const tables = await notificationTypeService.getTables();
      const uniqueTableNames = new Set<string>();
      const options = (Array.isArray(tables) ? tables : [])
        .map((table: any) => {
          const tableName = typeof table === "string" ? table : table.table_name || table.name || String(table);
          return {
            value: tableName,
            label: tableName.charAt(0).toUpperCase() + tableName.slice(1),
          };
        })
        .filter((option) => {
          if (uniqueTableNames.has(option.value)) {
            return false;
          }
          uniqueTableNames.add(option.value);
          return true;
        });
      setTableOptions(options);
    } catch (error) {
      console.error("Failed to load tables:", error);
      showError(extractBackendError(error, "Failed to load tables. Please try again."));
    } finally {
      setIsLoadingTables(false);
    }
  };

  useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        description: editingRule.description || "",
        table_name: editingRule.table_name,
        action_type: editingRule.action_type,
        message_template: editingRule.message_template,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        table_name: "",
        action_type: "",
        message_template: "",
      });
    }
  }, [editingRule, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Name is required");
      return;
    }

    if (!formData.table_name) {
      showError("Table name is required");
      return;
    }

    if (!formData.action_type) {
      showError("Action type is required");
      return;
    }

    if (!formData.message_template.trim()) {
      showError("Message template is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateNotificationRuleRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        table_name: formData.table_name,
        action_type: formData.action_type,
        message_template: formData.message_template.trim(),
      };

      if (editingRule) {
        await notificationTypeService.update(editingRule.id, payload);
        showSuccess("Notification type updated successfully");
      } else {
        await notificationTypeService.create(payload);
        showSuccess("Notification type created successfully");
      }

      onSubmit();
    } catch (error) {
      showError(
        editingRule ? "Failed to update notification type" : "Failed to create notification type",
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
        className={`${tw.rounded} bg-white w-full max-w-2xl shadow-lg`}
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: color.border.default }}
        >
          <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
            {editingRule ? "Edit Notification Type" : "Create Notification Type"}
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
          <div className="space-y-1.5">
            <label className={`text-sm font-medium ${tw.textPrimary}`}>
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Campaign Created"
              className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.input,
              }}
              onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
              onBlur={(e) => (e.target.style.borderColor = color.border.default)}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={`text-sm font-medium ${tw.textPrimary}`}>
              Description
            </label>
            <textarea
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
          </div>

          {/* Table Name and Action Type on Same Line */}
          <div className="grid grid-cols-2 gap-4">
            {/* Table Name */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${tw.textPrimary}`}>
                Table Name <span className="text-red-500">*</span>
                {isLoadingTables && (
                  <span className="ml-2 inline-flex items-center">
                    <Loader2 className="w-3 h-3 animate-spin" style={{ color: color.primary.action }} />
                  </span>
                )}
              </label>
              <HeadlessSelect
                options={tableOptions}
                value={formData.table_name}
                onChange={(value) => setFormData({ ...formData, table_name: String(value) })}
                placeholder="Select a table..."
                disabled={isLoadingTables}
                searchable={true}
              />
            </div>

            {/* Action Type */}
            <div className="space-y-1.5">
              <label className={`text-sm font-medium ${tw.textPrimary}`}>
                Action Type <span className="text-red-500">*</span>
              </label>
              <HeadlessSelect
                options={ACTION_OPTIONS}
                value={formData.action_type}
                onChange={(value) => setFormData({ ...formData, action_type: String(value) })}
                placeholder="Select an action..."
              />
            </div>
          </div>

          {/* Message Template */}
          <div className="space-y-1.5">
            <label className={`text-sm font-medium ${tw.textPrimary}`}>
              Message Template <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              placeholder="e.g., A new {table_name} has been {action_type}"
              rows={3}
              className={`w-full px-3 py-2 ${tw.rounded} border text-sm transition-colors focus:outline-none resize-none`}
              style={{
                borderColor: color.border.default,
                backgroundColor: color.surface.input,
              }}
              onFocus={(e) => (e.target.style.borderColor = color.primary.action)}
              onBlur={(e) => (e.target.style.borderColor = color.border.default)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 ${tw.rounded} text-sm font-medium transition-colors`}
              style={{
                color: color.primary.action,
                backgroundColor: `${color.primary.action}10`,
                border: `1px solid ${color.primary.action}20`,
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 px-4 py-2 ${tw.rounded} text-sm font-medium text-white transition-colors flex items-center justify-center gap-2`}
              style={{ backgroundColor: color.primary.action }}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingRule ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
