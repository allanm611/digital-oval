import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, Send, Calendar } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { useAuth } from "../../../contexts/AuthContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import {
  useFormDataPersistence,
  clearPersistedFormData,
} from "../../../shared/hooks/useFormDataPersistence";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import TargetAudienceStep from "../components/TargetAudienceStep";
import DefineCommunicationStep from "../components/DefineCommunicationStep";
import TestBroadcastStep from "../components/TestBroadcastStep";
import ScheduleStep from "../components/ScheduleStep";
import { communicationService } from "../../communications/services/communicationService";
import type { TemplateVariable, AudienceInputMethod } from "../types";
import type { CommunicationPolicyConfiguration } from "../../campaigns/types/communicationPolicyConfig";
import type { ManualCommunicationRecipient } from "../../communications/types/communication";
import { PermissionGate } from "../../auth/components/PermissionGate";

export interface ManualBroadcastData {
  // Step 1: Audience
  audienceFile?: File;
  audienceFileText?: string;
  audienceName?: string;
  audienceDescription?: string;
  uploadType?: string;
  quicklistId?: number;
  rowCount?: number;
  subscriptionIdColumn?: string;
  fileColumns?: string[];
  fileDelimiter?: string;
  fileHeaders?: string;
  inputMethod?: AudienceInputMethod;

  // Step 2: Communication
  channel?: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
  messageTitle?: string;
  messageBody?: string;
  isRichText?: boolean;
  smsRoute?: string;
  selectedVariables?: TemplateVariable[];
  selectedCommunicationPolicy?: CommunicationPolicyConfiguration;
  selectedCommunicationPolicyId?: number;

  // Step 3: Test
  testContacts?: string[];
  testResults?: Record<string, unknown>;

  // Step 4: Schedule
  scheduleType?: "now" | "later";
  scheduleDate?: string;
  scheduleTime?: string;
}

