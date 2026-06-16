import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
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
            <Input
              label="Name"
              placeholder="Enter character set name"
              value={formData.name}
              onChange={handleInputChange('name')}
              hasError={!!errors.name}
             
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(value) => handleInputChange('description')(value)}
              rows={2}
            />
          </div>

          {/* Grid for select fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Message Type */}
            <div>
              <HeadlessSelect
                label="Message Type*"
                options={MESSAGE_TYPE_OPTIONS}
                value={formData.message_type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    message_type: value as typeof formData.message_type,
                  }))
                }
              />
            </div>

            {/* Character Set Type */}
            <div>
              <HeadlessSelect
                label="Character Set Type*"
                options={CHARSET_TYPE_OPTIONS}
                value={formData.character_set_type}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    character_set_type: value as typeof formData.character_set_type,
                  }))
                }
              />
            </div>

            {/* Character Set Size */}
            <div>
              <Input
                type="number"
                label="Character Set Size"
                value={formData.character_set_size}
                onChange={handleInputChange('character_set_size')}
                placeholder="e.g., 160"
              />
            </div>
          </div>

          {/* Standard Characters */}
          <div>
            <Textarea
              label="Standard Characters"
              value={formData.standard_chars}
              onChange={(value) => handleInputChange('standard_chars')(value)}
              rows={3}
              hasError={!!errors.standard_chars}
              className="font-mono"
              required
            />
            {errors.standard_chars && (
              <p className="mt-1 text-sm text-red-600">
                {errors.standard_chars}
              </p>
            )}
          </div>

          {/* Optional Character Fields */}
          <div className="space-y-6">
            <Textarea
              label="Double Characters (optional)"
              value={formData.double_chars}
              onChange={(value) => handleInputChange('double_chars')(value)}
              rows={2}
              className="font-mono"
            />

            <Textarea
              label="Triple Characters (optional)"
              value={formData.triple_chars}
              onChange={(value) => handleInputChange('triple_chars')(value)}
              rows={2}
              className="font-mono"
            />

            <Textarea
              label="Quad Characters (optional)"
              value={formData.quad_chars}
              onChange={(value) => handleInputChange('quad_chars')(value)}
              rows={2}
              className="font-mono"
            />
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
            handleCheckboxChange('is_active')(!formData.is_active)
          }>
            <Checkbox
              id="charset-active"
              checked={formData.is_active}
              onChange={handleCheckboxChange('is_active')}
            />
            <label className={`text-sm font-medium ${tw.textPrimary} cursor-pointer`}>
              Active
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: "transparent",
                color: color.primary.action,
                border: `1px solid ${color.primary.action}`,
              }}
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
              {isSaving ? (characterSet ? "Updating..." : "Creating...") : characterSet ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
