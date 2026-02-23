import { useState, useRef, useEffect } from "react";
import {
  Mail,
  MessageSquare,
  Phone,
  Bell,
  AlertCircle,
  Variable,
  ChevronDown,
  Settings,
} from "lucide-react";
import { color, tw, components } from "../../../shared/utils/utils";
import { ManualBroadcastData } from "../pages/CreateManualBroadcastPage";
import PreviewPanel from "../../communications/components/PreviewPanel";
import { useLanguage } from "../../../contexts/LanguageContext";
import CascadingVariableSelector from "./CascadingVariableSelector";
import type { TemplateVariable } from "../types";
import {
  insertVariableAtCursor,
  formatVariablePlaceholder,
} from "../utils/variableInsertion";
import { useConfigurationData } from "../../../shared/services/configurationDataService";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { CommunicationPolicyConfiguration } from "../../campaigns/types/communicationPolicyConfig";
import { communicationPolicyService } from "../../campaigns/services/communicationPolicyService";
import CommunicationPolicyModal from "../../campaigns/components/CommunicationPolicyModal";
import PolicyNameModal from "../../campaigns/components/PolicyNameModal";
import { useClickOutside } from "../../../shared/hooks/useClickOutside";
import { useToast } from "../../../contexts/ToastContext";

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
  const { data: smsRoutes } = useConfigurationData("smsRoutes");

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
  const [selectedVariables, setSelectedVariables] = useState<
    TemplateVariable[]
  >(data.selectedVariables || []);

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

  // Handle opening customization modal
  const handleCustomizePolicy = (policy: CommunicationPolicyConfiguration) => {
    // Create a copy of the policy with a temporary name for the modal
    const policyWithTempName = {
      ...policy,
      name: `${policy.name} - Customizing...`,
    };
    setPolicyToCustomize(policyWithTempName);
    setIsCustomizationModalOpen(true);
  };

  // Handle saving customized policy
  const handleSaveCustomizedPolicy = async (
    policyData: Record<string, unknown>,
  ) => {
    // Store the policy data and open name modal
    // First close the customization modal
    setIsCustomizationModalOpen(false);

    // Then store data and open name modal
    setPendingPolicyData(policyData);
    setIsNameModalOpen(true);
  };

  // Handle confirming policy name
  const handleConfirmPolicyName = async (policyName: string) => {
    if (!pendingPolicyData || !policyToCustomize) return;

    try {
      // Get the original policy name (remove the temporary suffix)
      const originalPolicyName = policyToCustomize.name.replace(
        " - Customizing...",
        "",
      );

      // Create new policy with customized configuration
      const newPolicy = communicationPolicyService.createPolicy({
        name: policyName,
        description:
          pendingPolicyData.description ||
          `Custom policy based on ${originalPolicyName}`,
        channels: pendingPolicyData.channels || ["EMAIL"],
        type: pendingPolicyData.type,
        config: pendingPolicyData.config,
        isActive: pendingPolicyData.isActive ?? true,
      });

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
    (selectedVariables || []).forEach((variable) => {
      const key = `${(variable.sourceName || "source").toLowerCase().replace(/\s+/g, "_")}.${variable.value || "field"}`;
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

  const handleNext = () => {
    if (!messageBody.trim()) {
      setError(t.manualBroadcast.errorMessageBodyRequired);
      return;
    }
    if (selectedChannel === "EMAIL" && !messageTitle.trim()) {
      setError(t.manualBroadcast.errorSubjectRequired);
      return;
    }
    if (selectedChannel === "SMS" && !smsRoute.trim()) {
      setError("Please select an SMS route");
      return;
    }
    setError("");
    onUpdate({
      channel: selectedChannel,
      messageTitle: messageTitle.trim(),
      messageBody: messageBody.trim(),
      isRichText,
      smsRoute: selectedChannel === "SMS" ? smsRoute : undefined,
      selectedVariables,
      // Add communication policy data
      selectedCommunicationPolicy: selectedPolicy || undefined,
      selectedCommunicationPolicyId: selectedPolicy?.id || undefined,
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
                  placeholder="Select SMS Route"
                  zIndex={1050}
                />
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
            className="mt-6 p-3 rounded-md flex items-start gap-2"
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

      {/* Footer */}
      <div
        className="sticky bottom-12 z-40 bg-white p-5 flex items-center justify-between"
      >
        <button
          onClick={onPrevious}
          className="px-6 py-2.5 rounded-md text-sm font-medium transition-all"
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
          className="px-6 py-2.5 text-white rounded-md text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: color.primary.action }}
        >
          {t.manualBroadcast.nextTest}
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
  );
}
