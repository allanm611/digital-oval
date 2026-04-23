import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import Input from "../../../shared/components/ui/Input";
import Checkbox from "../../../shared/components/ui/Checkbox";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { languageService, Language } from "../../configurations/services/languageService";
import { characterSetService, CharacterSet } from "../../configurations/services/characterSetService";
import { useToast } from "../../../contexts/ToastContext";
import { zIndex } from "../../../shared/utils/tokens";

interface CreateLanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLanguageCreated: (language: Language) => void;
}

const COUNTRIES_LIST = [
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
  { value: "FR", label: "France" },
  { value: "DE", label: "Germany" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "PT", label: "Portugal" },
  { value: "BR", label: "Brazil" },
  { value: "MX", label: "Mexico" },
  { value: "AR", label: "Argentina" },
  { value: "KE", label: "Kenya" },
  { value: "UG", label: "Uganda" },
  { value: "TZ", label: "Tanzania" },
  { value: "ZA", label: "South Africa" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "EG", label: "Egypt" },
  { value: "SA", label: "Saudi Arabia" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "IN", label: "India" },
  { value: "CN", label: "China" },
  { value: "JP", label: "Japan" },
  { value: "KR", label: "South Korea" },
  { value: "RU", label: "Russia" },
  { value: "TR", label: "Turkey" },
];

export default function CreateLanguageModal({
  isOpen,
  onClose,
  onLanguageCreated,
}: CreateLanguageModalProps) {
  const { error: showError, success } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    language_code: "",
    description: "",
    country: "",
    character_set: "",
    is_active: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [characterSets, setCharacterSets] = useState<CharacterSet[]>([]);
  const [loadingCharacterSets, setLoadingCharacterSets] = useState(false);

  // Fetch character sets on mount or when modal opens
  useEffect(() => {
    const fetchCharacterSets = async () => {
      try {
        setLoadingCharacterSets(true);
        const response = await characterSetService.getCharacterSets();
        const sets = Array.isArray(response) ? response : response?.data || [];
        setCharacterSets(sets.filter((cs: CharacterSet) => cs.is_active));
      } catch (error) {
        console.error("Failed to fetch character sets:", error);
        setCharacterSets([]);
      } finally {
        setLoadingCharacterSets(false);
      }
    };

    if (isOpen) {
      fetchCharacterSets();
      setFormData({
        name: "",
        language_code: "",
        description: "",
        country: "",
        character_set: "",
        is_active: true,
      });
      setErrors({});
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.language_code.trim()) {
      newErrors.language_code = "Language code is required";
    }
    if (!formData.country) {
      newErrors.country = "Country is required";
    }
    if (!formData.character_set) {
      newErrors.character_set = "Character set is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSelectChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, is_active: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const createdLanguage = await languageService.createLanguage({
        name: formData.name,
        language_code: formData.language_code,
        description: formData.description || undefined,
        country: formData.country,
        character_set: formData.character_set,
        is_active: formData.is_active,
      });

      success("Success", `Language "${formData.name}" created successfully`);
      onLanguageCreated(createdLanguage);
      onClose();
    } catch (err) {
      showError(
        "Error",
        err instanceof Error ? err.message : "Failed to create language"
      );
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
            Create Language
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
              Name <span className="text-red-600">*</span>
            </label>
            <Input
              placeholder="e.g., English, French"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              hasError={!!errors.name}
              variant="medium"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Language Code */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Language Code <span className="text-red-600">*</span>
            </label>
            <Input
              placeholder="e.g., en, fr, es, sw"
              value={formData.language_code}
              onChange={(value) => handleInputChange("language_code", value)}
              hasError={!!errors.language_code}
              variant="medium"
              className="font-mono"
            />
            {errors.language_code && (
              <p className="mt-1 text-sm text-red-600">{errors.language_code}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 border border-gray-300 ${tw.rounded} text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
              placeholder="Enter description (optional)"
            />
          </div>

          {/* Country and Character Set */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Country <span className="text-red-600">*</span>
              </label>
              <HeadlessSelect
                value={formData.country}
                onChange={(value) => handleSelectChange("country", value)}
                options={COUNTRIES_LIST}
                placeholder="Search or select a country"
                zIndex={zIndex.popover}
                searchable={true}
              />
              {errors.country && (
                <p className="mt-1 text-sm text-red-600">{errors.country}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
                Character Set <span className="text-red-600">*</span>
              </label>
              <HeadlessSelect
                value={formData.character_set}
                onChange={(value) => handleSelectChange("character_set", value)}
                options={characterSets.map((cs) => ({
                  value: cs.character_set_type,
                  label: cs.name,
                }))}
                placeholder="Select character set"
                zIndex={zIndex.popover}
                disabled={loadingCharacterSets}
              />
              {errors.character_set && (
                <p className="mt-1 text-sm text-red-600">{errors.character_set}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
            handleCheckboxChange(!formData.is_active)
          }>
            <Checkbox
              id="language-active"
              checked={formData.is_active}
              onChange={handleCheckboxChange}
            />
            <label className={`text-sm font-medium ${tw.textPrimary} cursor-pointer`}>
              Mark language as active
            </label>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6">
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
              {isSaving ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
