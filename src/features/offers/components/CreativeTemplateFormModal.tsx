import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import type { CreativeTemplate } from "../../configurations/services/creativeTemplateService";

interface CreativeTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  template?: CreativeTemplate | null;
}

const CHANNEL_OPTIONS = [
  { value: "SMS", label: "SMS" },
  { value: "Email", label: "Email" },
  { value: "Push", label: "Push" },
  { value: "InApp", label: "In-App" },
  { value: "Web", label: "Web" },
  { value: "IVR", label: "IVR" },
  { value: "USSD", label: "USSD" },
  { value: "WhatsApp", label: "WhatsApp" },
];

export default function CreativeTemplateFormModal({
  isOpen,
  onClose,
  onSave,
  template,
}: CreativeTemplateFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    is_active: true,
    primaryChannel: "SMS" as const,
    locale: "en",
    title: "",
    text_body: "",
    html_body: "",
    variables: {} as Record<string, any>,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        code: template.code || "",
        description: template.description || "",
        is_active: template.is_active ?? true,
        primaryChannel: template.channel,
        locale: template.locale || "en",
        title: template.title || "",
        text_body: template.body_text || "",
        html_body: template.body_html || "",
        variables: template.variables || {},
      });
      setErrors({});
    }
  }, [template, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
    }
    if (!formData.text_body.trim() && !formData.html_body.trim()) {
      newErrors.body = "Either text body or HTML body is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
            {template ? "Edit Creative Template" : "Create Creative Template"}
          </h2>
          <button
            onClick={onClose}
            className={`text-gray-400 hover:text-gray-600 ${tw.rounded}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Name
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter template name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Code
              <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={`w-full px-3 py-2 border ${
                errors.code ? "border-red-500" : "border-gray-300"
              } ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono`}
              placeholder="e.g., WELCOME_SMS"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={2}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              placeholder="Enter description (optional)"
            />
          </div>

          {/* Channel and Locale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Channel
                <span className="text-red-600">*</span>
              </label>
              <select
                name="primaryChannel"
                value={formData.primaryChannel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHANNEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Locale
              </label>
              <input
                type="text"
                name="locale"
                value={formData.locale}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., en, fr, es"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Template title (optional)"
            />
          </div>

          {/* Text Body */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Text Body
            </label>
            <textarea
              name="text_body"
              value={formData.text_body}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Enter template text body"
            />
          </div>

          {/* HTML Body */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              HTML Body
            </label>
            <textarea
              name="html_body"
              value={formData.html_body}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              placeholder="Enter template HTML body"
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
            />
            <label className={`ml-2 text-sm font-medium ${tw.textPrimary}`}>
              Active
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-white rounded text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              style={{ backgroundColor: color.primary.action }}
            >
              {isSaving && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {isSaving ? "Saving..." : template ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
