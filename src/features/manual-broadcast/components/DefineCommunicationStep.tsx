import { useState, useRef, useEffect } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  Bell,
  Variable,
  ChevronDown,
  Settings,
  Send,
  CheckCircle,
  XCircle,
  Loader,
  AlertCircle,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import PreviewPanel from "../../communications/components/PreviewPanel";
import RichTextEditor from "../../communications/components/RichTextEditor";
import { useLanguage } from "../../../contexts/LanguageContext";
import CascadingVariableSelector from "./CascadingVariableSelector";
import type { TemplateVariable } from "../types";
import {
  insertVariableAtCursor,
  formatVariablePlaceholder,
  validateInsertPosition,
  validateMessageSyntax,
} from "../../../shared/utils/variableInsertion";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { CommunicationPolicyConfiguration } from "../../campaigns/types/communicationPolicyConfig";
import { communicationPolicyService } from "../../campaigns/services/communicationPolicyService";
import CommunicationPolicyModal from "../../campaigns/components/CommunicationPolicyModal";
import PolicyNameModal from "../../campaigns/components/PolicyNameModal";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { useToast } from "../../../contexts/ToastContext";
import { validatePhoneOnly, isValidEmail } from "../../../shared/utils/validation";
import { DUMMY_RECIPIENTS } from "../../campaigns/pages/SeedListManagementPage";
import type { SeedListRecipient } from "../../campaigns/pages/SeedListManagementPage";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { smsRouteService } from "../../routes/services/smsRouteService";
import { SMSRoute } from "../../routes/types/smsRoute";

