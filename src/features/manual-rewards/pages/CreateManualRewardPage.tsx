import { useState, useEffect } from "react";
import Input from "../../../shared/components/ui/Input";
import { useNavigate, useLocation, useParams } from "react-router-dom";
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
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { dummyManualRewards } from "../data/dummyManualRewards";
import type { ManualReward } from "../types/manualReward";

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
  channel?: "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
  smsRoute?: string;
  rewardTitle?: string;
  selectedCommunicationPolicyId?: number;
  seedTestContacts?: string[];
  rewardValidation?: {
    completed: boolean;
    passed: number;
    failed: number;
    testedAt: string;
  };

  // Step 3: Apply
  applyType?: "now" | "later";
  applyDate?: string;
  applyTime?: string;

  // Step 4: Preview
  previewData?: Record<string, unknown>;
}

export default function CreateManualRewardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: rewardId } = useParams<{ id: string }>();
  const isEditMode = !!rewardId && location.pathname.includes("/edit");
  const { success: showToast, error: showError } = useToast();
  const { t } = useLanguage();

  // Check if we came from a returnTo state
  const returnTo = (
    location.state as {
      returnTo?: {
        pathname: string;
      };
    }
  )?.returnTo;

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
      name: t.manualRewards.apply,
      description: t.manualRewards.applyDesc,
      icon: Calendar,
    },
    {
      id: 4,
      name: t.manualRewards.preview,
      description: t.manualRewards.previewDesc,
      icon: Eye,
    },
  ];
  const [currentStep, setCurrentStep] = useState(1);
  const [rewardData, setRewardData] = useState<ManualRewardData>({});
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Load reward data in edit mode
  useEffect(() => {
    if (isEditMode && rewardId) {
      const parsedId = Number(rewardId);
      const reward = dummyManualRewards.find((r) => r.id === parsedId);
      if (reward) {
        setRewardData({
          audienceName: reward.name,
          rewardType: reward.rewardType,
          rewardValue: reward.rewardValue.replace(/[^0-9.]/g, ""),
          description: "",
        });
      }
      setIsLoading(false);
    }
  }, [isEditMode, rewardId]);

  // Persist form data to localStorage (only in create mode)
  useFormDataPersistence("reward_form_data", rewardData, setRewardData, isEditMode);

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

  const validateManualInput = (input: string): boolean => {
    if (!input.trim()) return false;
    const lines = input.split("\n").filter((line) => line.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d+\-() \s]{5,}$/;
    return lines.some((line) => emailRegex.test(line) || phoneRegex.test(line));
  };

  const isCurrentStepValid = (): boolean => {
    switch (currentStep) {
      case 1: // Select Customers - must have audience name, type, input method, and valid input
        if (
          !rewardData.audienceName ||
          !rewardData.uploadType ||
          !rewardData.inputMethod
        ) {
          return false;
        }
        // For file method, must have quicklist selected
        if (rewardData.inputMethod === "file") {
          return !!rewardData.quicklistId;
        }
        // For manual method, must have valid manual input (emails or phone numbers)
        if (rewardData.inputMethod === "manual") {
          return (
            !!rewardData.audienceFileText &&
            validateManualInput(rewardData.audienceFileText)
          );
        }
        return false;
      case 2: // Define Reward
        return !!(
          rewardData.rewardValue &&
          rewardData.rewardValue.trim() &&
          rewardData.rewardValidation?.completed
        );
      case 3: // Apply
        if (rewardData.applyType === "later") {
          return !!(rewardData.applyDate && rewardData.applyTime);
        }
        return true;
      case 4: // Preview
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      // TODO: Save manual reward to database
      if (isEditMode) {
        showToast(t.manualRewards.updatedSuccess || "Reward updated successfully");
      } else {
        showToast(t.manualRewards.createdSuccess);
      }

      // Clear localStorage form data after successful creation
      clearPersistedFormData("reward_form_data");

      // Navigate back to details or list
      if (isEditMode && rewardId) {
        navigate(`/dashboard/manual-rewards/${rewardId}`);
      } else {
        navigate("/dashboard/manual-rewards");
      }
    } catch (err) {
      console.error(`Failed to ${isEditMode ? "update" : "create"} manual reward:`, err);
      showError(isEditMode ? "Update failed" : t.manualRewards.createFailed);
    } finally {
      setIsSaving(false);
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
          <ApplyRewardStep
            data={rewardData}
            onUpdate={updateRewardData}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <PreviewRewardStep data={rewardData} onPrevious={handlePrevious} />
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
          Loading reward details...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div
        className={`bg-white ${tw.rounded} border p-4`}
        style={{ borderColor: color.border.default }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <BackButton
              fallbackTo={returnTo?.pathname || "/dashboard/manual-broadcasts"}
              showBreadcrumb={true}
              currentLabel={isEditMode ? "Edit Manual Reward" : "Create Manual Reward"}
            />
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
                onClick={
                  currentStep === STEPS.length ? handleSubmit : handleNext
                }
                disabled={!isCurrentStepValid() || isSaving}
                className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {currentStep === STEPS.length ? (
                  isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEditMode ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditMode ? "Update Reward" : "Create Reward"
                  )
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
