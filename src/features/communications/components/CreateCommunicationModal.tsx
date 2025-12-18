import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Send, CheckCircle, XCircle } from "lucide-react";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import ChannelSelector from "./ChannelSelector";
import MessageEditor from "./MessageEditor";
import PreviewPanel from "./PreviewPanel";
import TemplateSelector from "./TemplateSelector";
import { MessageTemplate } from "../types/template";
import { communicationService } from "../services/communicationService";
import { quicklistService } from "../../quicklists/services/quicklistService";
import {
  CommunicationChannel,
  CommunicationResult,
} from "../types/communication";
import { QuickList } from "../../quicklists/types/quicklist";

interface CreateCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist: QuickList;
  onSuccess?: (result: CommunicationResult) => void;
}

export default function CreateCommunicationModal({
  isOpen,
  onClose,
  quicklist,
  onSuccess,
}: CreateCommunicationModalProps) {
  // State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CommunicationResult | null>(null);

  // Form state
  const [selectedChannel, setSelectedChannel] =
    useState<CommunicationChannel>("EMAIL");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sampleData, setSampleData] = useState<Record<string, unknown>>({});
  const [isRichText, setIsRichText] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadSampleData();
    } else {
      // Reset form when modal closes
      setResult(null);
      setMessageTitle("");
      setMessageBody("");
      setSelectedChannel("EMAIL");
      setIsRichText(false);
      setShowTemplates(true);
    }
  }, [isOpen]);

  const loadSampleData = useCallback(async () => {
    try {
      setLoading(true);
      // Load sample data (first row) for preview
      const dataResponse = await quicklistService.getQuickListData(
        quicklist.id,
        { limit: 1 }
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
    } catch (error) {
      console.error("Failed to load sample data:", error);
    } finally {
      setLoading(false);
    }
  }, [quicklist.id]);

  const handleSelectTemplate = (template: MessageTemplate) => {
    setMessageTitle(template.subject || "");
    setMessageBody(template.body);
    setIsRichText(template.isRichText);
    setShowTemplates(false);
  };

  const handleToggleRichText = () => {
    setIsRichText(!isRichText);
  };

  const handleSend = async () => {
    // Strip HTML tags if sending to non-EMAIL channels
    const cleanBody =
      selectedChannel !== "EMAIL" && isRichText
        ? messageBody.replace(/<[^>]*>/g, "")
        : messageBody;

    if (!cleanBody.trim()) {
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
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (error) {
      console.error("Failed to send communication:", error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      onClose();
    }
  };

  const getSuccessRate = () => {
    if (!result) return 0;
    return result.total_recipients > 0
      ? Math.round((result.total_messages_sent / result.total_recipients) * 100)
      : 0;
  };

  if (!isOpen) return null;

  // Show result screen if communication was sent
  if (result) {
    const successRate = getSuccessRate();
    const isSuccess = successRate >= 80;

    return createPortal(
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        style={{ zIndex: zIndex.modal }}
      >
        <div
          className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col`}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-4 mb-4">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                {isSuccess ? (
                  <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 sm:w-12 sm:h-12 text-red-600 flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {isSuccess
                      ? "Communication Sent Successfully!"
                      : "Communication Completed with Errors"}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 break-all">
                    Execution ID: {result.execution_id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 hover:bg-white ${tw.rounded} transition-colors flex-shrink-0`}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 bg-gray-50 ${tw.rounded}`}
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
          <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className={`w-full sm:w-auto px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
            >
              Close
            </button>
            <button
              onClick={() => setResult(null)}
              className={`w-full sm:w-auto px-6 py-2 text-sm font-medium text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
            >
              Send Another
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  // Main form
  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      <div
        className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Send Communication
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Sending to:{" "}
              <span className="font-semibold text-gray-700 break-words">
                {quicklist.name}
              </span>{" "}
              ({quicklist.row_count || 0} recipients)
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={sending}
            className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors disabled:opacity-50 self-start sm:self-auto flex-shrink-0`}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-12">
            <LoadingSpinner variant="modern" size="lg" color="primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {/* Left Column - Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Channel Selection */}
                <div>
                  <ChannelSelector
                    selectedChannel={selectedChannel}
                    onChannelChange={setSelectedChannel}
                  />
                </div>

                {/* Template Selection */}
                {showTemplates && (
                  <div>
                    <TemplateSelector
                      channel={selectedChannel}
                      onSelectTemplate={handleSelectTemplate}
                      onCreateNew={() => setShowTemplates(false)}
                    />
                  </div>
                )}

                {/* Message Editor */}
                <div>
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
                    onToggleRichText={handleToggleRichText}
                  />
                  {!showTemplates && (
                    <button
                      type="button"
                      onClick={() => setShowTemplates(true)}
                      className="mt-3 text-sm font-medium"
                      style={{ color: color.primary.accent }}
                    >
                      ← Back to Templates
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-0">
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
        )}

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={sending}
            className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !messageBody.trim()}
            className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 text-sm font-semibold text-white ${tw.rounded} transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
                <span className="hidden sm:inline">
                  Send Now to {quicklist.row_count || 0} Recipients
                </span>
                <span className="sm:hidden">Send Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
