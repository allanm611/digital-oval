import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { color, tw, button, getButtonStyles } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { languageService, Language, CreateLanguageRequest } from "../services/languageService";
import { characterSetService, CharacterSet } from "../services/characterSetService";
import { getCountriesList } from "../../../shared/services/countryDataService";

interface LanguageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  editingLanguage: Language | null;
}

const countriesList = getCountriesList();

const countryOptions = countriesList.map((country) => ({
  value: country.name,
  label: `${country.flag} ${country.name} (${country.code})`,
}));

export default function LanguageModal({
  isOpen,
  onClose,
  onSubmit,
  editingLanguage,
}: LanguageModalProps) {
  const { error: showError, success: showSuccess } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCharacterSets, setIsLoadingCharacterSets] = useState(false);
  const [characterSets, setCharacterSets] = useState<CharacterSet[]>([]);
  const [characterSetOptions, setCharacterSetOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    language_code: "",
    country: "",
    character_set: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadCharacterSets();
    }
  }, [isOpen]);

  const loadCharacterSets = async () => {
    setIsLoadingCharacterSets(true);
    try {
      const data = await characterSetService.getCharacterSets();
      setCharacterSets(data || []);
      const options = (data || []).map((cs) => ({
        value: cs.name,
        label: `${cs.name} (${cs.character_set_type})`,
      }));
      setCharacterSetOptions(options);
    } catch (error) {
      console.error("Failed to load character sets:", error);
    } finally {
      setIsLoadingCharacterSets(false);
    }
  };

  useEffect(() => {
    if (editingLanguage) {
      setFormData({
        name: editingLanguage.name,
        description: editingLanguage.description || "",
        language_code: editingLanguage.language_code,
        country: editingLanguage.country || "",
        character_set: editingLanguage.character_set || "",
      });
    } else {
      setFormData({
        name: "",
        description: "",
        language_code: "",
        country: "",
        character_set: "",
      });
    }
  }, [editingLanguage, isOpen]);

  const handleCountryChange = (value: string | number) => {
    const countryName = String(value);
    const selectedCountry = countriesList.find((c) => c.name === countryName);
    setFormData({
      ...formData,
      country: countryName,
      language_code: selectedCountry ? selectedCountry.code.toLowerCase() : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError("Name is required");
      return;
    }

    if (!formData.language_code.trim()) {
      showError("Language code is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateLanguageRequest = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        language_code: formData.language_code.trim(),
        country: formData.country.trim() || undefined,
        character_set: formData.character_set.trim() || undefined,
      };

      if (editingLanguage) {
        await languageService.updateLanguage(editingLanguage.id, payload);
        showSuccess("Language updated successfully");
      } else {
        await languageService.createLanguage(payload);
        showSuccess("Language created successfully");
      }

      onSubmit();
    } catch (error) {
      showError(
        editingLanguage ? "Failed to update language" : "Failed to create language",
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
            {editingLanguage ? "Edit Language" : "Create Language"}
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
            <Input
              label="Name"
              type="text"
              value={formData.name}
              onChange={(value) => setFormData({ ...formData, name: String(value) })}
              placeholder="e.g., English"
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

          {/* Country */}
          <div className="space-y-1.5">
            <HeadlessSelect
              label="Country"
              options={countryOptions}
              value={formData.country}
              onChange={handleCountryChange}
              placeholder="Select a country..."
              searchable={true}
            />
          </div>

          {/* Language Code */}
          <div className="space-y-1.5">
            <Input
              label="Language Code"
              type="text"
              value={formData.language_code}
              onChange={(value) => setFormData({ ...formData, language_code: String(value) })}
              placeholder="e.g., en, en-US, en-GB"
              required
            />
            <p className={`text-xs ${tw.textMuted}`}>
              Auto-filled when you select a country
            </p>
          </div>

          {/* Character Set */}
          <div className="space-y-1.5">
            {isLoadingCharacterSets ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: color.primary.action }} />
                <span className={`text-sm ${tw.textMuted} ml-2`}>Loading...</span>
              </div>
            ) : (
              <HeadlessSelect
                label="Character Set"
                options={characterSetOptions}
                value={formData.character_set}
                onChange={(value) => setFormData({ ...formData, character_set: String(value) })}
                placeholder="Select a character set..."
              />
            )}
          </div>

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
                  {editingLanguage ? "Updating..." : "Creating..."}
                </>
              ) : (
                editingLanguage ? "Update" : "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
