import { useState, useRef, useEffect } from "react";
import { Save, Eye, File, X, Send } from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import ModalFooter from "../../../shared/components/ui/ModalFooter";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import TypeSelector from "../../../shared/components/TypeSelector";
import CascadingVariableSelector from "../../manual-broadcast/components/CascadingVariableSelector";
import RichTextEditor from "../../communications/components/RichTextEditor";
import CreativePreviewRenderer from "../components/CreativePreviewRenderer";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import { useLanguage } from "../../../contexts/LanguageContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import { senderIdService, SenderId } from "../../configurations/services/senderIdService";
import { smsRouteService } from "../../routes/services/smsRouteService";
import { languageService, Language } from "../../configurations/services/languageService";
import { creativeTemplateService } from "../../configurations/services/creativeTemplateService";
import { communicationChannelService, CommunicationChannel } from "../../../shared/services/communicationChannelService";
import { offerService } from "../services/offerService";
import {
  OfferCreative,
  CreativeChannel,
  COMMON_LOCALES,
  VALID_CHANNELS,
} from "../types/offerCreative";
import {
  insertVariableAtCursor,
  formatVariablePlaceholder,
  validateInsertPosition,
  validateNoEditInsideVariables,
  isCursorInsideVariable,
} from "../../../shared/utils/variableInsertion";
import type { TemplateVariable } from "../../manual-broadcast/types";
import CreateLanguageModal from "./CreateLanguageModal";
import CreativeTemplateFormModal from "./CreativeTemplateFormModal";
import { supportsHtmlBody, requiresHtmlBody } from "../utils/channelUtils";
import SendTestModal from "../../../shared/components/SendTestModal";

interface OfferCreativeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (creative: any) => Promise<void>;
  initialCreative?: OfferCreative | null;
  mode?: "create" | "edit";
}

const replaceVariables = (
  text: string,
  variables: Record<string, string | number | boolean>,
): string => {
  if (!text) return "";
  let result = text;
  Object.keys(variables).forEach((key) => {
    const value = String(variables[key]);
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(regex, value);
  });
  return result;
};

const getBaseChannel = (channelName: string): string => {
  if (!channelName) return "SMS";
  const upperName = channelName.toUpperCase();

  // Extract base channel from full channel name (e.g., "SMS Normal" → "SMS")
  const validChannels = ["EMAIL", "SMS", "USSD", "WHATSAPP", "PUSH"];
  for (const valid of validChannels) {
    if (upperName.includes(valid)) {
      return valid;
    }
  }
  return "SMS";
};

const getCharacterInfo = (text: string) => {
  const charCount = text.length;
  const isUnicode = /[^\x00-\x7F]/.test(text);
  const singleSegmentLimit = isUnicode ? 70 : 160;
  const multiSegmentLimit = isUnicode ? 67 : 153;
  let segments = 1;
  if (charCount > singleSegmentLimit) {
    segments = Math.ceil(charCount / multiSegmentLimit);
  }
  const remainingInSegment = charCount % multiSegmentLimit;
  const remaining =
    segments === 1
      ? singleSegmentLimit - charCount
      : multiSegmentLimit - remainingInSegment;
  return { charCount, segments, isUnicode, remaining: Math.max(0, remaining) };
};

