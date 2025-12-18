import { useState, useRef } from "react";
import { Mail, MessageSquare, Phone, Bell, AlertCircle, Variable, ChevronDown } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import PreviewPanel from "../../communications/components/PreviewPanel";
import { useLanguage } from "../../../contexts/LanguageContext";
import CascadingVariableSelector from "./CascadingVariableSelector";
import type { TemplateVariable } from "../types";
import { insertVariableAtCursor, formatVariablePlaceholder } from "../utils/variableInsertion";

interface DefineCommunicationStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

export default function DefineCommunicationStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: DefineCommunicationStepProps) {
  const { t } = useLanguage();
  const channels = [
    { id: "EMAIL" as Channel, name: t.manualBroadcast.channelEmail, icon: Mail },
    { id: "SMS" as Channel, name: t.manualBroadcast.channelSMS, icon: MessageSquare },
    { id: "WHATSAPP" as Channel, name: t.manualBroadcast.channelWhatsApp, icon: Phone },
    { id: "PUSH" as Channel, name: t.manualBroadcast.channelPush, icon: Bell },
  ];
  
  const [selectedChannel, setSelectedChannel] = useState<Channel>(data.channel || "EMAIL");
  const [messageTitle, setMessageTitle] = useState(data.messageTitle || "");
  const [messageBody, setMessageBody] = useState(data.messageBody || "");
  const [isRichText, setIsRichText] = useState(data.isRichText || false);
  const [error, setError] = useState("");
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>(
    data.selectedVariables || []
  );
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleVariableSelect = (variable: TemplateVariable) => {
    if (!selectedVariables.find((v) => v.id === variable.id)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }

    if (activeField === "title") {
      const result = insertVariableAtCursor(messageTitle, cursorPosition, variable);
      setMessageTitle(result.newText);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setSelectionRange(result.newCursorPosition, result.newCursorPosition);
          titleInputRef.current.focus();
        }
      }, 0);
    } else {
      if (isRichText) {
        const placeholder = formatVariablePlaceholder(variable);
        setMessageBody(messageBody + " " + placeholder + " ");
      } else {
        const result = insertVariableAtCursor(messageBody, cursorPosition, variable);
        setMessageBody(result.newText);
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

  const getCharacterInfo = () => {
    const charCount = messageBody.length;
    const isUnicode = /[^\x00-\x7F]/.test(messageBody);
    const singleSegmentLimit = isUnicode ? 70 : 160;
    const multiSegmentLimit = isUnicode ? 67 : 153;
    let segments = 1;
    if (charCount > singleSegmentLimit) {
      segments = Math.ceil(charCount / multiSegmentLimit);
    }
    return { charCount, segments, isUnicode };
  };

  const getSampleDataForPreview = (): Record<string, string> => {
    const sampleData: Record<string, string> = {};
    if (data.fileColumns && data.fileColumns.length > 0) {
      data.fileColumns.forEach((col) => {
        sampleData[col] = `[${col}]`;
      });
    }
    selectedVariables.forEach((variable) => {
      const key = `${variable.sourceName.toLowerCase().replace(/\s+/g, "_")}.${variable.value}`;
      switch (variable.fieldType) {
        case "text":
          if (variable.value.includes("name")) sampleData[key] = "John Doe";
          else if (variable.value.includes("email")) sampleData[key] = "john@example.com";
          else if (variable.value.includes("phone")) sampleData[key] = "+1234567890";
          else sampleData[key] = `Sample ${variable.name}`;
          break;
        case "numeric": sampleData[key] = "12345"; break;
        case "date": sampleData[key] = new Date().toLocaleDateString(); break;
        case "boolean": sampleData[key] = "Yes"; break;
        default: sampleData[key] = `[${variable.name}]`;
      }
    });
    return sampleData;
  };

  const handleNext = () => {
    if (!messageBody.trim()) {
      setError(t.manualBroadcast.errorMessageBodyRequired);
      return;
    }
    if (selectedChannel === "EMAIL" && !messageTitle.trim()) {
      setError(t.manualBroadcast.errorSubjectRequired);
      return;
    }
    setError("");
    onUpdate({
      channel: selectedChannel,
      messageTitle: messageTitle.trim(),
      messageBody: messageBody.trim(),
      isRichText,
      selectedVariables,
    });
    onNext();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border" style={{ borderColor: color.border.default }}>
      {/* Header */}
      <div className="p-5 border-b" style={{ borderColor: color.border.default }}>
        <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualBroadcast.defineCommunicationTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualBroadcast.defineCommunicationSubtitle}
        </p>
      </div>

      <div className="p-5">
        {/* Channel Selection - Compact horizontal tabs */}
        <div className="mb-6">
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
            {t.manualBroadcast.channelLabel}
          </label>
          <div className="inline-flex rounded-lg border p-1" style={{ borderColor: color.border.default, backgroundColor: color.surface.cards }}>
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isSelected = selectedChannel === channel.id;
              return (
                <button
                  key={channel.id}
                  type="button"
                  onClick={() => setSelectedChannel(channel.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isSelected ? "white" : "transparent",
                    color: isSelected ? color.primary.accent : color.text.secondary,
                    boxShadow: isSelected ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Message Editor (3/5) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: color.surface.cards }}>
              <span className={`text-sm font-medium ${tw.textPrimary}`}>Message Content</span>
              <div className="flex items-center gap-2">
                {selectedChannel === "EMAIL" && (
                  <button
                    type="button"
                    onClick={() => setIsRichText(!isRichText)}
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
                    <Variable className="w-4 h-4" />
                    <span>Insert Variable</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showVariableSelector ? "rotate-180" : ""}`} />
                  </button>
                  <CascadingVariableSelector
                    isOpen={showVariableSelector}
                    onClose={() => setShowVariableSelector(false)}
                    onVariableSelect={handleVariableSelect}
                  />
                </div>
              </div>
            </div>

            {/* Subject Line for Email */}
            {selectedChannel === "EMAIL" && (
              <div>
                <label className={`text-sm font-medium ${tw.textPrimary} mb-2 block`}>
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={messageTitle}
                  onChange={(e) => {
                    setMessageTitle(e.target.value);
                    setCursorPosition(e.target.selectionStart || 0);
                  }}
                  onClick={(e) => {
                    setActiveField("title");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  onFocus={(e) => {
                    setActiveField("title");
                    setCursorPosition(e.currentTarget.selectionStart || 0);
                  }}
                  placeholder="Enter email subject..."
                  className="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: color.border.default }}
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <label className={`text-sm font-medium ${tw.textPrimary} mb-2 block`}>
                Message Body <span className="text-red-500">*</span>
              </label>
              <textarea
                ref={bodyTextareaRef}
                value={messageBody}
                onChange={(e) => {
                  setMessageBody(e.target.value);
                  setCursorPosition(e.target.selectionStart || 0);
                }}
                onClick={(e) => {
                  setActiveField("body");
                  setCursorPosition(e.currentTarget.selectionStart || 0);
                }}
                onFocus={(e) => {
                  setActiveField("body");
                  setCursorPosition(e.currentTarget.selectionStart || 0);
                }}
                placeholder="Enter your message... Click 'Insert Variable' to add dynamic content like {{customer_identity.first_name}}"
                rows={10}
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                style={{ borderColor: color.border.default }}
              />
              
              {/* Info bar */}
              <div className="mt-2 flex items-center justify-between">
                {(selectedChannel === "SMS" || selectedChannel === "WHATSAPP") ? (
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{getCharacterInfo().charCount} characters</span>
                    <span>{getCharacterInfo().segments} segment(s)</span>
                    {getCharacterInfo().isUnicode && <span className="text-amber-600">Unicode</span>}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">
                    Variables like {"{{field}}"} will be replaced with customer data
                  </span>
                )}
                
                {selectedVariables.length > 0 && (
                  <div className="flex items-center gap-1">
                    {selectedVariables.slice(0, 3).map((v) => (
                      <span
                        key={v.id}
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: `${color.primary.accent}10`, color: color.primary.accent }}
                      >
                        {v.name}
                      </span>
                    ))}
                    {selectedVariables.length > 3 && (
                      <span className="text-xs text-gray-400">+{selectedVariables.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Preview (2/5) */}
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <PreviewPanel
                channel={selectedChannel}
                title={messageTitle}
                body={messageBody}
                sampleData={getSampleDataForPreview()}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mt-6 p-3 rounded-lg flex items-start gap-2"
            style={{ backgroundColor: `${color.status.danger}10`, border: `1px solid ${color.status.danger}30` }}
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: color.status.danger }} />
            <p className="text-sm" style={{ color: color.status.danger }}>{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-5 border-t flex items-center justify-between" style={{ borderColor: color.border.default }}>
        <button
          onClick={onPrevious}
          className="px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ backgroundColor: color.surface.cards, border: `1px solid ${color.border.default}`, color: color.text.primary }}
        >
          {t.manualBroadcast.previous}
        </button>
        <button
          onClick={handleNext}
          disabled={!messageBody.trim() || (selectedChannel === "EMAIL" && !messageTitle.trim())}
          className="px-6 py-2.5 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: color.primary.action }}
        >
          {t.manualBroadcast.nextTest}
        </button>
      </div>
    </div>
  );
}
