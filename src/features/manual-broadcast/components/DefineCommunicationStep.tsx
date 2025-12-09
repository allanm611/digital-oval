import { useState, useEffect } from "react";
import { Mail, MessageSquare, Phone, Bell, AlertCircle } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import MessageEditor from "../../communications/components/MessageEditor";
import PreviewPanel from "../../communications/components/PreviewPanel";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { useLanguage } from "../../../contexts/LanguageContext";

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
    {
      id: "EMAIL" as Channel,
      name: t.manualBroadcast.channelEmail,
      icon: Mail,
      description: t.manualBroadcast.channelEmailDesc,
    },
    {
      id: "SMS" as Channel,
      name: t.manualBroadcast.channelSMS,
      icon: MessageSquare,
      description: t.manualBroadcast.channelSMSDesc,
    },
    {
      id: "WHATSAPP" as Channel,
      name: t.manualBroadcast.channelWhatsApp,
      icon: Phone,
      description: t.manualBroadcast.channelWhatsAppDesc,
    },
    {
      id: "PUSH" as Channel,
      name: t.manualBroadcast.channelPush,
      icon: Bell,
      description: t.manualBroadcast.channelPushDesc,
    },
  ];
  const [selectedChannel, setSelectedChannel] = useState<Channel>(
    data.channel || "EMAIL"
  );
  const [messageTitle, setMessageTitle] = useState(data.messageTitle || "");
  const [messageBody, setMessageBody] = useState(data.messageBody || "");
  const [isRichText, setIsRichText] = useState(data.isRichText || false);
  const [error, setError] = useState("");
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableColumns();
  }, []);

  const loadAvailableColumns = async () => {
    if (!data.uploadType) return;

    try {
      const response = await quicklistService.getUploadTypes({
        activeOnly: true,
      });
      if (response.success) {
        const uploadType = response.data?.find(
          (t) => t.upload_type === data.uploadType
        );
        if (uploadType && uploadType.expected_columns) {
          let columns: string[] = [];
          if (Array.isArray(uploadType.expected_columns)) {
            columns = uploadType.expected_columns;
          } else if (
            typeof uploadType.expected_columns === "object" &&
            uploadType.expected_columns !== null
          ) {
            columns = Object.keys(uploadType.expected_columns);
          }
          setAvailableColumns(columns);
        }
      }
    } catch (err) {
      console.error("Failed to load available columns:", err);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    setSelectedChannel(channel);
  };

  const handleToggleRichText = () => {
    setIsRichText(!isRichText);
  };

  const handleNext = () => {
    // Validation
    if (!messageBody.trim()) {
      setError(t.manualBroadcast.errorMessageBodyRequired);
      return;
    }

    if (selectedChannel === "EMAIL" && !messageTitle.trim()) {
      setError(t.manualBroadcast.errorSubjectRequired);
      return;
    }

    setError("");

    // Update data
    onUpdate({
      channel: selectedChannel,
      messageTitle: messageTitle.trim(),
      messageBody: messageBody.trim(),
      isRichText: isRichText,
    });

    // Move to next step
    onNext();
  };

  return (
    <div
      className="bg-white rounded-md shadow-sm border"
      style={{ borderColor: color.border.default }}
    >
      <div
        className="p-4 sm:p-6 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-lg sm:text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualBroadcast.defineCommunicationTitle}
        </h2>
        <p className={`text-xs sm:text-sm ${tw.textSecondary} mt-1`}>
          {t.manualBroadcast.defineCommunicationSubtitle}
        </p>
      </div>

      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Channel & Message Editor */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Channel Selection */}
            <div>
              <label
                className={`block text-sm font-medium ${tw.textPrimary} mb-2`}
              >
                {t.manualBroadcast.channelLabel}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2">
                {channels.map((channel) => {
                  const Icon = channel.icon;
                  const isSelected = selectedChannel === channel.id;
                  return (
                    <button
                      key={channel.id}
                      type="button"
                      onClick={() => handleChannelSelect(channel.id)}
                      className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-md border-2 transition-all"
                      style={{
                        borderColor: isSelected
                          ? color.primary.accent
                          : color.border.default,
                        backgroundColor: isSelected
                          ? `${color.primary.accent}10`
                          : "white",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: isSelected
                            ? color.primary.accent
                            : color.surface.cards,
                        }}
                      >
                        <Icon
                          className="w-4 h-4"
                          style={{
                            color: isSelected ? "white" : color.text.secondary,
                          }}
                        />
                      </div>
                      <div className="text-center">
                        <p
                          className={`text-sm font-semibold ${
                            isSelected ? tw.textPrimary : tw.textSecondary
                          }`}
                        >
                          {channel.name}
                        </p>
                        <p
                          className={`text-xs ${tw.textMuted} mt-0.5 hidden sm:block`}
                        >
                          {channel.description}
                        </p>
                      </div>
                      {isSelected && (
                        <div
                          className="w-1 h-1 rounded-full"
                          style={{ backgroundColor: color.primary.accent }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Editor */}
            <div>
              <MessageEditor
                title={messageTitle}
                body={messageBody}
                channel={selectedChannel}
                availableVariables={availableColumns}
                onTitleChange={setMessageTitle}
                onBodyChange={setMessageBody}
                isRichText={isRichText}
                onToggleRichText={handleToggleRichText}
              />
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-6">
              <PreviewPanel
                channel={selectedChannel}
                title={messageTitle}
                body={messageBody}
                sampleData={{}}
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="mt-4 sm:mt-6 p-3 rounded-md flex items-start space-x-2"
            style={{
              backgroundColor: `${color.status.danger}10`,
              border: `1px solid ${color.status.danger}30`,
            }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: color.status.danger }}
            />
            <p className="text-sm" style={{ color: color.status.danger }}>
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
        style={{ borderColor: color.border.default }}
      >
        <button
          onClick={onPrevious}
          className="w-full sm:w-auto px-6 py-2.5 rounded-md transition-all text-sm font-semibold whitespace-nowrap"
          style={{
            backgroundColor: color.surface.cards,
            border: `1px solid ${color.border.default}`,
            color: color.text.primary,
          }}
        >
          {t.manualBroadcast.previous}
        </button>
        <button
          onClick={handleNext}
          disabled={
            !messageBody.trim() ||
            (selectedChannel === "EMAIL" && !messageTitle.trim())
          }
          className="w-full sm:w-auto px-6 py-2.5 text-white rounded-md transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          style={{ backgroundColor: color.primary.action }}
        >
          {t.manualBroadcast.nextTest}
        </button>
      </div>
    </div>
  );
}
