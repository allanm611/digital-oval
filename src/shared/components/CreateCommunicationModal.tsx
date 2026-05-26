import { useState, useEffect, useRef } from "react";
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
  Loader,
  TrendingUp,
} from "lucide-react";
import {
  validateNoEditInsideVariables,
  isCursorInsideVariable,
  validateMessageSyntax,
} from "../utils/variableInsertion";
import { color, tw, components, zIndex } from "../utils/utils";
import LoadingSpinner from "./ui/LoadingSpinner";
import PreviewPanel from "../../features/communications/components/PreviewPanel";
import RichTextEditor from "../../features/communications/components/RichTextEditor";
import { communicationService } from "../../features/communications/services/communicationService";
import { formatDateWithTimezone } from "../services/dateService";
import { getSettingsTimezoneOffset } from "../utils/settingsHelper";
import {
  CommunicationResult,
} from "../../features/communications/types/communication";
import { QuickList } from "../../features/quicklists/types/quicklist";
import CascadingVariableSelector from "../../features/manual-broadcast/components/CascadingVariableSelector";
import HeadlessSelect from "./ui/HeadlessSelect";
import Input from "./ui/Input";
import { useConfigurationData } from "../services/configurationDataService";
import { useToast } from "../../contexts/ToastContext";
import { extractBackendError } from "../utils/errorHandler";;;
import { useAuth } from "../../contexts/AuthContext";
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
import type { SeedListRecipient } from "../services/seedListService";
import { validatePhoneOnly, isValidEmail } from "../utils/validation";
import Checkbox from "./ui/Checkbox";
import type { CustomerSubscriptionRecord } from "../../features/customers360/types/customerSubscription";
import { communicationChannelService } from "../services/communicationChannelService";
import { smsRouteService } from "../../features/routes/services/smsRouteService";

interface CreateCommunicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  quicklist?: QuickList;
  segment?: Segment;
  customerRecord?: CustomerSubscriptionRecord;
  onSuccess?: (result: CommunicationResult) => void;
}

type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

