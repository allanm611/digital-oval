import { useState, useRef, useEffect } from "react";
import { Save, Eye, File, X } from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import ModalFooter from "../../../shared/components/ui/ModalFooter";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import CascadingVariableSelector from "../../manual-broadcast/components/CascadingVariableSelector";
import RichTextEditor from "../../communications/components/RichTextEditor";
import PreviewPanel from "../../communications/components/PreviewPanel";
import {
  SMSSmartphonePreview,
  EmailLaptopPreview,
} from "../components/CreativePreviewComponents";
import { color, tw } from "../../../shared/utils/utils";
import { zIndex } from "../../../shared/utils/tokens";
import { useLanguage } from "../../../contexts/LanguageContext";
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
} from "../../../shared/utils/variableInsertion";
import type { TemplateVariable } from "../../manual-broadcast/types";

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
    offer_id?: number;
    channel: CreativeChannel;
    locale: string;
    title: string;
    text_body: string;
    html_body: string;
    is_active: boolean;
    sms_route?: string;
  }>({
    offer_id: undefined,
    channel: "SMS",
    locale: "en",
    title: "",
    text_body: "",
    html_body: "",
    is_active: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isRichText, setIsRichText] = useState(false);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([]);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [variableError, setVariableError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data loading
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [smsRoutes, setSmsRoutes] = useState<any[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [senderIdsLoading, setSenderIdsLoading] = useState(false);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
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
        setChannels(Array.isArray(channelsRes) ? channelsRes : channelsRes?.data || []);
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
        setLanguages(Array.isArray(langData) ? langData : []);
      } catch (err) {
        console.error("Failed to load languages:", err);
      } finally {
        setLanguagesLoading(false);
      }

      try {
        setOffersLoading(true);
        const offersRes = await offerService.searchOffers({ limit: 100 });
        const offersData = offersRes?.data || offersRes || [];
        setOffers(Array.isArray(offersData) ? offersData : []);
      } catch (err) {
        console.error("Failed to load offers:", err);
      } finally {
        setOffersLoading(false);
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

    // Initialize form data
    if (initialCreative && mode === "edit") {
      setFormData({
        offer_id: initialCreative.offer_id,
        channel: initialCreative.channel,
        locale: initialCreative.locale,
        title: initialCreative.title || "",
        text_body: initialCreative.text_body || "",
        html_body: initialCreative.html_body || "",
        is_active: initialCreative.is_active ?? true,
        sms_route: initialCreative.sms_route,
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

  const handleVariableSelect = (variable: TemplateVariable) => {
    if (!selectedVariables.find((v) => v.id === variable.id)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }

    let actualCursorPosition = cursorPosition;
    if (activeField === "title" && titleInputRef.current) {
      actualCursorPosition = titleInputRef.current.selectionStart || 0;
    } else if (activeField === "body" && bodyTextareaRef.current) {
      actualCursorPosition = bodyTextareaRef.current.selectionStart || 0;
    }

    if (activeField === "title") {
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
    setPreviewData({
      rendered_title: formData.title,
      rendered_text_body: formData.text_body,
      rendered_html_body: formData.html_body,
    });
    setShowPreview(true);
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!formData.offer_id) {
      newErrors.offer_id = "Offer is required";
    }
    if (!formData.title) {
      newErrors.title = "Title is required";
    }
    if (!formData.text_body) {
      newErrors.text_body = "Message body is required";
    }
    if (formData.channel === "Email" && !formData.html_body) {
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
        name: formData.title,
        channel: formData.channel,
        locale: formData.locale,
        text_body: formData.text_body,
        is_active: formData.is_active,
      };

      if (mode === "create") {
        if (formData.offer_id) creativeData.offer_id = formData.offer_id;
        if (user?.user_id) creativeData.created_by = user.user_id;
      }

      if (formData.channel !== "SMS" && formData.channel !== "SMS Flash") {
        creativeData.html_body = formData.html_body;
      }

      await onSave(creativeData);
      success("Success", `Creative ${mode === "create" ? "created" : "updated"} successfully`);
      onClose();
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "Failed to save creative");
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="space-y-4">
            {/* Offer Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Offer *
              </label>
              <HeadlessSelect
                value={formData.offer_id ? String(formData.offer_id) : ""}
                onChange={(value) => setFormData((prev) => ({ ...prev, offer_id: value ? Number(value) : undefined }))}
                options={offers.map((offer) => ({ value: String(offer.id), label: offer.name }))}
                placeholder="Select an offer"
                zIndex={zIndex.popover}
                disabled={mode === "edit" || offersLoading}
              />
              {errors.offer_id && (
                <p className="text-xs text-red-600 mt-1">{errors.offer_id}</p>
              )}
            </div>

            {/* Channel & Locale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel
                </label>
                <HeadlessSelect
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
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Locale / Language
                  </label>
                  <button
                    type="button"
                    onClick={() => window.open("/dashboard/languages", "_blank")}
                    className="text-xs text-purple-600 hover:text-purple-700 underline"
                  >
                    Create Language
                  </button>
                </div>
                <HeadlessSelect
                  value={formData.locale}
                  onChange={(value) => setFormData((prev) => ({ ...prev, locale: String(value) }))}
                  options={
                    languages.length > 0
                      ? languages
                          .filter((lang) => lang.is_active)
                          .map((lang) => ({
                            label: lang.name,
                            value: lang.language_code,
                          }))
                      : COMMON_LOCALES.map((locale) => ({
                          label: locale,
                          value: locale,
                        }))
                  }
                  placeholder="Select language"
                  zIndex={zIndex.popover}
                />
              </div>
            </div>

            {/* Creative Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Creative Template
                </label>
                <button
                  type="button"
                  onClick={() => window.open("/dashboard/creative-templates", "_blank")}
                  className="text-xs text-purple-600 hover:text-purple-700 underline"
                >
                  Create Template
                </button>
              </div>
              <HeadlessSelect
                value={selectedTemplate?.id ? String(selectedTemplate.id) : ""}
                onChange={(value) => handleTemplateSelect(value ? Number(value) : "")}
                options={[
                  { label: "Select a template", value: "" },
                  ...templates
                    .filter((t) => t.is_active && t.channel === formData.channel)
                    .map((t) => ({ value: String(t.id), label: t.name }))
                ]}
                placeholder="Select template..."
                zIndex={zIndex.popover}
                disabled={templatesLoading || !formData.channel}
              />
            </div>

            {/* Sender ID (SMS) or Subject (Email/Web) */}
            {formData.channel?.toUpperCase() === "SMS" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sender ID
                </label>
                <HeadlessSelect
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject Line
                </label>
                <Input
                  ref={titleInputRef}
                  placeholder="Enter subject..."
                  maxLength={160}
                  value={formData.title}
                  onChange={(value) => setFormData((prev) => ({ ...prev, title: value }))}
                  onClick={(e) => {
                    setActiveField("title");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  onFocus={(e) => {
                    setActiveField("title");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  variant="medium"
                />
                {errors.title && (
                  <p className="text-xs text-red-600 mt-1">{errors.title}</p>
                )}
              </div>
            )}

            {/* SMS Route */}
            {formData.channel?.toUpperCase() === "SMS" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SMS Route
                </label>
                <HeadlessSelect
                  value={formData.sms_route || ""}
                  onChange={(value) => setFormData((prev) => ({ ...prev, sms_route: value }))}
                  options={
                    smsRoutes
                      ?.filter((route) => route.is_active)
                      .map((route) => ({
                        value: route.id?.toString() || "",
                        label: route.name,
                      })) || []
                  }
                  placeholder="Select SMS Route"
                  zIndex={zIndex.popover}
                  disabled={smsRoutesLoading}
                />
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
                    className="absolute left-0 mt-1"
                    style={{ zIndex: zIndex.popover }}
                  >
                    <CascadingVariableSelector
                      isOpen={showVariableSelector}
                      onClose={() => setShowVariableSelector(false)}
                      onVariableSelect={handleVariableSelect}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body
              </label>
              {isRichText ? (
                <div
                  onClick={() => setActiveField("body")}
                  onFocus={() => setActiveField("body")}
                >
                  <RichTextEditor
                    value={formData.html_body || ""}
                    onChange={(value) => setFormData((prev) => ({ ...prev, html_body: value, text_body: value.replace(/<[^>]*>/g, '') }))}
                    placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                    minHeight="250px"
                  />
                </div>
              ) : (
                <textarea
                  ref={bodyTextareaRef}
                  value={formData.text_body || ""}
                  onChange={(e) => {
                    setActiveField("body");
                    setCursorPosition(e.target.selectionStart || 0);
                    setFormData((prev) => ({ ...prev, text_body: e.target.value }));
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
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

            {/* Active Status */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() =>
              setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))
            }>
              <Checkbox
                id="creative-active"
                checked={formData.is_active}
                onChange={() => setFormData((prev) => ({ ...prev, is_active: !prev.is_active }))}
              />
              <span className="text-sm text-gray-700">Mark creative as active</span>
            </div>

            {/* Buttons */}
            <div className="pt-4">
              <ModalFooter
                onCancel={onClose}
                onConfirm={handleSave}
                cancelText="Cancel"
                confirmText={isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Creative
                  </span>
                )}
                isLoading={isSaving}
                confirmClassName={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center gap-2`}
                confirmStyle={{ backgroundColor: color.primary.action }}
                leftContent={
                  <button
                    onClick={handlePreview}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                }
              />
            </div>
          </div>

          {/* Right Column - Preview (shown when Preview button clicked) */}
          {previewData && (
            <div className="lg:col-span-1 sticky top-4">
              <PreviewPanel
                channel={
                  formData.channel === "SMS"
                    ? "SMS"
                    : formData.channel === "Email"
                      ? "EMAIL"
                      : formData.channel === "WhatsApp"
                        ? "WHATSAPP"
                        : "PUSH"
                }
                title={previewData.rendered_title}
                body={previewData.rendered_text_body || ""}
              />
            </div>
          )}
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
            <div className="space-y-6">
              {/* Device-Specific Previews */}
              {formData.channel === "SMS" ||
              formData.channel === "SMS Flash" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    SMS Preview
                  </h3>
                  <SMSSmartphonePreview
                    message={
                      previewData.rendered_text_body ||
                      previewData.rendered_title ||
                      ""
                    }
                    title={previewData.rendered_title}
                  />
                </div>
              ) : formData.channel === "Email" ? (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Email Preview
                  </h3>
                  <EmailLaptopPreview
                    title={previewData.rendered_title}
                    htmlBody={previewData.rendered_html_body}
                    textBody={previewData.rendered_text_body}
                  />
                </div>
              ) : (
                // Fallback for other channels (Web, USSD, etc.)
                <div className="space-y-4">
                  {previewData.rendered_title && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered Title
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <p className="text-gray-900">
                          {previewData.rendered_title}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewData.rendered_text_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered Text Body
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {previewData.rendered_text_body}
                        </p>
                      </div>
                    </div>
                  )}

                  {previewData.rendered_html_body && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rendered HTML Body
                      </label>
                      <div
                        className={`bg-gray-50 border border-gray-200 ${tw.rounded} p-4`}
                      >
                        <div
                          className="prose max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: previewData.rendered_html_body,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {!previewData.rendered_title &&
                    !previewData.rendered_text_body &&
                    !previewData.rendered_html_body && (
                      <div className="text-center py-8 text-gray-500">
                        <p>
                          No content to preview. Add title, text body, or HTML
                          body.
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No preview available.</p>
            </div>
          )}
        </div>
      </RegularModal>
    </>
  );
}
