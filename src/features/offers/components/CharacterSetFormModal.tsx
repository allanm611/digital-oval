import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import type { CharacterSet } from "../../configurations/types/characterSetType";

interface CharacterSetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  characterSet?: CharacterSet | null;
}

const MESSAGE_TYPE_OPTIONS = [
  { value: "SMS", label: "SMS" },
  { value: "FLASH_SMS", label: "Flash SMS" },
  { value: "UNICODE", label: "Unicode" },
  { value: "BINARY", label: "Binary" },
  { value: "USSD", label: "USSD" },
];

const CHARSET_TYPE_OPTIONS = [
  { value: "GSM7", label: "GSM7" },
  { value: "UCS2", label: "UCS2" },
  { value: "UTF8", label: "UTF8" },
  { value: "ISO-8859-1", label: "ISO-8859-1" },
];

export default function CharacterSetFormModal({
  isOpen,
  onClose,
  onSave,
  characterSet,
}: CharacterSetFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
    message_type: "SMS" as const,
    character_set_type: "GSM7" as const,
    character_set_size: 160,
    standard_chars: "",
    double_chars: "",
    triple_chars: "",
    quad_chars: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (characterSet) {
      setFormData({
        name: characterSet.name || "",
        description: characterSet.description || "",
        is_active: characterSet.is_active ?? true,
        message_type: characterSet.message_type,
        character_set_type: characterSet.character_set_type,
        character_set_size: characterSet.character_set_size,
        standard_chars: characterSet.standard_chars || "",
        double_chars: characterSet.double_chars || "",
        triple_chars: characterSet.triple_chars || "",
        quad_chars: characterSet.quad_chars || "",
      });
      setErrors({});
    }
  }, [characterSet, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.standard_chars.trim()) {
      newErrors.standard_chars = "Standard characters are required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (fieldName: keyof typeof formData) => (value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (fieldName: keyof typeof formData) => (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: checked,
    }));
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
            {characterSet ? "Edit Character Set" : "Create Character Set"}
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
            <Input
              placeholder="Enter character set name"
              value={formData.name}
              onChange={handleInputChange('name')}
              hasError={!!errors.name}
              variant="medium"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
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
              onChange={handleTextareaChange}
              rows={2}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              placeholder="Enter description (optional)"
            />
          </div>

          {/* Grid for select fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message Type */}
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Message Type
                <span className="text-red-600">*</span>
              </label>
              <select
                name="message_type"
                value={formData.message_type}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MESSAGE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Character Set Type */}
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Character Set Type
                <span className="text-red-600">*</span>
              </label>
              <select
                name="character_set_type"
                value={formData.character_set_type}
                onChange={handleSelectChange}
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHARSET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Character Set Size */}
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Character Set Size
                <span className="text-red-600">*</span>
              </label>
              <Input type="number"
                value={formData.character_set_size}
                onChange={handleInputChange('character_set_size')}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 160"
              />
            </div>
          </div>

          {/* Standard Characters */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Standard Characters
              <span className="text-red-600">*</span>
            </label>
            <textarea
              name="standard_chars"
              value={formData.standard_chars}
              onChange={handleTextareaChange}
              rows={3}
              className={`w-full px-3 py-2 border ${
                errors.standard_chars ? "border-red-500" : "border-gray-300"
              } ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              placeholder="Enter standard characters"
            />
            {errors.standard_chars && (
              <p className="mt-1 text-sm text-red-600">
                {errors.standard_chars}
              </p>
            )}
          </div>

          {/* Optional Character Fields */}
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Double Characters
              </label>
              <textarea
                name="double_chars"
                value={formData.double_chars}
                onChange={handleTextareaChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter double characters (optional)"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Triple Characters
              </label>
              <textarea
                name="triple_chars"
                value={formData.triple_chars}
                onChange={handleTextareaChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter triple characters (optional)"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Quad Characters
              </label>
              <textarea
                name="quad_chars"
                value={formData.quad_chars}
                onChange={handleTextareaChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Enter quad characters (optional)"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center">
            <Input
              type="checkbox"
              checked={formData.is_active}
              onChange={handleCheckboxChange('is_active')}
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
              {isSaving ? "Saving..." : characterSet ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
