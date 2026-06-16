import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import type { CreativeTemplate } from "../../configurations/services/creativeTemplateService";
import { languageService, Language } from "../../configurations/services/languageService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;

interface CreativeTemplateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  template?: CreativeTemplate | null;
  defaultChannelId?: number;
  defaultLocale?: string;
  communicationChannels?: Array<{ id: number; name: string; code: string }>;
}

export default function CreativeTemplateFormModal({
  isOpen,
  onClose,
  onSave,
  template,
  defaultChannelId,
  defaultLocale = "en",
  communicationChannels = [],
}: CreativeTemplateFormModalProps) {
  const { error: showError } = useToast();
  // Get the default channel name from the communicationChannels
  const getDefaultChannelName = () => {
    if (!defaultChannelId || !communicationChannels || communicationChannels.length === 0) {
      return "";
    }
    const channel = communicationChannels.find(ch => ch.id === defaultChannelId);
    return channel?.name || "";
  };

  const defaultChannelName = getDefaultChannelName();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    primaryChannel: defaultChannelName,
    locale: defaultLocale,
    title: "",
    text_body: "",
    html_body: "",
    variables: {} as Record<string, any>,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [channelOptions, setChannelOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [languages, setLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const loadData = async () => {
      // Use actual channels passed as props
      if (communicationChannels && communicationChannels.length > 0) {
        const options = communicationChannels.map((ch) => ({
          label: ch.name,
          value: ch.name,
        }));
        setChannelOptions(options);
      } else {
        setChannelOptions([]);
      }

      try {
        const response = await languageService.getLanguages();
        const langData = Array.isArray(response) ? response : response?.data || [];
        setLanguages(langData.filter((l: Language) => l.is_active));
      } catch {
        setLanguages([]);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, communicationChannels]);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || "",
        code: template.code || "",
        description: template.description || "",
        primaryChannel: template.channel,
        locale: template.locale || "en",
        title: template.title || "",
        text_body: template.body_text || "",
        html_body: template.body_html || "",
        variables: template.variables || {},
      });
      setErrors({});
    } else if (isOpen && !template) {
      // Reset form with default values when opening for new template creation
      setFormData({
        name: "",
        code: "",
        description: "",
        primaryChannel: getDefaultChannelName(),
        locale: defaultLocale,
        title: "",
        text_body: "",
        html_body: "",
        variables: {} as Record<string, any>,
      });
      setErrors({});
    }
  }, [template, isOpen, defaultChannelId, defaultLocale, communicationChannels]);

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

  // Map channel name to enum value for submission
  const mapChannelNameToEnum = (channelName: string): string => {
    const nameUpper = channelName.toUpperCase();
    if (nameUpper.includes("WHATSAPP")) return "WhatsApp";
    if (nameUpper.includes("EMAIL")) return "Email";
    if (nameUpper.includes("SMS")) return "SMS";
    if (nameUpper.includes("PUSH")) return "Push";
    if (nameUpper.includes("USSD")) return "USSD";
    return channelName; // Fallback
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const dataToSubmit = {
      ...formData,
      primaryChannel: mapChannelNameToEnum(formData.primaryChannel),
    };

    try {
      setIsSaving(true);
      await onSave(dataToSubmit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save template";
      showError("Error", extractBackendError(error, "Error. Please try again."));
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
            <Input
              label="Name"
              placeholder="Enter template name"
              value={formData.name}
              onChange={handleInputChange('name')}
              hasError={!!errors.name}
             
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Code */}
          <div>
            <Input
              label="Code"
              placeholder="e.g., WELCOME_SMS"
              value={formData.code}
              onChange={handleInputChange('code')}
              hasError={!!errors.code}
             
              className="font-mono"
              required
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code}</p>
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

          {/* Channel and Locale */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HeadlessSelect
              label="Channel *"
              value={formData.primaryChannel}
              onChange={(value) => setFormData((prev) => ({ ...prev, primaryChannel: value as any }))}
              options={channelOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
              placeholder="Select a channel"
              zIndex={zIndex.popover}
            />

            <HeadlessSelect
              label="Language"
              value={
                formData.locale
                  ? languages.find((lang) => lang.language_code === formData.locale)?.id?.toString() || ""
                  : ""
              }
              onChange={(value) => {
                const selectedLang = languages.find((lang) => lang.id === parseInt(value));
                setFormData((prev) => ({
                  ...prev,
                  locale: selectedLang?.language_code || "",
                }));
              }}
              options={[
                { value: "", label: "Select a language" },
                ...languages.map((lang) => ({ value: lang.id.toString(), label: lang.name }))
              ]}
              placeholder="Select a language"
              zIndex={zIndex.popover}
            />
          </div>

          {/* Title */}
          <div>
            <Input
              label="Title"
              type="text"
              value={formData.title}
              onChange={handleInputChange('title')}
              placeholder="Template title (optional)"
            />
          </div>

          {/* Text Body */}
          <div>
            <Textarea
              label="Text Body"
              value={formData.text_body}
              onChange={(value) => handleInputChange('text_body')(value)}
              rows={3}
            />
          </div>

          {/* HTML Body */}
          <div>
            <Textarea
              label="HTML Body"
              value={formData.html_body}
              onChange={(value) => handleInputChange('html_body')(value)}
              rows={3}
              className="font-mono"
            />
            {errors.body && (
              <p className="mt-1 text-sm text-red-600">{errors.body}</p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-6">
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
              {isSaving ? (template ? "Updating..." : "Creating...") : template ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