export default function OfferCreativeFormModal({
  isOpen,
  onClose,
  onSave,
  initialCreative,
  mode = "create",
}: OfferCreativeFormModalProps) {
  const { t } = useLanguage();
  const { success, error: showError } = useToast();
  const { user } = useAuth();

  // Form state
  const [formData, setFormData] = useState<{
    channel: CreativeChannel;
    locale: string;
    title: string;
    text_body: string;
    html_body: string;
    is_active: boolean;
  }>({
    channel: "SMS",
    locale: "en",
    title: "",
    text_body: "",
    html_body: "",
    is_active: true,
  });
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | string>("");  // Track language ID for dropdown

  const [isSaving, setIsSaving] = useState(false);
  const [isRichText, setIsRichText] = useState(false);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([]);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [variableError, setVariableError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Data loading
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [smsRoutes, setSmsRoutes] = useState<any[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [senderIdsLoading, setSenderIdsLoading] = useState(false);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Preview state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data on mount
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        setChannelsLoading(true);
        const channelsRes = await communicationChannelService.getAll();
        const loadedChannels = Array.isArray(channelsRes) ? channelsRes : channelsRes?.data || [];
        setChannels(loadedChannels);

        // Initialize form with loaded channels
        if (!initialCreative || mode === "create") {
          const defaultChannel =
            loadedChannels.find((ch) => ch.is_active && ch.name === "SMS Normal")?.name ||
            loadedChannels.find((ch) => ch.is_active && ch.name?.includes("SMS"))?.name ||
            loadedChannels.find((ch) => ch.is_active)?.name ||
            "SMS Normal";
          setFormData((prev) => ({
            ...prev,
            channel: defaultChannel as CreativeChannel,
          }));
        }
      } catch (err) {
        console.error("Failed to load channels:", err);
      } finally {
        setChannelsLoading(false);
      }

      try {
        setSenderIdsLoading(true);
        const senderIdsRes = await senderIdService.getSenderIds();
        setSenderIds(Array.isArray(senderIdsRes) ? senderIdsRes : senderIdsRes?.data || []);
      } catch (err) {
        console.error("Failed to load sender IDs:", err);
      } finally {
        setSenderIdsLoading(false);
      }

      try {
        setSmsRoutesLoading(true);
        const routesRes = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(routesRes) ? routesRes : routesRes?.data || []);
      } catch (err) {
        console.error("Failed to load SMS routes:", err);
      } finally {
        setSmsRoutesLoading(false);
      }

      try {
        setLanguagesLoading(true);
        const langRes = await languageService.getLanguages();
        const langData = langRes?.data || langRes || [];
        const loadedLanguages = Array.isArray(langData) ? langData : [];
        setLanguages(loadedLanguages);

        // Initialize language
        if (initialCreative && mode === "edit") {
          const matchingLang = loadedLanguages.find((l) => l.language_code === initialCreative.locale);
          if (matchingLang) setSelectedLanguageId(matchingLang.id);
        } else {
          const defaultLang = loadedLanguages.find((l) => l.language_code === "en");
          if (defaultLang) setSelectedLanguageId(defaultLang.id);
          else setSelectedLanguageId("");
        }
      } catch (err) {
        console.error("Failed to load languages:", err);
      } finally {
        setLanguagesLoading(false);
      }

      try {
        setTemplatesLoading(true);
        const templatesRes = await creativeTemplateService.getCreativeTemplates();
        const templatesData = templatesRes?.data || templatesRes || [];
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
      } catch (err) {
        console.error("Failed to load creative templates:", err);
      } finally {
        setTemplatesLoading(false);
      }
    };

    loadData();

    // Initialize form data for edit mode
    if (initialCreative && mode === "edit") {
      setFormData({
        channel: initialCreative.channel,
        locale: initialCreative.locale,
        title: initialCreative.title || "",
        text_body: initialCreative.text_body || "",
        html_body: initialCreative.html_body || "",
        is_active: initialCreative.is_active ?? true,
      });
    } else {
      setFormData({
        channel: "SMS",
        locale: "en",
        title: "",
        text_body: "",
        html_body: "",
        is_active: true,
      });
    }

    setIsRichText(false);
    setSelectedVariables([]);
    setActiveField("body");
    setVariableError("");
  }, [isOpen, initialCreative, mode]);

  useEffect(() => {
    setPreviewData({
      rendered_title: formData.title,
      rendered_text_body: formData.text_body,
      rendered_html_body: formData.html_body,
    });
  }, [formData.title, formData.text_body, formData.html_body]);

  // Auto-enable Rich Text for Email channels
  useEffect(() => {
    if (formData.channel === "Email") {
      setIsRichText(true);
    }
  }, [formData.channel]);

  const handleVariableSelect = (variable: TemplateVariable) => {
    if (!selectedVariables.find((v) => v.id === variable.id)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }

    const isRichTextMode = formData.channel === "Email" || isRichText;

    if (activeField === "title") {
      let actualCursorPosition = cursorPosition;
      if (titleInputRef.current) {
        actualCursorPosition = titleInputRef.current.selectionStart || 0;
      }

      const positionError = validateInsertPosition(formData.title || "", actualCursorPosition);
      if (positionError) {
        setVariableError(positionError);
        return;
      }

      const result = insertVariableAtCursor(formData.title || "", actualCursorPosition, variable);
      if (result.error) {
        setVariableError(result.error);
        return;
      }

      setFormData((prev) => ({ ...prev, title: result.newText }));
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
          titleInputRef.current.focus();
        }
      }, 0);
    } else {
      if (isRichTextMode) {
        // For Rich Text mode: append variable
        const placeholder = formatVariablePlaceholder(variable);
        const bodyField = formData.channel === "Email" ? (formData.html_body || "") : (formData.text_body || "");
        const newBody = `${bodyField} ${placeholder} `;
        setFormData((prev) => ({
          ...prev,
          ...(formData.channel === "Email" ? { html_body: newBody, text_body: newBody } : { text_body: newBody }),
        }));
        setVariableError("");
      } else {
        // For Plain Text mode: cursor-based insertion
        let actualCursorPosition = cursorPosition;
        if (bodyTextareaRef.current) {
          actualCursorPosition = bodyTextareaRef.current.selectionStart || 0;
        }

        const positionError = validateInsertPosition(formData.text_body || "", actualCursorPosition);
        if (positionError) {
          setVariableError(positionError);
          return;
        }

        const result = insertVariableAtCursor(formData.text_body || "", actualCursorPosition, variable);
        if (result.error) {
          setVariableError(result.error);
          return;
        }

        setFormData((prev) => ({ ...prev, text_body: result.newText }));
        setTimeout(() => {
          if (bodyTextareaRef.current) {
            bodyTextareaRef.current.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
            bodyTextareaRef.current.focus();
          }
        }, 0);
      }
    }

    setShowVariableSelector(false);
  };

  const handleTemplateSelect = (templateId: number | "") => {
    if (!templateId) {
      setSelectedTemplate(null);
      return;
    }
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setFormData((prev) => ({
        ...prev,
        title: template.title || prev.title,
        text_body: template.body_text || "",
        html_body: template.body_html || "",
      }));
    }
  };

  const handlePreview = () => {
    // Build variables object with default values from selected variables
    const previewVars: Record<string, string | number | boolean> = {};
    selectedVariables.forEach((v) => {
      // Variables are referenced as {{sourceValue.fieldValue}} in content
      const variableKey = `${v.sourceValue}.${v.value}`;
      previewVars[variableKey] = v.defaultValue ?? `Sample ${v.name}`;
    });

    setPreviewData({
      rendered_title: replaceVariables(formData.title, previewVars),
      rendered_text_body: replaceVariables(formData.text_body, previewVars),
      rendered_html_body: replaceVariables(formData.html_body, previewVars),
    });
    setShowPreview(true);
  };

  const handleLanguageCreated = (language: Language) => {
    setLanguages((prev) => [...prev, language]);
    setIsLanguageModalOpen(false);
    setFormData((prev) => ({ ...prev, locale: language.language_code }));
    setSelectedLanguageId(language.id);
    success("Success", `Language "${language.name}" created successfully`);
  };

  const handleTemplateCreated = async (template: any) => {
    setTemplates((prev) => [...prev, template]);
    setIsTemplateModalOpen(false);
    handleTemplateSelect(template.id);
    success("Success", `Template "${template.name}" created successfully`);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title) {
      newErrors.title = "Title is required";
    }
    if (!formData.text_body) {
      newErrors.text_body = "Message body is required";
    }
    if (requiresHtmlBody(formData.channel) && !formData.html_body) {
      newErrors.text_body = "HTML content is required for Email channel";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      setIsSaving(true);
      const creativeData: any = {
        channel: formData.channel,
        locale: formData.locale,
        text_body: formData.text_body,
        is_active: formData.is_active,
      };

      if (mode === "create") {
        creativeData.name = formData.title;
        if (user?.user_id) creativeData.created_by = user.user_id;
      } else {
        creativeData.title = formData.title;
      }

      // Only include html_body for non-SMS channels
      const isSmsPlatform = formData.channel?.toUpperCase().includes("SMS") || formData.channel?.toUpperCase().includes("USSD");
      if (!isSmsPlatform && formData.html_body) {
        creativeData.html_body = formData.html_body;
      }

      await onSave(creativeData);
      success("Success", `Creative ${mode === "create" ? "created" : "updated"} successfully`);
      onClose();
    } catch (err) {
      showError("Error", extractBackendError(err, "Error. Please try again."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <RegularModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${mode === "create" ? "Add" : "Edit"} Creative`}
        size="2xl"
      >
        <div className="space-y-6">

            {/* Channel & Locale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <HeadlessSelect
                label="Channel"
                value={formData.channel}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, channel: value as CreativeChannel }));
                  setSelectedTemplate(null);
                }}
                options={channels
                  .filter((ch) => ch.is_active)
                  .map((ch) => ({ value: ch.name, label: ch.name }))}
                placeholder="Select a channel"
                zIndex={zIndex.popover}
                disabled={channelsLoading}
              />
              <TypeSelector
                label="Locale / Language"
                options={
                  languages.length > 0
                    ? languages
                        .filter((lang) => lang.is_active)
                        .map((lang) => ({
                          label: lang.name,
                          value: lang.id,
                        }))
                    : COMMON_LOCALES.map((locale) => ({
                        label: locale,
                        value: locale,
                      }))
                }
                value={selectedLanguageId}
                onChange={(value) => {
                  setSelectedLanguageId(value);
                  if (languages.length > 0) {
                    const selectedLang = languages.find((l) => l.id === value);
                    if (selectedLang) {
                      setFormData((prev) => ({ ...prev, locale: selectedLang.language_code }));
                    }
                  } else {
                    setFormData((prev) => ({ ...prev, locale: String(value) }));
                  }
                }}
                placeholder="Select language"
                allowCreate={true}
                onCreate={() => setIsLanguageModalOpen(true)}
              />
            </div>

            {/* Creative Template */}
            {(() => {
              const baseChannel = getBaseChannel(formData.channel);
              const filteredTemplates = templates.filter((t) => t.is_active && t.channel?.toUpperCase() === baseChannel?.toUpperCase());
              return (
                <TypeSelector
                  label="Creative Template (Optional)"
                  options={[
                    { label: "Select a template", value: "" },
                    ...filteredTemplates.map((t) => ({ value: String(t.id), label: t.name }))
                  ]}
                  value={selectedTemplate?.id ? String(selectedTemplate.id) : ""}
                  onChange={(value) => handleTemplateSelect(value ? Number(value) : "")}
                  placeholder="Select template..."
                  disabled={templatesLoading || !formData.channel}
                  allowCreate={true}
                  onCreate={() => setIsTemplateModalOpen(true)}
                />
              );
            })()}

            {/* Sender ID (SMS) or Subject (Email/Web) */}
            {formData.channel?.toUpperCase() === "SMS" ? (
              <div>
                <HeadlessSelect
                  label="Sender ID"
                  value={formData.title || ""}
                  onChange={(value) => setFormData((prev) => ({ ...prev, title: value || "" }))}
                  options={[
                    { label: "Select Sender ID", value: "" },
                    ...senderIds.filter((s) => s.is_active).map((s) => ({ label: s.name, value: s.name })),
                  ]}
                  placeholder="Select Sender ID..."
                  zIndex={zIndex.popover}
                  disabled={senderIdsLoading}
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                )}
              </div>
            ) : (
              <div>
                <Input
                  label="Subject Line"
                  ref={titleInputRef}
                  placeholder="Enter subject..."
                  maxLength={160}
                  value={formData.title}
                  onChange={(value) => {
                    // Validate and show error, but allow text update
                    const editError = validateNoEditInsideVariables(formData.title || "", value);
                    if (editError) {
                      setVariableError(editError);
                    } else {
                      setVariableError("");
                    }
                    setFormData((prev) => ({ ...prev, title: value }));
                  }}
                  onClick={(e) => {
                    setActiveField("title");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  onFocus={(e) => {
                    setActiveField("title");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                 
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                )}
              </div>
            )}


            {/* Message Content Toolbar */}
            <div
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ backgroundColor: color.surface.cards }}
            >
              <span className={`text-sm font-medium ${tw.textPrimary}`}>
                Message Content
              </span>
              <div className="flex items-center gap-2">
                {formData.channel !== "Email" && (
                  <button
                    type="button"
                    onClick={() => setIsRichText((prev) => !prev)}
                    className="px-3 py-1.5 text-sm rounded-md border transition-colors"
                    style={{
                      backgroundColor: isRichText ? `${color.primary.accent}10` : "white",
                      borderColor: isRichText ? color.primary.accent : color.border.default,
                      color: isRichText ? color.primary.accent : color.text.secondary,
                    }}
                  >
                    {isRichText ? "Rich Text" : "Plain Text"}
                  </button>
                )}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowVariableSelector(!showVariableSelector)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                    style={{
                      backgroundColor: color.primary.accent,
                      color: "white",
                    }}
                  >
                    Insert Variable
                  </button>
                  <div
                    className="absolute right-0 mt-1"
                    style={{ zIndex: zIndex.popover }}
                  >
                    <CascadingVariableSelector
                      isOpen={showVariableSelector}
                      onClose={() => setShowVariableSelector(false)}
                      onVariableSelect={handleVariableSelect}
                      openToLeft={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              {formData.channel === "Email" || isRichText ? (
                <div
                  onClick={() => setActiveField("body")}
                  onFocus={() => setActiveField("body")}
                >
                  <RichTextEditor
                    value={formData.channel === "Email" ? (formData.html_body || "") : (formData.text_body || "")}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        ...(formData.channel === "Email" ? { html_body: value, text_body: value } : { text_body: value }),
                      }));
                    }}
                    placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                    minHeight="250px"
                    onVariableError={setVariableError}
                  />
                </div>
              ) : (
                <Textarea
                  ref={bodyTextareaRef}
                  label="Message Body"
                  value={formData.text_body || ""}
                  onChange={(value) => {
                    setActiveField("body");
                    if (bodyTextareaRef.current) {
                      setCursorPosition(bodyTextareaRef.current.selectionStart || 0);
                    }
                    setFormData((prev) => ({ ...prev, text_body: value, ...(formData.channel === "Email" && { html_body: value }) }));
                  }}
                  onKeyDown={(e) => {
                    const textarea = e.currentTarget;
                    const cursorPos = textarea.selectionStart || 0;
                    if (isCursorInsideVariable(formData.text_body || "", cursorPos)) {
                      e.preventDefault();
                      setVariableError("You can't edit inside a variable");
                    } else {
                      setVariableError("");
                    }
                  }}
                  onClick={(e) => {
                    setActiveField("body");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  onFocus={(e) => {
                    setActiveField("body");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  placeholder="Enter your message..."
                  rows={8}
                />
              )}
              {variableError && <div className="mt-2 text-sm text-red-700">{variableError}</div>}
              {errors.text_body && <div className="mt-2 text-xs text-red-600">{errors.text_body}</div>}

              {/* Info bar */}
              <div className="mt-2 flex items-center justify-between">
                {formData.channel === "SMS" || formData.channel === "SMS Flash" || formData.channel === "WhatsApp" ? (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {getCharacterInfo(formData.text_body || "").charCount} characters
                    </span>
                    {getCharacterInfo(formData.text_body || "").segments > 1 && (
                      <span>
                        {getCharacterInfo(formData.text_body || "").segments} segments
                      </span>
                    )}
                    {getCharacterInfo(formData.text_body || "").isUnicode && (
                      <span className="text-amber-600">Unicode</span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">
                    Variables like {"{{"}{"{"}field{"}"}{"}}"} will be replaced with customer data
                  </span>
                )}
                {selectedVariables.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedVariables.slice(0, 3).map((v) => (
                      <span
                        key={v.id}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: `${color.primary.accent}10`,
                          color: color.primary.accent,
                        }}
                      >
                        {v.name}
                      </span>
                    ))}
                    {selectedVariables.length > 3 && (
                      <span className="text-xs text-gray-400">
                        +{selectedVariables.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-4">
              <ModalFooter
                onCancel={onClose}
                onConfirm={handleSave}
                cancelText="Cancel"
                confirmText={isSaving ? (
                  mode === "edit" ? "Updating..." : "Creating..."
                ) : (
                  mode === "edit" ? "Update" : "Create"
                )}
                isLoading={isSaving}
                confirmClassName={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center gap-2`}
                confirmStyle={{ backgroundColor: color.primary.action }}
                leftContent={
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreview}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50`}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </button>
                    <button
                      onClick={() => setIsTestModalOpen(true)}
                      disabled={!formData.channel}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors border border-gray-300 ${
                        formData.channel
                          ? "text-gray-700 hover:bg-gray-50"
                          : "text-gray-400 bg-gray-50 cursor-not-allowed"
                      }`}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Test
                    </button>
                  </div>
                }
              />
            </div>
        </div>
      </RegularModal>

      {/* Preview Creative Modal */}
      <RegularModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setPreviewData(null);
        }}
        title="Creative Preview"
        size="2xl"
      >
        <div className="space-y-6">
          {previewData ? (
            <CreativePreviewRenderer
              channel={formData.channel}
              title={previewData.rendered_title}
              textBody={previewData.rendered_text_body}
              htmlBody={previewData.rendered_html_body}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No preview available.</p>
            </div>
          )}
        </div>
      </RegularModal>

      {/* Create Language Modal */}
      <CreateLanguageModal
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        onLanguageCreated={handleLanguageCreated}
      />

      {/* Create Creative Template Modal */}
      <CreativeTemplateFormModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={async (formData) => {
          const response = await creativeTemplateService.createCreativeTemplate(formData);
          const newTemplate = response.data;
          if (newTemplate) {
            const template = Array.isArray(newTemplate) ? newTemplate[0] : newTemplate;
            await handleTemplateCreated(template);
          }
        }}
      />

      {/* Send Test Modal */}
      <SendTestModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        channel={formData.channel}
        title={formData.title}
        textBody={formData.text_body}
        htmlBody={formData.html_body}
      />
    </>
  );
}