interface DefineCommunicationStepProps {
  data: ManualBroadcastData;
  onUpdate: (data: Partial<ManualBroadcastData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface TestResult {
  contact: string;
  status: "success" | "failed";
  message?: string;
}

type Channel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";

export default function DefineCommunicationStep({
  data,
  onUpdate,
  onNext,
  onPrevious,
}: DefineCommunicationStepProps) {
  const { t } = useLanguage();
  const [smsRoutes, setSmsRoutes] = useState<SMSRoute[]>([]);

  const channels = [
    {
      id: "EMAIL" as Channel,
      name: t.manualBroadcast.channelEmail,
      icon: Mail,
    },
    {
      id: "SMS" as Channel,
      name: t.manualBroadcast.channelSMS,
      icon: MessageSquare,
    },
    {
      id: "WHATSAPP" as Channel,
      name: t.manualBroadcast.channelWhatsApp,
      icon: Phone,
    },
    { id: "PUSH" as Channel, name: t.manualBroadcast.channelPush, icon: Bell },
  ];

  const [selectedChannel, setSelectedChannel] = useState<Channel>(
    data.channel || "EMAIL",
  );
  const [messageTitle, setMessageTitle] = useState(data.messageTitle || "");
  const [messageBody, setMessageBody] = useState(data.messageBody || "");
  const [isRichText, setIsRichText] = useState(data.isRichText || false);
  const [smsRoute, setSmsRoute] = useState(data.smsRoute || "");
  const [error, setError] = useState("");
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [activeField, setActiveField] = useState<"title" | "body">("body");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [variableError, setVariableError] = useState<string>("");
  const [selectedVariables, setSelectedVariables] = useState<
    TemplateVariable[]
  >(data.selectedVariables || []);

  // Test state
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testError, setTestError] = useState("");
  const [selectedTestContacts, setSelectedTestContacts] = useState<Set<string>>(
    new Set()
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
  const { success: showToast, error: showError } = useToast();

  useClickOutside(policyDropdownRef, () => setIsPolicyDropdownOpen(false));

  // Fetch SMS routes on component mount
  useEffect(() => {
    const fetchSmsRoutes = async () => {
      try {
        const routes = await smsRouteService.getAllRoutes();
        setSmsRoutes(Array.isArray(routes) ? routes : []);
      } catch (error) {
        console.error("Failed to fetch SMS routes:", error);
        setSmsRoutes([]);
      }
    };
    fetchSmsRoutes();
  }, []);

  // Get active seed list recipients
  const getActiveRecipients = (): SeedListRecipient[] => {
    return DUMMY_RECIPIENTS.filter((r) => r.status === "active");
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
      selectedTestContacts.has(contact)
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
      const results: TestResult[] = [];

      for (const contact of contacts) {
        // Simulate a small delay for each contact
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Validate based on channel
        const isValid = validateContact(contact);
        let errorMessage = "";

        if (selectedChannel === "EMAIL") {
          errorMessage = t.manualBroadcast.errorInvalidEmail;
        } else if (selectedChannel === "SMS" || selectedChannel === "WHATSAPP") {
          errorMessage = t.manualBroadcast.errorInvalidPhone;
        } else {
          errorMessage = t.manualBroadcast.errorInvalidContact;
        }

        if (isValid) {
          results.push({
            contact,
            status: "success",
            message: `${t.manualBroadcast.testMessageSuccess} (${selectedChannel})`,
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
      setTestError(t.manualBroadcast.errorSendTestFailed);
    } finally {
      setIsTesting(false);
    }
  };

  // Load Communication Policies from service
  useEffect(() => {
    // Load initial policies
    setCommunicationPolicies(communicationPolicyService.getAllPolicies());

    // Subscribe to policy changes
    const unsubscribe = communicationPolicyService.subscribe(
      (updatedPolicies) => {
        setCommunicationPolicies(updatedPolicies);
      },
    );

    return unsubscribe;
  }, []);

  // Sync from parent data on mount/edit mode
  useEffect(() => {
    if (data.channel) setSelectedChannel(data.channel);
    if (data.messageTitle) setMessageTitle(data.messageTitle);
    if (data.messageBody) setMessageBody(data.messageBody);
    if (data.isRichText !== undefined) setIsRichText(data.isRichText);
    if (data.smsRoute) setSmsRoute(data.smsRoute);
  }, []);

  // Sync selectedPolicy with parent data
  useEffect(() => {
    if (data.selectedCommunicationPolicyId) {
      const policy = communicationPolicyService.getPolicyById(
        data.selectedCommunicationPolicyId,
      );
      if (policy) {
        setSelectedPolicy(policy);
      }
    }
  }, [data.selectedCommunicationPolicyId]);

  // Sync communication fields to parent data (so Next button validation works)
  useEffect(() => {
    console.log("[DefineCommunicationStep] Syncing to parent:", {
      channel: selectedChannel,
      messageBodyLength: messageBody.length,
      messageTitle: messageTitle.length > 0 ? `${messageTitle.length} chars` : "empty",
    });
    onUpdate({
      channel: selectedChannel,
      messageTitle: messageTitle,
      messageBody: messageBody,
      isRichText: isRichText,
      smsRoute: selectedChannel === "SMS" ? smsRoute : undefined,
    });
  }, [selectedChannel, messageBody, messageTitle, isRichText, smsRoute]);

  const handleVariableSelect = (variable: TemplateVariable) => {
    // Validate input data
    if (!variable) {
      setVariableError("No variable selected");
      return;
    }

    if (!selectedVariables) {
      setSelectedVariables([]);
    }

    if (!selectedVariables.find((v) => v?.id === variable.id)) {
      setSelectedVariables((prev) => [...prev, variable]);
    }

    // Validate activeField before using
    if (!activeField) {
      setVariableError("No active field selected");
      return;
    }

    // Get actual cursor position from DOM element
    let actualCursorPosition = cursorPosition;
    if (activeField === "title" && titleInputRef?.current) {
      actualCursorPosition = titleInputRef.current.selectionStart || 0;
    } else if (activeField === "body" && bodyTextareaRef?.current) {
      actualCursorPosition = bodyTextareaRef.current.selectionStart || 0;
    }

    // Validate message content before inserting
    if (activeField === "title") {
      if (typeof messageTitle !== "string") {
        setVariableError("Message title is not available");
        return;
      }
      const currentText = messageTitle;

      // Validate cursor position
      const positionError = validateInsertPosition(currentText, actualCursorPosition);

      if (positionError) {
        setVariableError(positionError);
        return;
      }

      setVariableError("");
      const result = insertVariableAtCursor(
        messageTitle,
        actualCursorPosition,
        variable,
      );

      if (result.error) {
        setVariableError(result.error);
        return;
      }

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
      // Validate message body availability
      if (typeof messageBody !== "string") {
        setVariableError("Message body is not available");
        return;
      }

      if (isRichText) {
        if (!variable) {
          setVariableError("Variable not selected");
          return;
        }
        const placeholder = formatVariablePlaceholder(variable);
        if (!placeholder) {
          setVariableError("Could not format variable placeholder");
          return;
        }
        setMessageBody(messageBody + " " + placeholder + " ");
        setVariableError("");
      } else {
        const currentText = messageBody;
        if (typeof currentText !== "string") {
          setVariableError("Message body is not available");
          return;
        }

        // Validate cursor position
        const positionError = validateInsertPosition(currentText, actualCursorPosition);

        if (positionError) {
          setVariableError(positionError);
          return;
        }

        setVariableError("");
        const result = insertVariableAtCursor(
          messageBody,
          actualCursorPosition,
          variable,
        );

        if (result.error) {
          setVariableError(result.error);
          return;
        }

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

  // Handle opening customization modal
  const handleCustomizePolicy = (policy: CommunicationPolicyConfiguration) => {
    // Validate policy data
    if (!policy) {
      showError("No policy selected for customization");
      return;
    }

    if (!policy.id || !policy.name) {
      showError("Policy data is incomplete");
      return;
    }

    // Create a copy of the policy with a temporary name for the modal
    const policyWithTempName = {
      ...policy,
      name: `${policy.name || "Unknown"} - Customizing...`,
    };
    setPolicyToCustomize(policyWithTempName);
    setIsCustomizationModalOpen(true);
  };

  // Handle saving customized policy
  const handleSaveCustomizedPolicy = async (
    policyData: Record<string, unknown>,
  ) => {
    // Validate policyData
    if (!policyData || typeof policyData !== "object") {
      showError("Invalid policy data");
      return;
    }

    // Store the policy data and open name modal
    // First close the customization modal
    setIsCustomizationModalOpen(false);

    // Then store data and open name modal
    setPendingPolicyData(policyData);
    setIsNameModalOpen(true);
  };

  // Handle confirming policy name
  const handleConfirmPolicyName = async (policyName: string) => {
    // Validate inputs
    if (!pendingPolicyData || typeof pendingPolicyData !== "object") {
      showError("Policy data is not available");
      return;
    }

    if (!policyToCustomize) {
      showError("No policy selected for customization");
      return;
    }

    if (!policyName || typeof policyName !== "string" || !policyName.trim()) {
      showError("Please provide a valid policy name");
      return;
    }

    try {
      // Get the original policy name (remove the temporary suffix)
      const originalPolicyName = policyToCustomize.name?.replace(
        " - Customizing...",
        "",
      ) || "Unknown";

      // Validate required policy configuration
      const channels = pendingPolicyData.channels as any[];
      const config = pendingPolicyData.config;

      if (!channels || !Array.isArray(channels) || channels.length === 0) {
        showError("Please select at least one channel for the policy");
        return;
      }

      // Create new policy with customized configuration
      const newPolicy = communicationPolicyService.createPolicy({
        name: policyName.trim(),
        description:
          (pendingPolicyData.description as string) ||
          `Custom policy based on ${originalPolicyName}`,
        channels: channels,
        type: pendingPolicyData.type as string,
        config: config,
        isActive: pendingPolicyData.isActive ?? true,
      });

      if (!newPolicy) {
        showError("Failed to create policy");
        return;
      }

      // Apply the new policy to the broadcast
      setSelectedPolicy(newPolicy);

      // Update parent component data
      onUpdate({
        selectedCommunicationPolicy: newPolicy,
        selectedCommunicationPolicyId: newPolicy.id,
      });

      // Close modals and cleanup
      setIsCustomizationModalOpen(false);
      setIsNameModalOpen(false);
      setPolicyToCustomize(null);
      setPendingPolicyData(null);

      showToast("Custom policy created and applied to broadcast!");
    } catch (error) {
      console.error("Failed to save custom policy:", error);
      showError("Failed to save custom policy. Please try again.");
    }
  };

  const getCharacterInfo = () => {
    // Validate messageBody availability
    if (typeof messageBody !== "string") {
      return { charCount: 0, segments: 0, isUnicode: false };
    }

    if (!messageBody) {
      return { charCount: 0, segments: 1, isUnicode: false };
    }

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

    // Validate data object existence
    if (!data) {
      console.warn("Data object is not available for preview");
      return sampleData;
    }

    // Validate fileColumns availability
    if (data.fileColumns && Array.isArray(data.fileColumns) && data.fileColumns.length > 0) {
      data.fileColumns.forEach((col) => {
        if (col && typeof col === "string") {
          sampleData[col] = `[${col}]`;
        }
      });
    }

    // Validate selectedVariables availability
    if (selectedVariables && Array.isArray(selectedVariables)) {
      selectedVariables.forEach((variable) => {
        if (!variable) {
          return; // Skip undefined variables
        }
        const key = `${(variable.sourceName || "source").toLowerCase().replace(/\s+/g, "_")}.${variable.value || "field"}`;
        switch (variable.fieldType) {
          case "text":
            if ((variable.value || "").includes("name"))
              sampleData[key] = "John Doe";
            else if ((variable.value || "").includes("email"))
              sampleData[key] = "john@example.com";
            else if ((variable.value || "").includes("phone"))
              sampleData[key] = "+1234567890";
            else sampleData[key] = `Sample ${variable.name || "value"}`;
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
            sampleData[key] = `[${variable.name || "value"}]`;
        }
      });
    }
    return sampleData;
  };

  const handleNext = () => {
    // Validate messageBody
    if (!messageBody || typeof messageBody !== "string" || !messageBody.trim()) {
      setError(t.manualBroadcast.errorMessageBodyRequired);
      return;
    }

    // Validate message syntax (check for properly formed variables)
    const syntaxError = validateMessageSyntax(messageBody);
    if (syntaxError) {
      setError(syntaxError);
      return;
    }

    // Validate selectedChannel
    if (!selectedChannel) {
      setError("Please select a communication channel");
      return;
    }

    // Validate email requirements
    if (selectedChannel === "EMAIL") {
      if (!messageTitle || typeof messageTitle !== "string" || !messageTitle.trim()) {
        setError(t.manualBroadcast.errorSubjectRequired);
        return;
      }
      // Validate title syntax (check for properly formed variables)
      const titleSyntaxError = validateMessageSyntax(messageTitle);
      if (titleSyntaxError) {
        setError(titleSyntaxError);
        return;
      }
    }

    // Validate SMS requirements
    if (selectedChannel === "SMS") {
      if (!smsRoute || typeof smsRoute !== "string" || !smsRoute.trim()) {
        setError("Please select an SMS route");
        return;
      }
    }

    // Clear any previous errors
    setError("");

    // Validate selectedVariables is an array
    const validatedVariables = Array.isArray(selectedVariables) ? selectedVariables : [];

    // Prepare test results record
    const resultsRecord: Record<string, unknown> = {
      results: testResults,
      successCount: testResults.filter(r => r.status === "success").length,
      failedCount: testResults.filter(r => r.status === "failed").length,
    };

    // Update parent with validated data
    onUpdate({
      channel: selectedChannel,
      messageTitle: messageTitle?.trim() || "",
      messageBody: messageBody.trim(),
      isRichText,
      smsRoute: selectedChannel === "SMS" ? smsRoute : undefined,
      selectedVariables: validatedVariables,
      // Add communication policy data
      selectedCommunicationPolicy: selectedPolicy || undefined,
      selectedCommunicationPolicyId: selectedPolicy?.id || undefined,
      // Add test data
      testContacts: getSelectedTestContacts(),
      testResults: resultsRecord,
    });
    onNext();
  };

  return (
    <div
      className="bg-white rounded-md shadow-sm border"
      style={{ borderColor: color.border.default }}
    >
      {/* Header */}
      <div
        className="p-5 border-b"
        style={{ borderColor: color.border.default }}
      >
        <h2 className={`text-xl font-semibold ${tw.textPrimary}`}>
          {t.manualBroadcast.defineCommunicationTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary} mt-1`}>
          {t.manualBroadcast.defineCommunicationSubtitle}
        </p>
      </div>

      <div className="p-5">
        <div className="mb-6">
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
            {t.manualBroadcast.channelLabel}
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
        <div className="mb-6">
          <label className={`block text-sm font-medium ${tw.textPrimary} mb-3`}>
            Communication Policy
          </label>
          <div className="relative" ref={policyDropdownRef}>
            <button
              type="button"
              onClick={() => setIsPolicyDropdownOpen(!isPolicyDropdownOpen)}
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
                      selectedPolicy.isActive ? "bg-green-500" : "bg-gray-400"
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
                    onUpdate({
                      selectedCommunicationPolicy: undefined,
                      selectedCommunicationPolicyId: undefined,
                    });
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b"
                  style={{ borderColor: color.border.default }}
                >
                  <div className={`text-sm font-medium ${tw.textPrimary}`}>
                    No Policy
                  </div>
                  <div className={`text-xs ${tw.textSecondary}`}>
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
                        onUpdate({
                          selectedCommunicationPolicy: policy,
                          selectedCommunicationPolicyId: policy.id,
                        });
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                        selectedPolicy?.id === policy.id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            policy.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <div
                          className={`text-sm font-medium ${tw.textPrimary}`}
                        >
                          {policy.name}
                        </div>
                      </div>
                      {policy.description && (
                        <div className={`text-xs ${tw.textSecondary} ml-4`}>
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
              className={`flex items-center justify-between px-3 py-2 mt-2 rounded-md border`}
              style={{
                backgroundColor: color.surface.cards,
                borderColor: color.border.default,
              }}
            >
              <span
                className={`text-xs ${tw.textSecondary} flex items-center gap-2`}
              >
                <Settings className="w-3 h-3" />
                Want to modify this policy?
              </span>
              <button
                type="button"
                onClick={() => handleCustomizePolicy(selectedPolicy)}
                className={`px-3 py-1 text-xs flex items-center gap-1 ${tw.rounded} text-white hover:opacity-90`}
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
                <label
                  className={`text-sm font-medium ${tw.textPrimary} mb-2 block`}
                >
                  SMS Route <span className="text-red-500">*</span>
                </label>
                <HeadlessSelect
                  options={[
                    { value: "", label: "Select SMS Route" },
                    ...((smsRoutes || [])
                      .filter((route) => route.is_active)
                      .map((route) => ({
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
                  zIndex={1050}
                />
                {error === "Please select an SMS route" && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </div>
            )}

            {/* Toolbar */}
            <div
              className="flex items-center justify-between p-3 rounded-md"
              style={{ backgroundColor: color.surface.cards }}
            >
              <span className={`text-sm font-medium ${tw.textPrimary}`}>
                Message Content
              </span>
              <div className="flex items-center gap-2">
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
                      className={`w-4 h-4 transition-transform ${showVariableSelector ? "rotate-180" : ""}`}
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
                <label
                  className={`text-sm font-medium ${tw.textPrimary} mb-2 block`}
                >
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
                  className="w-full px-4 py-2.5 border rounded-md text-sm  focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: color.border.default }}
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <label
                className={`text-sm font-medium ${tw.textPrimary} mb-2 block`}
              >
                Message Body <span className="text-red-500">*</span>
              </label>
              {isRichText ? (
                <div
                  onClick={() => setActiveField("body")}
                  onFocus={() => setActiveField("body")}
                >
                  <RichTextEditor
                    value={messageBody}
                    onChange={setMessageBody}
                    placeholder="Enter your message... Click 'Insert Variable' to add dynamic content like {{customer_identity.first_name}}"
                    minHeight="250px"
                  />
                </div>
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
                  placeholder="Enter your message... Click 'Insert Variable' to add dynamic content like {{customer_identity.first_name}}"
                  rows={10}
                  className="w-full px-4 py-3 border rounded-md  focus:outline-none focus:ring-2 transition-all text-sm resize-none"
                  style={{ borderColor: color.border.default }}
                />
              )}

              {variableError && (
                <div className="mt-3 text-sm text-red-700">
                  {variableError}
                </div>
              )}

              {/* Info bar */}
              <div className="mt-2 flex items-center justify-between">
                {selectedChannel === "SMS" || selectedChannel === "WHATSAPP" ? (
                  messageBody.trim() ? (
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{getCharacterInfo().charCount} characters</span>
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
                    Variables like {"{{field}}"} will be replaced with customer
                    data
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Preview & Test Contacts (2/5) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="sticky top-4">
              <PreviewPanel
                channel={selectedChannel}
                title={messageTitle}
                body={messageBody}
                sampleData={getSampleDataForPreview()}
              />
            </div>

            {/* Test Contacts Selection */}
            {getAvailableTestContacts().length > 0 && (
              <div
                className="bg-white rounded-md shadow-sm border p-4"
                style={{ borderColor: color.border.default }}
              >
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-3`}>
                  Select Test Contacts
                </h3>
                <p className={`text-xs ${tw.textSecondary} mb-3`}>
                  Check the contacts you want to test ({getSelectedTestContacts().length} selected)
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                  {getAvailableTestContacts().map((contact, index) => (
                    <label
                      key={index}
                      className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox checked={selectedTestContacts.has(contact)}
                        onChange={() => toggleTestContact(contact)}
                        disabled={isTesting}
                        className="w-4 h-4 rounded cursor-pointer" />
                      <span className={`text-sm ${tw.textPrimary} flex-1 truncate`}>
                        {contact}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Send Test Button */}
                <div className="mb-4">
                  <button
                    onClick={handleSendTest}
                    disabled={getSelectedTestContacts().length === 0 || isTesting}
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

                {/* Test Error */}
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
                    <label className={`block text-sm font-medium ${tw.textPrimary} mb-2`}>
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
                              <p className={`text-xs ${tw.textMuted} mt-0.5`}>
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
  );
}
