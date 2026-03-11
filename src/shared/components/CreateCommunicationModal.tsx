import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Send,
  CheckCircle,
  XCircle,
  Mail,
  MessageSquare,
  Phone,
  Bell,
  AlertCircle,
  Variable,
  ChevronDown,
  Settings,
} from "lucide-react";
import { color, tw, components, zIndex } from "../utils/utils";
import LoadingSpinner from "./ui/LoadingSpinner";
import PreviewPanel from "../../features/communications/components/PreviewPanel";
import RichTextEditor from "../../features/communications/components/RichTextEditor";
import { communicationService } from "../../features/communications/services/communicationService";
import { quicklistService } from "../../features/quicklists/services/quicklistService";
import {
  CommunicationChannel,
  CommunicationResult,
} from "../../features/communications/types/communication";
import { QuickList } from "../../features/quicklists/types/quicklist";
import CascadingVariableSelector from "../../features/manual-broadcast/components/CascadingVariableSelector";
import HeadlessSelect from "./ui/HeadlessSelect";
import { useConfigurationData } from "../services/configurationDataService";
import { useToast } from "../../contexts/ToastContext";
import { useClickOutside } from "../hooks/useClickOutside";
import {
  insertVariableAtCursor,
  formatVariablePlaceholder,
} from "../utils/variableInsertion";
import type { TemplateVariable } from "../../features/manual-broadcast/types";
import { CommunicationPolicyConfiguration } from "../../features/campaigns/types/communicationPolicyConfig";
import { communicationPolicyService } from "../../features/campaigns/services/communicationPolicyService";
import CommunicationPolicyModal from "../../features/campaigns/components/CommunicationPolicyModal";
import PolicyNameModal from "../../features/campaigns/components/PolicyNameModal";
import { Segment } from "../../features/segments/types/segment";

interface CreateCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist?: QuickList;
  segment?: Segment;
  onSuccess?: (result: CommunicationResult) => void;
}

type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

