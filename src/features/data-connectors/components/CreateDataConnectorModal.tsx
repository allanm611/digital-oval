import { useState } from "react";
import { X } from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import { tw, color } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";

interface CreateDataConnectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateDataConnectorModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateDataConnectorModalProps) {
  const { success, error } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      error(t.common.name, `${t.common.name} ${t.common.submit.toLowerCase()}`);
      return;
    }

    try {
      setSaving(true);

      // TODO: Replace with actual API call
      // await createDataConnector(formData);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      success(
        "Data Connector Created",
        `${formData.name} has been created successfully`,
      );

      setFormData({
        name: "",
        description: "",
        isActive: true,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      error(
        "Failed to create data connector",
        err instanceof Error ? err.message : "Please try again later",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      setFormData({
        name: "",
        description: "",
        isActive: true,
      });
      onClose();
    }
  };

  return (
    <RegularModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create Data Connector"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connector Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Production Database"
              className={`w-full px-4 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20`}
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description for this connector..."
              rows={3}
              className={`w-full px-4 py-2 border ${tw.borderDefault} ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-[${color.primary.accent}]/20 resize-none`}
              disabled={saving}
            />
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Active status</p>
              <p className="text-xs text-gray-500">
                Check to activate/deactivate
              </p>
            </div>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              disabled={saving}
              className="w-5 h-5 rounded"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium ${tw.rounded} border ${tw.borderDefault} hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{ color: color.text.primary }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            style={{
              backgroundColor: color.primary.action,
              color: "white",
            }}
          >
            {saving ? "Creating..." : "Create Connector"}
          </button>
        </div>
      </form>
    </RegularModal>
  );
}