export default function CreateManualBroadcastPage() {
  const navigate = useNavigate();
  const { id: executionId } = useParams<{ id: string }>();
  const location = useLocation();
  const isEditMode = !!executionId && location.pathname.includes("/edit");
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();

  const STEPS: Step[] = [
    {
      id: 1,
      name: t.manualBroadcast.targetAudience,
      description: t.manualBroadcast.targetAudienceDesc,
      icon: Users,
    },
    {
      id: 2,
      name: t.manualBroadcast.defineCommunication,
      description: t.manualBroadcast.defineCommunicationDesc,
      icon: MessageSquare,
    },
    {
      id: 3,
      name: t.manualBroadcast.testBroadcast,
      description: t.manualBroadcast.testBroadcastDesc,
      icon: Send,
    },
    {
      id: 4,
      name: t.manualBroadcast.schedule,
      description: t.manualBroadcast.scheduleDesc,
      icon: Calendar,
    },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [broadcastData, setBroadcastData] = useState<ManualBroadcastData>({});
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Load execution data in edit mode
  useEffect(() => {
    if (isEditMode && executionId) {
      const loadExecutionData = async () => {
        try {
          setIsLoading(true);
          const response = await communicationService.getExecutionDetails(executionId);
          if (response.success && response.data) {
            const exec = response.data.execution as { channel?: string; name?: string; execution_id?: string; source_name?: string; message_template?: { title?: string; body?: string; is_rich_text?: boolean }; source_type?: string; source_id?: string; source_name?: string };
            const logs = response.data.recent_logs || [];

            // Extract channel from logs if available
            const channel = logs.length > 0 ? logs[0].channel : exec.channel || "EMAIL";

            // Extract message template from logs or execution
            const messageTemplate = logs.length > 0
              ? {
                  title: logs[0].title || "",
                  body: logs[0].body_preview || exec.message_template?.body || "",
                }
              : {
                  title: exec.message_template?.title || "",
                  body: exec.message_template?.body || "",
                };

            // Prefill form data based on source type
            const prefillData: Partial<ManualBroadcastData> = {
              audienceName: exec.source_name || exec.name || `Broadcast ${exec.execution_id}`,
              channel: channel as "EMAIL" | "SMS" | "WHATSAPP" | "PUSH",
              messageTitle: messageTemplate.title,
              messageBody: messageTemplate.body,
              isRichText: exec.message_template?.is_rich_text || false,
              scheduleType: "now",
            };

            // Handle source type specific prefilling
            if (exec.source_type === "quicklist" && exec.source_id) {
              prefillData.quicklistId = exec.source_id;
              prefillData.audienceName = exec.source_name || `Quicklist ${exec.source_id}`;
            } else if (exec.source_type === "manual") {
              prefillData.inputMethod = "manual";
              prefillData.audienceName = exec.source_name || "Manual Audience";
            }

            setBroadcastData(prefillData);
          }
        } catch (err) {
          console.error("Failed to load execution details:", err);
          showError("Failed to load broadcast details");
          navigate("/dashboard/manual-communications");
        } finally {
          setIsLoading(false);
        }
      };
      loadExecutionData();
    }
  }, [isEditMode, executionId, showError, navigate]);

  // Persist form data to localStorage
  useFormDataPersistence(
    "broadcast_form_data",
    broadcastData,
    setBroadcastData,
    false,
  );

  const updateBroadcastData = (data: Partial<ManualBroadcastData>) => {
    setBroadcastData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (canNavigateToStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const isStepValid = (stepId: number): boolean => {
    // Validate each step's required fields
    switch (stepId) {
      case 1: // Target Audience
        return !!(broadcastData.audienceFile || broadcastData.quicklistId);
      case 2: // Define Communication
        return !!(
          broadcastData.channel &&
          broadcastData.messageBody &&
          (broadcastData.channel !== "EMAIL" || broadcastData.messageTitle)
        );
      case 3: // Test Broadcast
        return (
          !!broadcastData.testContacts && broadcastData.testContacts.length > 0
        );
      case 4: // Schedule
        return !!(broadcastData.scheduleType && broadcastData.scheduleDate);
      default:
        return true;
    }
  };

  const canNavigateToStep = (stepId: number) => {
    // Can always go to previous steps
    if (stepId < currentStep) {
      return true;
    }
    // Can go to next step only if current step is valid
    if (stepId === currentStep + 1) {
      return isStepValid(currentStep);
    }
    // Can't skip ahead
    return false;
  };

  // Parse audience data into recipient list for manual input
  const parseRecipientList = (): ManualCommunicationRecipient[] => {
    const recipients: ManualCommunicationRecipient[] = [];

    // If file-based audience with headers
    if (broadcastData.audienceFileText && broadcastData.fileHeaders) {
      const lines = broadcastData.audienceFileText
        .split("\n")
        .filter((line) => line.trim());
      const delimiter = broadcastData.fileDelimiter || ",";
      const headers = broadcastData.fileHeaders
        .split(delimiter)
        .map((h) => h.trim());

      // Skip header row if present
      const dataLines = lines.slice(1);

      dataLines.forEach((line) => {
        const values = line.split(delimiter).map((v) => v.trim());
        const recipient: ManualCommunicationRecipient = {};

        headers.forEach((header, idx) => {
          recipient[header] = values[idx] || "";
        });

        // Ensure at least email or phone is present
        if (recipient.email || recipient.phone || recipient.name) {
          recipients.push(recipient);
        }
      });
    }
    // If manual input (from TargetAudienceStep)
    else if (
      broadcastData.audienceFileText &&
      broadcastData.inputMethod === "manual"
    ) {
      // Manual input is stored as raw text in audienceFileText
      const lines = broadcastData.audienceFileText
        .split(/[\n,]/) // Split by newline or comma
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      lines.forEach((line) => {
        const recipient: ManualCommunicationRecipient = {};

        // Try to determine if it's an email or phone
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\d+\-\s()]+$/;

        if (emailRegex.test(line)) {
          recipient.email = line;
        } else if (phoneRegex.test(line)) {
          recipient.phone = line;
        } else {
          // Treat as name if it doesn't match email or phone pattern
          recipient.name = line;
        }

        // Only add if we have at least an email or phone
        if (recipient.email || recipient.phone) {
          recipients.push(recipient);
        }
      });
    }

    return recipients;
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // In edit mode, resend the communication with updated message content
      if (isEditMode && executionId) {
        // For edit mode, resend the broadcast with the same audience but updated message
        const response = await communicationService.sendCommunication({
          source_type: broadcastData.quicklistId ? "quicklist" : "manual",
          ...(broadcastData.quicklistId ? { source_id: broadcastData.quicklistId } : {}),
          ...(broadcastData.audienceName ? { name: broadcastData.audienceName } : {}),
          channels: broadcastData.channel ? [broadcastData.channel] : [],
          message_template: {
            ...(broadcastData.messageTitle &&
            broadcastData.channel === "EMAIL"
              ? { title: broadcastData.messageTitle }
              : {}),
            body: broadcastData.messageBody || "",
          },
          ...(broadcastData.audienceFileText && !broadcastData.quicklistId
            ? { recipient_list: parseRecipientList() }
            : {}),
          created_by: user?.user_id,
        });

        if (response.success) {
          showToast(t.manualBroadcast.updatedSuccess || "Broadcast resent successfully!");
          clearPersistedFormData("broadcast_form_data");
          // Delay navigation to allow success message to be seen
          setTimeout(() => {
            navigate("/dashboard/manual-communications");
          }, 1500);
          return;
        } else {
          throw new Error(response.error || "Communication resending failed");
        }
      }

      // Check if error is a gateway timeout error (504/503)
      const isGatewayError = (err: unknown): boolean => {
        if (err instanceof Error) {
          const message = err.message.toLowerCase();
          return (
            message.includes("504") ||
            message.includes("503") ||
            message.includes("gateway timeout") ||
            message.includes("service temporarily unavailable") ||
            message.includes("gateway") ||
            message.includes("timeout")
          );
        }
        return false;
      };

      // Case 1: QuickList-based submission (selected or created quicklist)
      if (broadcastData.quicklistId) {
        const response = await communicationService.sendCommunication({
          source_type: "quicklist",
          source_id: broadcastData.quicklistId,
          ...(broadcastData.audienceName ? { name: broadcastData.audienceName } : {}),
          channels: broadcastData.channel ? [broadcastData.channel] : [],
          message_template: {
            ...(broadcastData.messageTitle &&
            broadcastData.channel === "EMAIL"
              ? { title: broadcastData.messageTitle }
              : {}),
            body: broadcastData.messageBody || "",
          },
          filters: {
            column_conditions: [],
            limit: 1000,
          },
          batch_size: user?.user_id,
        });

        if (response.success) {
          showToast(t.manualBroadcast.createdSuccess);
          clearPersistedFormData("broadcast_form_data");
          // Delay navigation to allow success message to be seen
          setTimeout(() => {
            navigate("/dashboard/manual-communications");
          }, 1500);
        } else {
          // Show actual error from backend
          throw new Error(response.error || "Communication sending failed");
        }
      }
      // Case 2: Manual input submission
      else if (broadcastData.audienceFileText) {
        const recipientList = parseRecipientList();

        if (recipientList.length === 0) {
          throw new Error("No valid recipients found in audience data");
        }

        // Send to manual recipient list
        const response = await communicationService.sendCommunication({
          source_type: "manual",
          recipient_list: recipientList,
          ...(broadcastData.audienceName ? { name: broadcastData.audienceName } : {}),
          channels: broadcastData.channel ? [broadcastData.channel] : [],
          message_template: {
            ...(broadcastData.messageTitle &&
            broadcastData.channel === "EMAIL"
              ? { title: broadcastData.messageTitle }
              : {}),
            body: broadcastData.messageBody || "",
          },
          created_by: user?.user_id,
        });

        if (response.success) {
          showToast(t.manualBroadcast.createdSuccess);
          clearPersistedFormData("broadcast_form_data");
          // Delay navigation to allow success message to be seen
          setTimeout(() => {
            navigate("/dashboard/manual-communications");
          }, 1500);
        } else {
          // Show actual error from backend
          throw new Error(response.error || "Communication sending failed");
        }
      } else {
        throw new Error("No audience selected or provided");
      }
    } catch (err) {
      console.error("Failed to create manual broadcast:", err);

      // Detect gateway timeout errors specifically
      const errorMessage = (err as Error).message || "An error occurred";
      const isGatewayTimeout =
        errorMessage.toLowerCase().includes("504") ||
        errorMessage.toLowerCase().includes("gateway timeout") ||
        errorMessage.toLowerCase().includes("timeout");

      if (isGatewayTimeout) {
        showError(
          "Failed to create manual communication",
          "The request timed out. Please try again.",
        );
      } else {
        showError(
          t.manualBroadcast.createFailed,
          errorMessage,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <TargetAudienceStep
            data={broadcastData}
            onUpdate={updateBroadcastData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <DefineCommunicationStep
            data={broadcastData}
            onUpdate={updateBroadcastData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <TestBroadcastStep
            data={broadcastData}
            onUpdate={updateBroadcastData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <ScheduleStep
            data={broadcastData}
            onUpdate={updateBroadcastData}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner
          variant="modern"
          size="xl"
          color="primary"
          className="mb-4"
        />
        <p className={`${tw.textMuted} font-medium text-sm`}>
          {t.manualBroadcast.loading || "Loading broadcast..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className="bg-white rounded-md border p-4"
        style={{ borderColor: color.border.default }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate("/dashboard/manual-communications")}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className={`text-lg font-semibold ${tw.textPrimary}`}>
                {isEditMode ? t.manualBroadcast.editTitle || "Edit Broadcast" : t.manualBroadcast.title}
              </h1>
            </div>
          </div>

          {/* Sticky Progress Navigation */}
          <ProgressStepper
            steps={STEPS}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            canNavigateToStep={canNavigateToStep}
            primaryColor={color.primary.action}
            textPrimary={tw.textPrimary}
            textMuted={tw.textMuted}
          />

          {/* Step Content */}
          <div className="py-4">{renderStep()}</div>
        </div>
      </div>
    </div>
  );
}