export default function CreateCommunicationModal({
  isOpen,
  onClose,
  quicklist,
  segment,
  onSuccess,
}: CreateCommunicationModalProps) {
  const { data: smsRoutes } = useConfigurationData("smsRoutes");
  const { error: showError } = useToast();

  const channels = [
    { id: "EMAIL" as Channel, name: "Email", icon: Mail },
    { id: "SMS" as Channel, name: "SMS", icon: MessageSquare },
    { id: "WHATSAPP" as Channel, name: "WhatsApp", icon: Phone },
    { id: "PUSH" as Channel, name: "Push", icon: Bell },
  ];

  // State
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<CommunicationResult | null>(null);

  // Form state
  const [selectedChannel, setSelectedChannel] = useState<Channel>("EMAIL");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [isRichText, setIsRichText] = useState(false);
  const [smsRoute, setSmsRoute] = useState("");
  const [error, setError] = useState("");
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>(
    []
  );

  const titleInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Communication Policy states
  const [communicationPolicies, setCommunicationPolicies] = useState<
    CommunicationPolicyConfiguration[]
  >([]);
  const [selectedPolicy, setSelectedPolicy] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [isPolicyDropdownOpen, setIsPolicyDropdownOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] =
    useState(false);
  const [policyToCustomize, setPolicyToCustomize] =
    useState<CommunicationPolicyConfiguration | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [pendingPolicyData, setPendingPolicyData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const policyDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(policyDropdownRef, () => setIsPolicyDropdownOpen(false));

  useEffect(() => {
    if (isOpen) {
      // Load initial policies
      setCommunicationPolicies(communicationPolicyService.getAllPolicies());

      // Subscribe to policy changes
      const unsubscribe = communicationPolicyService.subscribe(
        (updatedPolicies) => {
          setCommunicationPolicies(updatedPolicies);
        }
      );

      return unsubscribe;
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      // Nothing to load for quicklist - we'll use its columns directly
      setLoading(false);
    } else {
      // Reset form when modal closes
      setResult(null);
      setMessageTitle("");
      setMessageBody("");
      setSelectedChannel("EMAIL");
      setIsRichText(false);
      setSmsRoute("");
      setError("");
      setShowVariableSelector(false);
      setSelectedVariables([]);
      setSelectedPolicy(null);
    }
  }, [isOpen]);

  const handleVariableSelect = (variable: TemplateVariable) => {
    if (!selectedVariables.find((v) => v.id === variable.id)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }

    if (activeField === "title") {
      const result = insertVariableAtCursor(
        messageTitle,
        cursorPosition,
        variable
      );
      setMessageTitle(result.newText);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setSelectionRange(
            result.newCursorPosition,
            result.newCursorPosition
          );
          titleInputRef.current.focus();
        }
      }, 0);
    } else {
      if (isRichText) {
        const placeholder = formatVariablePlaceholder(variable);
        setMessageBody(messageBody + " " + placeholder + " ");
      } else {
        const result = insertVariableAtCursor(
          messageBody,
          cursorPosition,
          variable
        );
        setMessageBody(result.newText);
        setTimeout(() => {
          if (bodyTextareaRef.current) {
            bodyTextareaRef.current.setSelectionRange(
              result.newCursorPosition,
              result.newCursorPosition
            );
            bodyTextareaRef.current.focus();
          }
        }, 0);
      }
    }
    setShowVariableSelector(false);
  };

  const handleCustomizePolicy = (policy: CommunicationPolicyConfiguration) => {
    const policyWithTempName = {
      ...policy,
      name: `${policy.name} - Customizing...`,
    };
    setPolicyToCustomize(policyWithTempName);
    setIsCustomizationModalOpen(true);
  };

  const handleSaveCustomizedPolicy = async (
    policyData: Record<string, unknown>
  ) => {
    setIsCustomizationModalOpen(false);
    setPendingPolicyData(policyData);
    setIsNameModalOpen(true);
  };

  const handleConfirmPolicyName = async (policyName: string) => {
    if (!pendingPolicyData || !policyToCustomize) return;

    try {
      const originalPolicyName = policyToCustomize.name.replace(
        " - Customizing...",
        ""
      );

      const newPolicy = communicationPolicyService.createPolicy({
        name: policyName,
        description:
          (pendingPolicyData.description as string) ||
          `Custom policy based on ${originalPolicyName}`,
        channels: (pendingPolicyData.channels as string[]) || ["EMAIL"],
        type: pendingPolicyData.type as string,
        config: pendingPolicyData.config,
        isActive: (pendingPolicyData.isActive as boolean) ?? true,
      });

      setSelectedPolicy(newPolicy);
      setIsCustomizationModalOpen(false);
      setIsNameModalOpen(false);
      setPolicyToCustomize(null);
      setPendingPolicyData(null);
    } catch (err) {
      console.error("Failed to save custom policy:", err);
      showError("Failed to save custom policy. Please try again.");
    }
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
    if (quicklist?.columns && quicklist.columns.length > 0) {
      quicklist.columns.forEach((col: string) => {
        sampleData[col] = `[${col}]`;
      });
    }
    (selectedVariables || []).forEach((variable) => {
      const key = `${(variable.sourceName || "source")
        .toLowerCase()
        .replace(/\s+/g, "_")}.${variable.value || "field"}`;
      switch (variable.fieldType) {
        case "text":
          if ((variable.value || "").includes("name"))
            sampleData[key] = "John Doe";
          else if ((variable.value || "").includes("email"))
            sampleData[key] = "john@example.com";
          else if ((variable.value || "").includes("phone"))
            sampleData[key] = "+1234567890";
          else sampleData[key] = `Sample ${variable.name}`;
          break;
        case "numeric":
          sampleData[key] = "12345";
          break;
        case "date":
          sampleData[key] = new Date().toLocaleDateString();
          break;
        case "boolean":
          sampleData[key] = "Yes";
          break;
        default:
          sampleData[key] = `[${variable.name}]`;
      }
    });
    return sampleData;
  };

  const handleSend = async () => {
    if (!messageBody.trim()) {
      setError("Message body cannot be empty");
      return;
    }

    if (selectedChannel === "EMAIL" && !messageTitle.trim()) {
      setError("Subject line is required for email");
      return;
    }

    if (selectedChannel === "SMS" && !smsRoute.trim()) {
      setError("Please select an SMS route");
      return;
    }

    const cleanBody =
      selectedChannel !== "EMAIL" && isRichText
        ? messageBody.replace(/<[^>]*>/g, "")
        : messageBody;

    try {
      setSending(true);
      setResult(null);

      const response = await communicationService.sendCommunication({
        source_type: quicklist ? "quicklist" : "segment",
        source_id: quicklist?.id || segment?.id || 0,
        channels: [selectedChannel],
        message_template: {
          ...(messageTitle && selectedChannel === "EMAIL"
            ? { title: messageTitle }
            : {}),
          body: cleanBody,
        },
        batch_size: 500,
        created_by: 1,
      });

      if (response.success) {
        setResult(response.data);
        if (onSuccess) {
          onSuccess(response.data);
        }
      } else {
        // Handle backend error response
        let errorMsg = "Failed to send communication";
        if (response.error) {
          errorMsg = typeof response.error === "string"
            ? response.error
            : JSON.stringify(response.error);
        }
        showError("Communication Error", errorMsg, true); // bypassSilentMode
      }
    } catch (err) {
      console.error("Failed to send communication:", err);
      // Try to extract error message from response if available
      let errorMsg = "Failed to send communication";

      // Check if error has response data with error field
      if (err && typeof err === "object" && "response" in err) {
        const errResponse = (err as any).response?.data;
        if (errResponse?.error) {
          errorMsg = typeof errResponse.error === "string"
            ? errResponse.error
            : JSON.stringify(errResponse.error);
        }
      }

      showError("Communication Error", errorMsg, true); // bypassSilentMode
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
                  Success Rate
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {successRate}%
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
                {quicklist?.name || segment?.name}
              </span>{" "}
              ({quicklist?.rows_imported || segment?.size_estimate || 0} recipients)
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
          <>
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Channel Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Channel
                  </label>
                  <div
                    className="inline-flex rounded-md border p-1"
                    style={{
                      borderColor: color.border.default,
                      backgroundColor: color.surface.cards,
                    }}
                  >
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
                            color: isSelected
                              ? color.primary.accent
                              : color.text.secondary,
                            boxShadow: isSelected
                              ? "0 1px 3px rgba(0,0,0,0.1)"
                              : "none",
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{channel.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

              {/* Communication Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Communication Policy
                </label>
                <div className="relative" ref={policyDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setIsPolicyDropdownOpen(!isPolicyDropdownOpen)
                    }
                    className={`${
                      components.input.default
                    } w-full px-3 py-2 text-left flex items-center justify-between ${
                      selectedPolicy ? "" : "text-gray-500"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {selectedPolicy && (
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedPolicy.isActive
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        ></div>
                      )}
                      <span className="text-sm">
                        {selectedPolicy
                          ? selectedPolicy.name
                          : "Choose a communication policy (optional)"}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        isPolicyDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isPolicyDropdownOpen && (
                    <div
                      className={`absolute z-50 w-full mt-1 bg-white border ${tw.rounded} shadow-xl max-h-64 overflow-hidden`}
                      style={{ borderColor: color.border.default }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPolicy(null);
                          setIsPolicyDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b"
                        style={{ borderColor: color.border.default }}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          No Policy
                        </div>
                        <div className="text-xs text-gray-500">
                          Broadcast will use default communication settings
                        </div>
                      </button>

                      <div className="max-h-48 overflow-y-auto">
                        {communicationPolicies.map((policy) => (
                          <button
                            key={policy.id}
                            type="button"
                            onClick={() => {
                              setSelectedPolicy(policy);
                              setIsPolicyDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                              selectedPolicy?.id === policy.id
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  policy.isActive
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                              <div className="text-sm font-medium text-gray-900">
                                {policy.name}
                              </div>
                            </div>
                            {policy.description && (
                              <div className="text-xs text-gray-500 ml-4">
                                {policy.description}
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Customization Toggle */}
                {selectedPolicy && (
                  <div
                    className="flex items-center justify-between px-3 py-2 mt-2 rounded-md border"
                    style={{
                      backgroundColor: color.surface.cards,
                      borderColor: color.border.default,
                    }}
                  >
                    <span className="text-xs text-gray-500 flex items-center gap-2">
                      <Settings className="w-3 h-3" />
                      Want to modify this policy?
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCustomizePolicy(selectedPolicy)}
                      className="px-3 py-1 text-xs flex items-center gap-1 rounded text-white hover:opacity-90"
                      style={{ backgroundColor: color.primary.action }}
                    >
                      <Settings className="w-3 h-3" />
                      Customize
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column - Message Editor (3/5) */}
                <div className="lg:col-span-3 space-y-4">
                  {/* SMS Route Selection - Show only when SMS is selected */}
                  {selectedChannel === "SMS" && (
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-2 block">
                        SMS Route <span className="text-red-500">*</span>
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "Select SMS Route" },
                          ...((smsRoutes || [])
                            .filter((route: any) => route.isActive)
                            .map((route: any) => ({
                              value: route.id.toString(),
                              label: route.name,
                            }))),
                        ]}
                        value={smsRoute}
                        onChange={(value) => {
                          setSmsRoute(value);
                          setError("");
                        }}
                        placeholder="Select SMS Route"
                        zIndex={zIndex.popover}
                      />
                    </div>
                  )}

                  {/* Toolbar */}
                  <div
                    className="flex items-center justify-between p-3 rounded-md"
                    style={{ backgroundColor: color.surface.cards }}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      Message Content
                    </span>
                    <div className="flex items-center gap-2">
                      {selectedChannel === "EMAIL" && (
                        <button
                          type="button"
                          onClick={() => setIsRichText(!isRichText)}
                          className="px-3 py-1.5 text-sm rounded-md border transition-colors"
                          style={{
                            backgroundColor: isRichText
                              ? `${color.primary.accent}10`
                              : "white",
                            borderColor: isRichText
                              ? color.primary.accent
                              : color.border.default,
                            color: isRichText
                              ? color.primary.accent
                              : color.text.secondary,
                          }}
                        >
                          {isRichText ? "Rich Text" : "Plain Text"}
                        </button>
                      )}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setShowVariableSelector(!showVariableSelector)
                          }
                          className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                          style={{
                            backgroundColor: color.primary.accent,
                            color: "white",
                          }}
                        >
                          <Variable className="w-4 h-4" />
                          <span>Insert Variable</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              showVariableSelector ? "rotate-180" : ""
                            }`}
                          />
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
                      <label className="text-sm font-medium text-gray-900 mb-2 block">
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
                        className="w-full px-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all"
                        style={{ borderColor: color.border.default }}
                      />
                    </div>
                  )}

                  {/* Message Body */}
                  <div>
                    <label className="text-sm font-medium text-gray-900 mb-2 block">
                      Message Body <span className="text-red-500">*</span>
                    </label>
                    {isRichText ? (
                      <RichTextEditor
                        value={messageBody}
                        onChange={(value) => {
                          setMessageBody(value);
                          setActiveField("body");
                        }}
                        placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                        minHeight="250px"
                      />
                    ) : (
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
                        placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                        rows={10}
                        className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                        style={{ borderColor: color.border.default }}
                      />
                    )}

                    {/* Info bar */}
                    <div className="mt-2 flex items-center justify-between">
                      {selectedChannel === "SMS" || selectedChannel === "WHATSAPP" ? (
                        messageBody.trim() ? (
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>
                              {getCharacterInfo().charCount} characters
                            </span>
                            <span>{getCharacterInfo().segments} SMS</span>
                            {getCharacterInfo().isUnicode && (
                              <span className="text-amber-600">Unicode</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Enter your message to see character and SMS count
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-gray-500">
                          Variables like {"{{field}}"} will be replaced with
                          customer data
                        </span>
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
                  className="p-3 rounded-md flex items-start gap-2"
                  style={{
                    backgroundColor: `${color.status.danger}10`,
                    border: `1px solid ${color.status.danger}30`,
                  }}
                >
                  <AlertCircle
                    className="w-5 h-5 flex-shrink-0"
                    style={{ color: color.status.danger }}
                  />
                  <p className="text-sm" style={{ color: color.status.danger }}>
                    {error}
                  </p>
                </div>
              )}
              </div>
            </div>
          </>
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
            disabled={
              sending || !messageBody.trim() || (selectedChannel === "EMAIL" && !messageTitle.trim())
            }
            className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 text-sm font-semibold text-white ${tw.rounded} transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
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
                  Send Now to {quicklist?.rows_imported || segment?.size_estimate || 0} Recipients
                </span>
                <span className="sm:hidden">Send Now</span>
              </>
            )}
          </button>
        </div>

        {/* Communication Policy Modals */}
        <CommunicationPolicyModal
          isOpen={isCustomizationModalOpen}
          onClose={() => {
            setIsCustomizationModalOpen(false);
            setPolicyToCustomize(null);
          }}
          onSave={handleSaveCustomizedPolicy}
          initialData={policyToCustomize || undefined}
          mode="create"
        />

        <PolicyNameModal
          isOpen={isNameModalOpen}
          onClose={() => {
            setIsNameModalOpen(false);
            setPendingPolicyData(null);
          }}
          onConfirm={handleConfirmPolicyName}
          defaultName={
            policyToCustomize?.name.replace(" - Customizing...", "") || ""
          }
        />
      </div>
    </div>,
    document.body
  );
}