export default function CreateCommunicationModal({
  isOpen,
  onClose,
  quicklist,
  segment,
  customerRecord,
  onSuccess,
}: CreateCommunicationModalProps) {
  const { data: emailRoutesData } = useConfigurationData("emailRoutes");
  const { error: showError } = useToast();
  const { user } = useAuth();

  const emailRoutes = emailRoutesData?.filter((r: any) => r.isActive || r.is_active) || [];
  const [smsRoutes, setSmsRoutes] = useState<any[]>([]);
  const [smsRoutesLoading, setSmsRoutesLoading] = useState(false);

  const [channels, setChannels] = useState<Array<{ id: Channel; name: string; icon: any }>>([]);

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
  const [emailRoute, setEmailRoute] = useState("");
  const [error, setError] = useState("");
  const [variableError, setVariableError] = useState("");
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [selectedVariables, setSelectedVariables] = useState<
    TemplateVariable[]
  >([]);

  // Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<
    Array<{ contact: string; status: "success" | "failed"; message?: string }>
  >([]);
  const [testError, setTestError] = useState("");
  const [selectedTestContacts, setSelectedTestContacts] = useState<Set<string>>(
    new Set(),
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

  // Fetch communication channels and routes on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const allChannels = await communicationChannelService.getAll();
        const iconMap: { [key: string]: any } = {
          SMS: MessageSquare,
          EMAIL: Mail,
          WHATSAPP: Phone,
          PUSH: Bell,
        };

        const channelsList = (allChannels || []).map((ch: any) => {
          const code = ch.code?.toUpperCase() || "";
          return {
            id: code as Channel,
            name: ch.name || code,
            icon: iconMap[code] || MessageSquare,
          };
        });

        setChannels(channelsList);
      } catch (error) {
        console.error("Failed to fetch communication channels:", error);
        setChannels([]);
      }
    };

    const fetchSmsRoutes = async () => {
      try {
        setSmsRoutesLoading(true);
        const smsRoutesData = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(smsRoutesData) ? smsRoutesData.filter((r: any) => r.is_active) : []);
      } catch (error) {
        console.error("Failed to fetch SMS routes:", error);
        setSmsRoutes([]);
      } finally {
        setSmsRoutesLoading(false);
      }
    };

    if (isOpen) {
      fetchChannels();
      fetchSmsRoutes();
    }
  }, [isOpen]);

  // Get active seed list recipients
  const getActiveRecipients = (): SeedListRecipient[] => {
    return [];
  };

  // Derive all available test contacts from active recipients based on channel
  const getAvailableTestContacts = (): string[] => {
    const activeRecipients = getActiveRecipients();
    return activeRecipients
      .map((r) => {
        const contact =
          selectedChannel === "EMAIL" ? r.customer_email : r.customer_phone;
        // Remove + prefix from phone numbers
        return contact?.replace(/^\+/, "") || "";
      })
      .filter(Boolean) as string[];
  };

  // Get only the selected/checked test contacts
  const getSelectedTestContacts = (): string[] => {
    return getAvailableTestContacts().filter((contact) =>
      selectedTestContacts.has(contact),
    );
  };

  // Toggle selection of a test contact
  const toggleTestContact = (contact: string) => {
    const newSelected = new Set(selectedTestContacts);
    if (newSelected.has(contact)) {
      newSelected.delete(contact);
    } else {
      newSelected.add(contact);
    }
    setSelectedTestContacts(newSelected);
  };

  // Validate contact based on channel
  const validateContact = (contact: string): boolean => {
    if (selectedChannel === "EMAIL") {
      return isValidEmail(contact);
    } else if (selectedChannel === "SMS" || selectedChannel === "WHATSAPP") {
      const phoneValidation = validatePhoneOnly([contact]);
      return phoneValidation.valid;
    }
    return isValidEmail(contact) || validatePhoneOnly([contact]).valid;
  };

  // Handle sending test broadcasts
  const handleSendTest = async () => {
    const contacts = getSelectedTestContacts();

    if (contacts.length === 0) {
      setTestError("Please select at least one test contact to send tests");
      return;
    }

    setIsTesting(true);
    setTestError("");
    setTestResults([]);

    try {
      const results: Array<{
        contact: string;
        status: "success" | "failed";
        message?: string;
      }> = [];

      for (const contact of contacts) {
        // Simulate a small delay for each contact
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Validate based on channel
        const isValid = validateContact(contact);
        let errorMessage = "";

        if (selectedChannel === "EMAIL") {
          errorMessage = "Invalid email address";
        } else if (
          selectedChannel === "SMS" ||
          selectedChannel === "WHATSAPP"
        ) {
          errorMessage = "Invalid phone number";
        } else {
          errorMessage = "Invalid contact";
        }

        if (isValid) {
          results.push({
            contact,
            status: "success",
            message: `Successfully sent to ${selectedChannel}`,
          });
        } else {
          results.push({
            contact,
            status: "failed",
            message: errorMessage,
          });
        }
      }

      setTestResults(results);
    } catch (err) {
      console.error("Failed to process test broadcasts:", err);
      setTestError("Failed to send test broadcasts. Please try again.");
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Load initial policies
      setCommunicationPolicies(communicationPolicyService.getAllPolicies());

      // Subscribe to policy changes
      const unsubscribe = communicationPolicyService.subscribe(
        (updatedPolicies) => {
          setCommunicationPolicies(updatedPolicies);
        },
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
      setEmailRoute("");
      setError("");
      setShowVariableSelector(false);
      setSelectedVariables([]);
      setSelectedPolicy(null);
      setTestError("");
      setTestResults([]);
      setSelectedTestContacts(new Set());
      setIsTesting(false);
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
        variable,
      );
      setMessageTitle(result.newText);
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.setSelectionRange(
            result.newCursorPosition,
            result.newCursorPosition,
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
          variable,
        );
        setMessageBody(result.newText);
        setTimeout(() => {
          if (bodyTextareaRef.current) {
            bodyTextareaRef.current.setSelectionRange(
              result.newCursorPosition,
              result.newCursorPosition,
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
    policyData: Record<string, unknown>,
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
        "",
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
      showError(extractBackendError(error, "Failed to save custom policy. Please try again.. Please try again."));
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
          sampleData[key] = formatDateWithTimezone(new Date(), getSettingsTimezoneOffset());
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

    if (selectedChannel === "EMAIL" && !emailRoute.trim()) {
      setError("Please select an email route");
      return;
    }

    if (selectedChannel === "SMS" && !smsRoute.trim()) {
      setError("Please select an SMS route");
      return;
    }

    if (!user?.user_id) {
      setError("You must be logged in to send communications");
      return;
    }

    // Check if recipient list is empty
    const recipientCount = customerRecord ? 1 : quicklist?.rows_imported || segment?.size_estimate || 0;
    if (recipientCount === 0) {
      let errorMsg = "Cannot send communication: ";
      if (customerRecord) {
        errorMsg += "Please select a customer with valid contact information.";
      } else if (quicklist) {
        errorMsg += "the quicklist has no members. Please select a quicklist with data.";
      } else if (segment) {
        errorMsg += "the segment has no members. Please select a segment with members.";
      } else {
        errorMsg += "the target audience has no recipients.";
      }
      setError(errorMsg);
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
        source_type: customerRecord
          ? "customer"
          : quicklist
            ? "quicklist"
            : "segment",
        source_id:
          (customerRecord?.customer_id || customerRecord?.customerId) || quicklist?.id || segment?.id || 0,
        channels: [selectedChannel],
        message_template: {
          ...(messageTitle && selectedChannel === "EMAIL"
            ? { title: messageTitle }
            : {}),
          body: cleanBody,
        },
        batch_size: 500,
        created_by: user?.user_id ?? null,
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
          errorMsg =
            typeof response.error === "string"
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
          errorMsg =
            typeof errResponse.error === "string"
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
          className={`bg-white ${tw.rounded} shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200`}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start space-x-3 flex-1">
                {isSuccess ? (
                  <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: color.primary.accent }} />
                ) : (
                  <XCircle className="w-6 h-6 flex-shrink-0 mt-1" style={{ color: color.primary.accent }} />
                )}
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {isSuccess
                      ? 'Communication Sent Successfully'
                      : 'Communication Completed with Errors'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Execution ID: {result.execution_id}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className={`p-2 hover:bg-gray-100 ${tw.rounded} transition-colors flex-shrink-0`}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-6">
              {/* Stats Cards - matching campaign analytics style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Recipients */}
                <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Bell className="h-5 w-5" style={{ color: color.primary.accent }} />
                    <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.total_recipients.toLocaleString()}
                  </p>
                </div>

                {/* Messages Sent */}
                <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5" style={{ color: color.primary.accent }} />
                    <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.total_messages_sent.toLocaleString()}
                  </p>
                </div>

                {/* Messages Failed */}
                <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="h-5 w-5" style={{ color: color.primary.accent }} />
                    <p className="text-sm font-medium text-gray-600">Messages Failed</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {result.total_messages_failed.toLocaleString()}
                  </p>
                </div>

                {/* Success Rate */}
                <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5" style={{ color: color.primary.accent }} />
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">
                    {successRate}%
                  </p>
                </div>
              </div>

              {/* Channel Breakdown */}
              {result.channel_summaries.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Channel Breakdown
                  </h3>
                  <div className="space-y-3">
                    {result.channel_summaries.map((summary) => (
                      <div
                        key={summary.channel}
                        className={`${tw.rounded} border border-gray-200 bg-white p-4 shadow-sm`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-sm font-medium text-gray-700">
                            {summary.channel}
                          </span>
                          <div className="flex items-center space-x-6 text-sm">
                            <span className="text-green-600">
                              ✓ {summary.messages_sent} sent
                            </span>
                            <span className="text-red-600">
                              ✗ {summary.messages_failed} failed
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={handleClose}
              className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50 transition-colors`}
            >
              Close
            </button>
            <button
              onClick={() => setResult(null)}
              className={`w-full sm:w-auto px-6 py-2.5 text-sm font-medium text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
            >
              Send Another
            </button>
          </div>
        </div>
      </div>,
      document.body,
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
                {customerRecord
                  ? `${customerRecord.first_name || customerRecord.firstName || ""} ${customerRecord.last_name || customerRecord.lastName || ""}`
                  : quicklist?.name || segment?.name}
              </span>{" "}
              (
              {customerRecord
                ? 1
                : quicklist?.rows_imported || segment?.size_estimate || 0}{" "}
              recipients)
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
                {/* Error for empty recipients */}
                {error?.includes("Cannot send communication") && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                {/* Channel and Route Selection on same line */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Communication Channel <span className="text-red-500">*</span>
                    </label>
                    <HeadlessSelect
                      options={channels.map((channel) => ({
                        value: channel.id,
                        label: channel.name,
                      }))}
                      value={selectedChannel}
                      onChange={(value) => {
                        setSelectedChannel(value as Channel);
                        setSmsRoute("");
                        setEmailRoute("");
                        setError("");
                      }}
                      placeholder="Select communication channel"
                      className="text-sm"
                      zIndex={zIndex.popover}
                    />
                  </div>

                  {/* Email Route - only show when EMAIL channel is selected */}
                  {selectedChannel === "EMAIL" && (
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Email Route <span className="text-red-500">*</span>
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "Select Email Route" },
                          ...(emailRoutes || []).map((route: any) => ({
                            value: route.id.toString(),
                            label: route.name,
                          })),
                        ]}
                        value={emailRoute}
                        onChange={(value) => {
                          setEmailRoute(value);
                          setError("");
                        }}
                        placeholder="Select Email Route"
                        zIndex={zIndex.popover}
                      />
                      {!emailRoute && error?.includes("email route") && (
                        <p className="text-xs text-red-600 mt-1">Please select an email route</p>
                      )}
                    </div>
                  )}

                  {/* SMS Route - only show when SMS channel is selected */}
                  {selectedChannel === "SMS" && (
                    <div className="flex-1">
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        SMS Route <span className="text-red-500">*</span>
                      </label>
                      <HeadlessSelect
                        options={[
                          { value: "", label: "Select SMS Route" },
                          ...(smsRoutes || []).map((route: any) => ({
                            value: route.id.toString(),
                            label: route.name,
                          })),
                        ]}
                        value={smsRoute}
                        onChange={(value) => {
                          setSmsRoute(value);
                          setError("");
                        }}
                        placeholder={smsRoutesLoading ? "Loading..." : "Select SMS Route"}
                        zIndex={zIndex.popover}
                      />
                      {!smsRoute && error?.includes("SMS route") && (
                        <p className="text-xs text-red-600 mt-1">Please select an SMS route</p>
                      )}
                    </div>
                  )}
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
                      <span className="text-sm">
                        {selectedPolicy && selectedPolicy.name ? selectedPolicy.name : null}
                        {!selectedPolicy && communicationPolicies && Array.isArray(communicationPolicies) && communicationPolicies.length > 0 ? (
                          (() => {
                            const activePolicy = communicationPolicies.find((p) => {
                              if (!p) {
                                return false;
                              }
                              if (p.isActive === true || p.is_active === true) {
                                return true;
                              }
                              return false;
                            });
                            if (activePolicy && activePolicy.name) {
                              return activePolicy.name;
                            }
                            return "Choose a communication policy (optional)";
                          })()
                        ) : null}
                        {!selectedPolicy && (!communicationPolicies || !Array.isArray(communicationPolicies) || communicationPolicies.length === 0) ? "Choose a communication policy (optional)" : null}
                      </span>
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
                          {communicationPolicies && Array.isArray(communicationPolicies) && communicationPolicies.filter((policy) => {
                            if (!policy) {
                              return false;
                            }
                            if (policy.is_active === false) {
                              return false;
                            }
                            return true;
                          }).map((policy) => (
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
                              <div className="text-sm font-medium text-gray-900">
                                {policy.name}
                              </div>
                              {policy.description && (
                                <div className="text-xs text-gray-500 mt-1">
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
                        <Input
                          ref={titleInputRef}
                          placeholder="Enter email subject..."
                          value={messageTitle}
                          onChange={(value) => {
                            setMessageTitle(value);
                            setCursorPosition(value.length);
                          }}
                          onClick={(e) => {
                            setActiveField("title");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                          onFocus={(e) => {
                            setActiveField("title");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                          variant="medium"
                        />
                        {!messageTitle.trim() && error?.includes("Subject") && (
                          <p className="text-xs text-red-600 mt-1">Subject line is required for email</p>
                        )}
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
                            if (!e || !e.target) {
                              return;
                            }
                            const newValue = e.target.value;
                            if (newValue === null || newValue === undefined) {
                              return;
                            }
                            const editError = validateNoEditInsideVariables(messageBody, newValue);
                            if (editError) {
                              setVariableError(editError);
                              return;
                            }
                            setMessageBody(newValue);
                            const selectionStart = e.target.selectionStart;
                            if (selectionStart !== null && selectionStart !== undefined) {
                              setCursorPosition(selectionStart);
                            }
                            const syntaxError = validateMessageSyntax(newValue);
                            if (syntaxError) {
                              setVariableError(syntaxError);
                            } else {
                              setVariableError("");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (!e || !e.currentTarget) {
                              return;
                            }
                            const cursorPos = e.currentTarget.selectionStart;
                            if (cursorPos === null || cursorPos === undefined) {
                              return;
                            }
                            if (messageBody) {
                              const isInsideVar = isCursorInsideVariable(messageBody, cursorPos);
                              if (isInsideVar) {
                                e.preventDefault();
                                setVariableError("You can't edit inside a variable");
                              } else {
                                setVariableError("");
                              }
                            }
                          }}
                          onClick={(e) => {
                            setActiveField("body");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                          onFocus={(e) => {
                            setActiveField("body");
                            setCursorPosition(
                              e.currentTarget.selectionStart || 0,
                            );
                          }}
                          placeholder="Enter your message... Click 'Insert Variable' to add dynamic content"
                          rows={10}
                          className="w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                          style={{ borderColor: color.border.default }}
                        />
                      )}

                      {/* Info bar */}
                      <div className="mt-2 flex items-center justify-between">
                        {selectedChannel === "SMS" ||
                        selectedChannel === "WHATSAPP" ? (
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
                      {!messageBody.trim() && error?.includes("body") && (
                        <p className="text-xs text-red-600 mt-2">Message body is required</p>
                      )}
                      {variableError && (
                        <p className="text-xs text-red-600 mt-2">{variableError}</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Preview (2/5) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="sticky top-4">
                      <PreviewPanel
                        channel={selectedChannel}
                        title={messageTitle}
                        body={messageBody}
                        sampleData={getSampleDataForPreview()}
                      />
                    </div>

                    {/* Test Section - Send Test Message */}
                    {getAvailableTestContacts().length > 0 && (
                      <div
                        className="bg-white rounded-md border p-4"
                        style={{ borderColor: color.border.default }}
                      >
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">
                          Send Test Message
                        </h3>

                        {/* Available Test Contacts */}
                        <div className="mb-4">
                          <label className="text-sm font-medium text-gray-900 mb-2 block">
                            Test Contacts
                          </label>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {getAvailableTestContacts().map((contact) => (
                              <div
                                key={contact}
                                className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50"
                                onClick={() => toggleTestContact(contact)}
                              >
                                <Checkbox
                                  id={`test-contact-${contact}`}
                                  checked={selectedTestContacts.has(contact)}
                                  onChange={() => toggleTestContact(contact)}
                                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                />
                                <span className="text-sm text-gray-700 flex-1">
                                  {contact}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Send Test Button */}
                        <div className="mb-4">
                          <button
                            onClick={handleSendTest}
                            disabled={
                              getSelectedTestContacts().length === 0 ||
                              isTesting
                            }
                            className="w-auto px-4 py-2.5 text-white rounded-md text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            style={{ backgroundColor: color.primary.accent }}
                          >
                            {isTesting ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                                <span>Sending Tests...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 flex-shrink-0" />
                                <span>Send Test</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Test Error Message */}
                        {testError && (
                          <div
                            className="p-3 rounded-md flex items-start gap-2 mb-4"
                            style={{
                              backgroundColor: `${color.status.danger}10`,
                              border: `1px solid ${color.status.danger}30`,
                            }}
                          >
                            <AlertCircle
                              className="w-5 h-5 flex-shrink-0"
                              style={{ color: color.status.danger }}
                            />
                            <p
                              className="text-sm"
                              style={{ color: color.status.danger }}
                            >
                              {testError}
                            </p>
                          </div>
                        )}

                        {/* Test Results */}
                        {testResults.length > 0 && (
                          <div>
                            <label className="text-sm font-medium text-gray-900 mb-2 block">
                              Test Results
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {testResults.map((result, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 p-2 rounded-md text-sm"
                                  style={{
                                    backgroundColor:
                                      result.status === "success"
                                        ? `${color.status.success}10`
                                        : `${color.status.danger}10`,
                                  }}
                                >
                                  {result.status === "success" ? (
                                    <CheckCircle
                                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                                      style={{ color: color.status.success }}
                                    />
                                  ) : (
                                    <XCircle
                                      className="w-4 h-4 flex-shrink-0 mt-0.5"
                                      style={{ color: color.status.danger }}
                                    />
                                  )}
                                  <div className="flex-1">
                                    <p
                                      className="text-xs font-medium"
                                      style={{
                                        color:
                                          result.status === "success"
                                            ? color.status.success
                                            : color.status.danger,
                                      }}
                                    >
                                      {result.contact}
                                    </p>
                                    {result.message && (
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        {result.message}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

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
              sending ||
              !messageBody.trim() ||
              (selectedChannel === "EMAIL" && !messageTitle.trim())
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
                  Send Now to{" "}
                  {customerRecord
                    ? 1
                    : quicklist?.rows_imported ||
                      segment?.size_estimate ||
                      0}{" "}
                  Recipients
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
          policy={policyToCustomize || undefined}
          onSave={handleSaveCustomizedPolicy}
          isSaving={false}
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
    document.body,
  );
}
