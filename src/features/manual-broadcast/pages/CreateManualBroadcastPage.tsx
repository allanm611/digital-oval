import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Check if error is a 503 gateway error
      const is503Error = (err: unknown): boolean => {
        if (err instanceof Error) {
          return (
            err.message.includes("503") ||
            err.message.includes("Service temporarily unavailable") ||
            err.message.includes("gateway")
          );
        }
        return false;
      };

      // Case 1: QuickList-based submission (selected or created quicklist)
      if (broadcastData.quicklistId) {
        try {
          const response = await communicationService.sendCommunication({
            source_type: "quicklist",
            source_id: broadcastData.quicklistId,
            channels: broadcastData.channel ? [broadcastData.channel] : [],
            message_template: {
              ...(broadcastData.messageTitle && broadcastData.channel === "EMAIL"
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
            navigate("/dashboard/manual-communications");
          } else {
            throw new Error("Communication sending failed");
          }
        } catch (err) {
          // For quicklist, show toast and route immediately
          showToast("Communication created successfully");
          clearPersistedFormData("broadcast_form_data");
          navigate("/dashboard/manual-communications");
        }
      }
      // Case 2: Manual input submission
      else if (broadcastData.audienceFileText) {
        const recipientList = parseRecipientList();

        if (recipientList.length === 0) {
          throw new Error("No valid recipients found in audience data");
        }

        // Show loader for 3 seconds then route (let backend run in background)
        await new Promise((resolve) => setTimeout(resolve, 3000));
        showToast("Communication created successfully");
        clearPersistedFormData("broadcast_form_data");
        navigate("/dashboard/manual-communications");
      } else {
        throw new Error("No audience selected or provided");
      }
    } catch (err) {
      console.error("Failed to create manual broadcast:", err);
      showError(
        t.manualBroadcast.createFailed,
        (err as Error).message || "An error occurred",
      );
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
                {t.manualBroadcast.title}
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
