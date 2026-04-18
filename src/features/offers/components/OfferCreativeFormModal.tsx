import { useState, useRef, useEffect } from "react";
import { Save, Eye, File, X } from "lucide-react";
import RegularModal from "../../../shared/components/ui/RegularModal";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import CascadingVariableSelector from "../../manual-broadcast/components/CascadingVariableSelector";
import PreviewPanel from "../../communications/components/PreviewPanel";
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
    channel: CreativeChannel;
    locale: string;
    title: string;
    text_body: string;
    html_body: string;
    is_active: boolean;
    sms_route?: string;
  }>({
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

  // Data loading
  const [channels, setChannels] = useState<CommunicationChannel[]>([]);
  const [senderIds, setSenderIds] = useState<SenderId[]>([]);
  const [smsRoutes, setSmsRoutes] = useState<any[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [senderIdsLoading, setSenderIdsLoading] = useState(false);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(false);
  const [languagesLoading, setLanguagesLoading] = useState(false);

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
    };

    loadData();

    // Initialize form data
    if (initialCreative && mode === "edit") {
      setFormData({
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

  const handlePreview = () => {
    setPreviewData({
      rendered_title: formData.title,
      rendered_text_body: formData.text_body,
      rendered_html_body: formData.html_body,
    });
    setShowPreview(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.text_body) {
      showError("Validation Error", "Title and message body are required");
      return;
    }

    try {
      setIsSaving(true);
      const creativeData = {
        channel: formData.channel,
        locale: formData.locale,
        title: formData.title,
        text_body: formData.text_body,
        html_body: formData.html_body,
        is_active: formData.is_active,
        sms_route: formData.sms_route,
        ...(user?.user_id && { created_by: user.user_id }),
      };

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
            {/* Channel & Locale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Channel
                </label>
                <HeadlessSelect
                  value={formData.channel}
                  onChange={(value) => setFormData((prev) => ({ ...prev, channel: value as CreativeChannel }))}
                  options={channels
                    .filter((ch) => ch.is_active)
                    .map((ch) => ({ value: ch.name, label: ch.name }))}
                  placeholder="Select a channel"
                  zIndex={zIndex.popover}
                  disabled={channelsLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Locale / Language
                </label>
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

            {/* Sender ID - Always visible */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender ID
              </label>
              <HeadlessSelect
                value={formData.title}
                onChange={(value) => setFormData((prev) => ({ ...prev, title: value || "" }))}
                options={[
                  { label: "Select Sender ID", value: "" },
                  ...senderIds.filter((s) => s.is_active).map((s) => ({ label: s.name, value: s.name })),
                ]}
                placeholder="Select Sender ID..."
                zIndex={zIndex.popover}
                disabled={senderIdsLoading}
              />
            </div>

            {/* Subject Line - For non-SMS channels */}
            {formData.channel?.toUpperCase() !== "SMS" && (
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
                <div style={{ zIndex: zIndex.popover }}>
                  <CascadingVariableSelector
                    isOpen={showVariableSelector}
                    onClose={() => setShowVariableSelector(false)}
                    onVariableSelect={handleVariableSelect}
                  />
                </div>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body
              </label>
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
              {variableError && <div className="mt-2 text-sm text-red-700">{variableError}</div>}
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
            <div className="flex items-center justify-between gap-4 pt-4">
              <button
                onClick={handlePreview}
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${tw.rounded} transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </button>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className={`px-4 py-2 text-gray-700 bg-gray-100 ${tw.rounded} hover:bg-gray-200 transition-colors disabled:opacity-50`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 py-2 text-white ${tw.rounded} transition-colors disabled:opacity-50 flex items-center gap-2`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Creative
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
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

      {/* Preview Modal */}
      <RegularModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title="Preview"
        size="2xl"
      >
        {previewData && (
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
        )}
      </RegularModal>
    </>
  );
}
