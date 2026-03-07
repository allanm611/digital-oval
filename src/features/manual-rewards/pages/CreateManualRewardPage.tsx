import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Gift, Eye, Calendar } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  useFormDataPersistence,
  clearPersistedFormData,
} from "../../../shared/hooks/useFormDataPersistence";
import { useFormCleanupOnExit } from "../../../shared/hooks/useFormCleanupOnExit";
import ProgressStepper, {
  Step,
} from "../../../shared/components/ui/ProgressStepper";
import SelectCustomersStep from "../components/SelectCustomersStep";
import DefineRewardStep from "../components/DefineRewardStep";
import PreviewRewardStep from "../components/PreviewRewardStep";
import ApplyRewardStep from "../components/ApplyRewardStep";

export interface ManualRewardData {
  // Step 1: Audience
  audienceFile?: File;
  audienceName?: string;
  audienceDescription?: string;
  uploadType?: string;
  quicklistId?: number;
  rowCount?: number;
  audienceFileText?: string;
  inputMethod?: "file" | "manual";

  // Step 2: Reward & Communication Policy
  rewardType?: "bundle" | "points" | "discount" | "cashback";
  rewardValue?: string;
  bundleTrack?: string;
  description?: string;
  selectedCommunicationPolicyId?: number;

  // Step 3: Preview
  previewData?: Record<string, unknown>;

  // Step 4: Apply
  applyType?: "now" | "later";
  applyDate?: string;
  applyTime?: string;
}

export default function CreateManualRewardPage() {
  const navigate = useNavigate();
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  const STEPS: Step[] = [
    {
      id: 1,
      name: t.manualRewards.selectCustomers,
      description: t.manualRewards.selectCustomersDesc,
      icon: Users,
    },
    {
      id: 2,
      name: t.manualRewards.defineReward,
      description: t.manualRewards.defineRewardDesc,
      icon: Gift,
    },
    {
      id: 3,
      name: t.manualRewards.preview,
      description: t.manualRewards.previewDesc,
      icon: Eye,
    },
    {
      id: 4,
      name: t.manualRewards.apply,
      description: t.manualRewards.applyDesc,
      icon: Calendar,
    },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [rewardData, setRewardData] = useState<ManualRewardData>({});

  // Persist form data to localStorage
  useFormDataPersistence("reward_form_data", rewardData, setRewardData, false);

  // Clear persisted form data when user exits the creation flow
  useFormCleanupOnExit("reward_form_data");

  const updateRewardData = (data: Partial<ManualRewardData>) => {
    setRewardData((prev) => ({ ...prev, ...data }));
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
      // TODO: Save manual reward to database
      showToast(t.manualRewards.createdSuccess);

      // Clear localStorage form data after successful creation
      clearPersistedFormData("reward_form_data");

      navigate("/dashboard/manual-rewards");
    } catch (err) {
      console.error("Failed to create manual reward:", err);
      showError(t.manualRewards.createFailed);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SelectCustomersStep
            data={rewardData}
            onUpdate={updateRewardData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <DefineRewardStep
            data={rewardData}
            onUpdate={updateRewardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <PreviewRewardStep
            data={rewardData}
            onUpdate={updateRewardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <ApplyRewardStep
            data={rewardData}
            onUpdate={updateRewardData}
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
        className={`bg-white ${tw.rounded} border p-4`}
        style={{ borderColor: color.border.default }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-3">
              <BackButton
                fallbackTo="/dashboard/manual-rewards"
                className="text-gray-400 hover:text-gray-600"
              />
              <h1 className={`text-lg font-semibold ${tw.textPrimary}`}>
                {t.manualRewards.title}
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
