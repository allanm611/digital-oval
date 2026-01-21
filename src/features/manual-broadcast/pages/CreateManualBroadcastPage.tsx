import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MessageSquare, Send, Calendar } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
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
import { quicklistService } from "../../quicklists/services/quicklistService";
import type { TemplateVariable, AudienceInputMethod } from "../types";

export interface ManualBroadcastData {
  // Step 1: Audience
  audienceFile?: File;
  audienceName?: string;
  audienceDescription?: string;
  uploadType?: string;
  quicklistId?: number;
  rowCount?: number;
  // New fields for enhanced audience selection
  subscriptionIdColumn?: string; // Selected column containing Subscription IDs
  fileColumns?: string[]; // Columns extracted from uploaded file
  inputMethod?: AudienceInputMethod; // "file" or "manual" input method

  // Step 2: Communication
  channel?: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
  messageTitle?: string;
  messageBody?: string;
  isRichText?: boolean;
  // New field for template variables
  selectedVariables?: TemplateVariable[]; // Variables used in the message

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

  const canNavigateToStep = (stepId: number) => {
    // Can navigate to current step or previous steps
    return stepId <= currentStep;
  };

  const handleSubmit = async () => {
    try {
      // First create the QuickList from the stored audience data
      const quicklistResponse = await quicklistService.createQuickList({
        file: broadcastData.audienceFile!,
        upload_type: broadcastData.uploadType!,
        name: broadcastData.audienceName!,
        description: null,
        created_by: null,
      });

      if (!quicklistResponse.success) {
        throw new Error(
          "error" in quicklistResponse
            ? quicklistResponse.error
            : "Failed to create audience QuickList",
        );
      }

      // Now send the communication using the newly created QuickList
      const response = await communicationService.sendCommunication({
        source_type: "quicklist",
        source_id: quicklistResponse.data.quicklist_id,
        channels: broadcastData.channel ? [broadcastData.channel] : [],
        message_template: {
          ...(broadcastData.messageTitle && broadcastData.channel === "EMAIL"
            ? { title: broadcastData.messageTitle }
            : {}),
          body: broadcastData.messageBody || "",
        },
        upload_type: broadcastData.uploadType,
        filters: {
          column_conditions: [],
          limit: 1000,
        },
        batch_size: 500,
        created_by: 1, // TODO: Get from auth context
      });

      if (response.success) {
        showToast(t.manualBroadcast.createdSuccess);

        // Clear localStorage form data after successful creation
        clearPersistedFormData("broadcast_form_data");

        navigate("/dashboard/manual-broadcasts");
      } else {
        throw new Error("Communication sending failed");
      }
    } catch (err) {
      console.error("Failed to create manual broadcast:", err);
      showError(t.manualBroadcast.createFailed);
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
                onClick={() => navigate("/dashboard/manual-broadcasts")}
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
