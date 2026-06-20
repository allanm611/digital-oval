import { useState, useEffect } from "react";
import { X, Loader2, HelpCircle } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { buttons } from "../../../shared/utils/tokens";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { notificationTypeService, NotificationRule, CreateNotificationRuleRequest } from "../../../shared/services/notificationTypeService";
import { notificationCategoryService } from "../../notifications/services/notificationCategoryService";
import { notificationService } from "../../notifications/services/notificationService";

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
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingEventConditions, setIsLoadingEventConditions] = useState(false);
  const [tableOptions, setTableOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ value: number | string; label: string }>>([]);
  const [eventConditionOptions, setEventConditionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    table_name: "",
    action_type: "",
    event_condition: "",
    message_template: "",
    category_id: "",
  });

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

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const categories = await notificationCategoryService.getNotificationCategories();
      const options = (Array.isArray(categories) ? categories : []).map((cat: any) => ({
        value: String(cat.id || ""),
        label: cat.name || "",
      }));
      setCategoryOptions(options);
    } catch (error) {
      console.error("Failed to load notification categories:", error);
      showError(extractBackendError(error, "Failed to load categories. Please try again."));
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const loadEventConditions = async () => {
    if (!formData.table_name || !formData.action_type) {
      setEventConditionOptions([]);
      return;
    }

    setIsLoadingEventConditions(true);
    try {
      const response = await notificationService.getEventConditions(formData.table_name);
      const options = response.data
        .filter((condition) => condition.action_type === formData.action_type)
        .map((condition) => ({
          value: String(condition.id || ""),
          label: condition.display_name || condition.name || "",
        }));
      setEventConditionOptions(options);
    } catch (error) {
      console.error("Failed to load event conditions:", error);
      setEventConditionOptions([]);
    } finally {
      setIsLoadingEventConditions(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTables();
      loadCategories();
    }
  }, [isOpen]);

  useEffect(() => {
    loadEventConditions();
  }, [formData.table_name, formData.action_type]);

  useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        description: editingRule.description || "",
        table_name: editingRule.table_name,
        action_type: editingRule.action_type,
        event_condition: "",
        message_template: editingRule.message_template,
        category_id: editingRule.category_id || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        table_name: "",
        action_type: "",
        event_condition: "",
        message_template: "",
        category_id: "",
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
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        table_name: formData.table_name,
        action_type: formData.action_type,
        event_condition: formData.event_condition,
        message_template: formData.message_template.trim(),
      };

      if (formData.category_id) {
        payload.category_id = formData.category_id;
      }

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
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div className="space-y-1.5">
            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: String(value) })}
              placeholder="e.g., Campaign Created"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(value) => setFormData({ ...formData, description: value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          {/* Table Name and Action Type on Same Line */}
          <div className="grid grid-cols-2 gap-4">
            {/* Table Name */}
            <HeadlessSelect
              label="Table Name *"
              options={tableOptions}
              value={formData.table_name}
              onChange={(value) => setFormData({ ...formData, table_name: String(value) })}
              placeholder="Select a table..."
              disabled={isLoadingTables}
              searchable={true}
            />

            {/* Action Type */}
            <HeadlessSelect
              label="Action Type *"
              options={ACTION_OPTIONS}
              value={formData.action_type}
              onChange={(value) => setFormData({ ...formData, action_type: String(value) })}
              placeholder="Select an action..."
            />
          </div>

          {/* Event Condition and Category on Same Line */}
          <div className="grid grid-cols-2 gap-4">
            {/* Event Condition */}
            <HeadlessSelect
              label="Event Condition"
              options={eventConditionOptions}
              value={formData.event_condition}
              onChange={(value) => setFormData({ ...formData, event_condition: String(value) })}
              placeholder="Select an event condition..."
              disabled={isLoadingEventConditions || !formData.table_name || !formData.action_type}
              searchable={true}
            />

            {/* Category */}
            <HeadlessSelect
              label="Category"
              options={categoryOptions}
              value={formData.category_id}
              onChange={(value) => setFormData({ ...formData, category_id: String(value) })}
              placeholder="Select a category..."
              disabled={isLoadingCategories}
              searchable={true}
            />
          </div>

          {/* Message Template */}
          <div className="space-y-1.5 relative">
            <Textarea
              label="Message Template *"
              value={formData.message_template}
              onChange={(value) => setFormData({ ...formData, message_template: value })}
              placeholder="e.g., {actor_id} created {table_name} {record_id}"
              rows={3}
              required
            />
            <div className="group absolute top-2 right-3 cursor-pointer" title="">
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 z-10 whitespace-nowrap">
                Use placeholders: {"{record_id}"}, {"{actor_id}"}, {"{table_name}"}, {"{action_type}"}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium transition-colors"
              style={{
                backgroundColor: buttons.bordered.background,
                color: buttons.bordered.color,
                border: buttons.bordered.border,
                padding: `${buttons.bordered.paddingY} ${buttons.bordered.paddingX}`,
                borderRadius: buttons.bordered.borderRadius,
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
              style={{
                backgroundColor: buttons.action.background,
                padding: `${buttons.action.paddingY} ${buttons.action.paddingX}`,
                borderRadius: buttons.action.borderRadius,
              }}
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
