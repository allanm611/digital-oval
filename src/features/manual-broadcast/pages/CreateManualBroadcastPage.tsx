import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, Calendar } from "lucide-react";
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
import ScheduleStep from "../components/ScheduleStep";
import { communicationService } from "../../communications/services/communicationService";
import { quicklistService } from "../../quicklists/services/quicklistService";
import type { TemplateVariable, AudienceInputMethod } from "../types";
import type { CommunicationPolicyConfiguration } from "../../campaigns/types/communicationPolicyConfig";
import type { ManualCommunicationRecipient } from "../../communications/types/communication";
import type { QuickListWithDetails } from "../../quicklists/types/quicklist";
import { PermissionGate } from "../../auth/components/PermissionGate";

export interface ManualBroadcastData {
  // Step 1: Audience
  audienceFile?: File;
  audienceFileText?: string;
  audienceName?: string;
  audienceDescription?: string;
  uploadType?: string;
  quicklistId?: number;
  quicklist?: QuickListWithDetails; // Full quicklist object for edit mode
  rowCount?: number;
  subscriptionIdColumn?: string;
  fileColumns?: string[];
  fileDelimiter?: string;
  fileHeaders?: string;
  inputMethod?: AudienceInputMethod;

  // Step 2: Communication
  communicationId?: number; // ID of the communication definition (for editing)
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

