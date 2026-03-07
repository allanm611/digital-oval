import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, XCircle } from "lucide-react";

import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { tw, color } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ChannelSelector from "../components/ChannelSelector";
import MessageEditor from "../components/MessageEditor";
import PreviewPanel from "../components/PreviewPanel";
import { communicationService } from "../services/communicationService";
import { quicklistService } from "../../quicklists/services/quicklistService";
import { useToast } from "../../../contexts/ToastContext";
import {
  CommunicationChannel,
  CommunicationResult,
} from "../types/communication";
import { QuickList } from "../../quicklists/types/quicklist";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  useFormDataPersistence,
  clearPersistedFormData,
} from "../../../shared/hooks/useFormDataPersistence";
import { useFormCleanupOnExit } from "../../../shared/hooks/useFormCleanupOnExit";

export default function CreateCommunicationPage() {
  const { quicklistId } = useParams<{ quicklistId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { success: showToast, error: showError } = useToast();

  // State
  const [quicklist, setQuickList] = useState<QuickList | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CommunicationResult | null>(null);

  // Form state
  const [selectedChannel, setSelectedChannel] =
    useState<CommunicationChannel>("EMAIL");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sampleData, setSampleData] = useState<Record<string, unknown>>({});
  const [isRichText, setIsRichText] = useState(false);

  // Persist form data to localStorage
  useFormDataPersistence("communication_channel", selectedChannel, setSelectedChannel, false);
  useFormDataPersistence("communication_title", messageTitle, setMessageTitle, false);
  useFormDataPersistence("communication_body", messageBody, setMessageBody, false);

  // Clear persisted form data when user exits the creation flow
  useFormCleanupOnExit("communication_channel");
  useFormCleanupOnExit("communication_title");
  useFormCleanupOnExit("communication_body");

  useEffect(() => {
    if (quicklistId) {
      loadQuickListAndData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quicklistId]);

  const loadQuickListAndData = async () => {
    try {
      setLoading(true);

      // Load QuickList details
      const qlResponse = await quicklistService.getQuickListById(
        parseInt(quicklistId!),
        true,
      );
      setQuickList(qlResponse.data);

      // Load sample data (first row) for preview
      const dataResponse = await quicklistService.getQuickListData(
        parseInt(quicklistId!),
        { limit: 1 },
      );
      if (dataResponse.data && dataResponse.data.length > 0) {
        const firstRow = dataResponse.data[0];
        // Remove metadata fields
        if (firstRow && typeof firstRow === "object") {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, quicklist_id, created_at, ...cleanData } =
            firstRow as Record<string, unknown>;
          setSampleData(cleanData as Record<string, unknown>);
        }
      }
    } catch (_error) {
      console.error("Failed to load quicklist:", _error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!quicklist || !messageBody.trim()) {
      return;
    }

    try {
      setSending(true);
      setResult(null);

      const response = await communicationService.sendCommunication({
        source_type: "quicklist",
        source_id: quicklist.id,
        channels: [selectedChannel],
        message_template: {
          ...(messageTitle && selectedChannel === "EMAIL"
            ? { title: messageTitle }
            : {}),
          body: messageBody,
        },
        filters: {
          column_conditions: [],
          limit: 1000,
        },
        batch_size: 500,
        created_by: 1, // TODO: Get from auth context
      });

      if (response.success) {
        setResult(response.data);
      }
    } catch (_error) {
      // Backend not fixed yet - show error
      showError("Error", "Failed to create communication");
    } finally {
      setSending(false);
    }
  };

  const getSuccessRate = () => {
    if (!result) return 0;
    return result.total_recipients > 0
      ? Math.round((result.total_messages_sent / result.total_recipients) * 100)
      : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  if (!quicklist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className={tw.textMuted}>{t.common.noData}</p>
      </div>
    );
  }

  // Show result screen if communication was sent
  if (result) {
    const successRate = getSuccessRate();
    const isSuccess = successRate >= 80;

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div
            className={`bg-white ${tw.rounded} shadow-sm border border-gray-200 overflow-hidden`}
          >
            {/* Header */}
            <div
              className={`p-6 ${
                isSuccess
                  ? "bg-green-50 border-b border-green-200"
                  : "bg-red-50 border-b border-red-200"
              }`}
            >
              <div className="flex items-center space-x-4">
                {isSuccess ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
                <div>
                  <h2
                    className={`text-2xl font-bold ${
                      isSuccess ? "text-green-900" : "text-red-900"
                    }`}
                  >
                    {isSuccess
                      ? "Communication Sent Successfully!"
                      : "Communication Completed with Errors"}
                  </h2>
                  <p
                    className={`text-sm ${
                      isSuccess ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    Execution ID: {result.execution_id}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className={`bg-gray-50 ${tw.rounded} p-4`}>
                  <p className="text-xs text-gray-500 font-medium mb-1">
                    Total Recipients
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {result.total_recipients}
                  </p>
                </div>
                <div className={`bg-green-50 ${tw.rounded} p-4`}>
                  <p className="text-xs text-green-600 font-medium mb-1">
                    Messages Sent
                  </p>
                  <p className="text-2xl font-bold text-green-700">
                    {result.total_messages_sent}
                  </p>
                </div>
                <div className={`bg-red-50 ${tw.rounded} p-4`}>
                  <p className="text-xs text-red-600 font-medium mb-1">
                    Messages Failed
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {result.total_messages_failed}
                  </p>
                </div>
                <div className={`bg-blue-50 ${tw.rounded} p-4`}>
                  <p className="text-xs text-blue-600 font-medium mb-1">
                    Execution Time
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {result.execution_time_ms}ms
                  </p>
                </div>
              </div>

              {/* Channel Breakdown */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Channel Breakdown
                </h3>
                {result.channel_summaries.map((summary) => (
                  <div
                    key={summary.channel}
                    className={`flex items-center justify-between p-3 bg-gray-50 ${tw.rounded}`}
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {summary.channel}
                    </span>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="text-green-600">
                        ✓ {summary.messages_sent} sent
                      </span>
                      <span className="text-red-600">
                        ✗ {summary.messages_failed} failed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-gray-50 border-t flex items-center justify-between">
              <button
                onClick={() => navigate("/dashboard/manual-communications")}
                className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
              >
                Back to Manual Communications
              </button>
              <button
                onClick={() => setResult(null)}
                className={`px-6 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
                style={{ backgroundColor: color.primary.action }}
              >
                Send Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() =>
              navigateBackOrFallback(navigate, "/dashboard/quick-lists")
            }
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to QuickLists</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Send Communication
          </h1>
          <p className={`${tw.textMuted} mt-2`}>
            Sending to:{" "}
            <span className="font-semibold text-gray-700">
              {quicklist.name}
            </span>{" "}
            ({quicklist.row_count || 0} recipients)
          </p>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Channel Selection */}
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
            >
              <ChannelSelector
                selectedChannel={selectedChannel}
                onChannelChange={setSelectedChannel}
              />
            </div>

            {/* Message Editor */}
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6`}
            >
              <MessageEditor
                title={messageTitle}
                body={messageBody}
                channel={selectedChannel}
                availableVariables={
                  quicklist.columns || Object.keys(sampleData)
                }
                onTitleChange={setMessageTitle}
                onBodyChange={setMessageBody}
                isRichText={isRichText}
                onToggleRichText={() => setIsRichText(!isRichText)}
              />
            </div>

            {/* Send Button */}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => navigate("/dashboard/manual-communications")}
                className={`px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !messageBody.trim()}
                className={`px-8 py-3 text-sm font-semibold text-white ${tw.rounded} transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {sending ? (
                  <>
                    <LoadingSpinner variant="modern" size="sm" color="white" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      Send Now to {quicklist.row_count || 0} Recipients
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="lg:col-span-1">
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 sticky top-6`}
            >
              <PreviewPanel
                channel={selectedChannel}
                title={messageTitle}
                body={messageBody}
                sampleData={sampleData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