  // Check if we came from a returnTo state
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
        fromModal?: boolean;
      };
    }
  )?.returnTo;

  const navigateBack = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        state: returnTo.fromModal ? { fromModal: true } : undefined,
      });
    } else {
      navigate("/dashboard/manual-communications");
    }
  };

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
      name: t.manualBroadcast.schedule,
      description: t.manualBroadcast.scheduleDesc,
      icon: Calendar,
    },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [broadcastData, setBroadcastData] = useState<ManualBroadcastData>({});
  const [isLoading, setIsLoading] = useState(isEditMode);

  // Load broadcast template data in edit mode
  useEffect(() => {
    if (isEditMode && executionId) {
      const loadBroadcastData = async () => {
        try {
          setIsLoading(true);

          // Get execution details for recipient list and broadcast info
          const execResponse = await communicationService.getExecutionDetails(executionId, true);

          if (!execResponse?.success || !execResponse?.data?.execution) {
            showError("Failed to load broadcast details", "", true); // bypassSilentMode
            navigate("/dashboard/manual-communications");
            return;
          }

          const exec = execResponse.data.execution;
          const logs = execResponse?.data?.recent_logs || [];

          // Extract channel from logs or execution with optional chaining
          const channel = logs?.[0]?.channel || exec?.channels?.[0] || exec?.channel || "EMAIL";

          // Extract message template from execution with optional chaining
          const messageBody = exec?.message_template?.body || "";
          const messageTitle = exec?.message_template?.title || "";

          // Extract recipient count from execution
          const recipientCount = exec?.total_recipients ?? 0;

          // Extract unique recipient identifiers from logs
          const recipientList = logs
            ?.map((log: any) => log?.recipient_identifier)
            ?.filter((identifier: any) => !!identifier)
            ?.filter((v: any, i: any, a: any) => a.indexOf(v) === i) // Remove duplicates
            ?.join("\n") || "";

          // Prefill form data
          const prefillData: Partial<ManualBroadcastData> = {
            communicationId: exec?.communication_id,
            audienceName: exec?.name || exec?.source_name || `Broadcast ${exec?.id || "Unknown"}`,
            channel: (channel as "EMAIL" | "SMS" | "WHATSAPP" | "PUSH") || "EMAIL",
            messageTitle: messageTitle,
            messageBody: messageBody,
            isRichText: exec?.message_template?.is_rich_text ?? false,
            scheduleType: "now",
            rowCount: recipientCount,
            audienceFileText: recipientList,
            audienceDescription: recipientCount > 0 ? `Manual broadcast with ${recipientCount} recipient${recipientCount !== 1 ? "s" : ""}` : "",
          };

          // Handle source type specific prefilling
          if (exec?.source_type === "quicklist" && exec?.source_id) {
            prefillData.inputMethod = "file"; // Set input method to file for quicklist
            prefillData.quicklistId = exec.source_id;
            prefillData.audienceName = exec?.source_name || `Quicklist ${exec.source_id}`;

            // Fetch full quicklist details for display in edit mode
            try {
              const quicklistResponse = await quicklistService.getQuickListById(exec.source_id);
              if (quicklistResponse.success && "data" in quicklistResponse) {
                prefillData.quicklist = quicklistResponse.data;
              }
            } catch (err) {
              console.error("Failed to fetch quicklist details:", err);
              // Continue with just the ID and name if fetch fails
            }
          } else if (exec?.source_type === "manual") {
            prefillData.inputMethod = "manual";
            prefillData.audienceName = exec?.name || exec?.source_name || "Manual Audience";
          }

          setBroadcastData(prefillData);
        } catch (err) {
          console.error("Failed to load broadcast details:", err);
          showError("Failed to load broadcast details", "", true); // bypassSilentMode
          navigate("/dashboard/manual-communications");
        } finally {
          setIsLoading(false);
        }
      };
      loadBroadcastData();
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
      case 3: // Schedule
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
      // Don't set isLoading - let ScheduleStep button handle the loading state
      // This keeps the page visible while the API is processing

      // In edit mode, update the communication definition and resend
      if (isEditMode && executionId && broadcastData.communicationId) {
        // Step 1: Update the communication definition using PUT endpoint
        const updateResponse = await communicationService.updateCommunication(
          broadcastData.communicationId,
          {
            name: broadcastData.audienceName || `Broadcast ${new Date().toLocaleDateString()}`,
            description: `Manual broadcast update`,
            source_type: broadcastData.quicklistId ? "quicklist" : "manual",
            ...(broadcastData.quicklistId ? { source_id: broadcastData.quicklistId } : {}),
            channels: broadcastData.channel ? [broadcastData.channel] : [],
            message_template: {
              ...(broadcastData.messageTitle &&
              broadcastData.channel === "EMAIL"
                ? { title: broadcastData.messageTitle }
                : {}),
              body: broadcastData.messageBody || "",
            },
            created_by: user?.user_id,
          }
        );

        if (!updateResponse.success) {
          throw new Error("Failed to update communication definition");
        }

        // Step 2: Resend the broadcast with the updated message
        const response = await communicationService.sendCommunication({
          communication_id: broadcastData.communicationId,
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
          // Fetch updated communications list
          await communicationService.getCommunications();

          showToast(t.manualBroadcast.updatedSuccess || "Broadcast updated successfully!");
          clearPersistedFormData("broadcast_form_data");
          navigate("/dashboard/manual-communications");
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
        // Step 1: Create communication definition
        const createDefResponse = await communicationService.createCommunication({
          name: broadcastData.audienceName || `Broadcast ${new Date().toLocaleDateString()}`,
          description: `Manual broadcast to quicklist: ${broadcastData.audienceName || "Untitled"}`,
          source_type: "quicklist",
          source_id: broadcastData.quicklistId,
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

        if (!createDefResponse.success) {
          throw new Error("Failed to create communication definition");
        }

        const communicationId = createDefResponse.data.id;

        // Step 2: Send the communication with the communication_id
        const response = await communicationService.sendCommunication({
          communication_id: communicationId,
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
          // Fetch updated communications list
          await communicationService.getCommunications();

          showToast(t.manualBroadcast.createdSuccess);
          clearPersistedFormData("broadcast_form_data");
          navigate("/dashboard/manual-communications");
        } else {
          throw new Error(response.error || "Communication sending failed");
        }
      }
      // Case 2: Manual input submission
      else if (broadcastData.audienceFileText) {
        const recipientList = parseRecipientList();

        if (recipientList.length === 0) {
          throw new Error("No valid recipients found in audience data");
        }

        // Step 1: Create communication definition
        const createDefResponse = await communicationService.createCommunication({
          name: broadcastData.audienceName || `Manual Broadcast ${new Date().toLocaleDateString()}`,
          description: `Manual broadcast with ${recipientList.length} recipients`,
          source_type: "manual",
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

        if (!createDefResponse.success) {
          throw new Error("Failed to create communication definition");
        }

        const communicationId = createDefResponse.data.id;

        // Step 2: Send the communication with the communication_id
        const response = await communicationService.sendCommunication({
          communication_id: communicationId,
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
          // Fetch updated communications list
          await communicationService.getCommunications();

          showToast(t.manualBroadcast.createdSuccess);
          clearPersistedFormData("broadcast_form_data");
          navigate("/dashboard/manual-communications");
        } else {
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
        errorMessage.toLowerCase().includes("503") ||
        errorMessage.toLowerCase().includes("gateway timeout") ||
        errorMessage.toLowerCase().includes("service temporarily unavailable") ||
        errorMessage.toLowerCase().includes("gateway") ||
        errorMessage.toLowerCase().includes("timeout");

      if (isGatewayTimeout) {
        showError(
          "Failed to create manual communication",
          "The request timed out. Please try again.",
          true // bypassSilentMode
        );
      } else {
        showError(
          t.manualBroadcast.createFailed,
          errorMessage,
          true // bypassSilentMode
        );
      }
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
          <ScheduleStep
            data={broadcastData}
            onUpdate={updateBroadcastData}
            onSubmit={handleSubmit}
            onPrevious={handlePrevious}
            isEditMode={isEditMode}
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
                onClick={navigateBack}
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

          {/* Bottom Navigation */}
          <div className="sticky bottom-12 bg-white py-4 shadow-sm mt-8">
            <div className="flex justify-between items-center">
              {currentStep > 1 && (
                <button
                  onClick={handlePrevious}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 ${tw.rounded} text-sm font-medium hover:bg-gray-50 transition-all duration-200`}
                >
                  Previous
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={currentStep === STEPS.length ? handleSubmit : handleNext}
                disabled={!isStepValid(currentStep)}
                className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {currentStep === STEPS.length ? "Send Broadcast" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
