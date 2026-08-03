import { useState, useEffect } from "react";
import Input from "../../../shared/components/ui/Input";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Users, Gift, Eye, Calendar } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { manualRewardService } from "../services/manualRewardService";
import { buildCreateManualRewardPayload } from "../utils/buildCreateManualRewardPayload";
import { buildUpdateManualRewardPayload } from "../utils/buildUpdateManualRewardPayload";
import { parseRecipientMsisdns } from "../utils/parseRecipientMsisdns";
import { canEditManualReward } from "../utils/canEditManualReward";
import { mapManualRewardResourceToFormData } from "../utils/mapManualRewardResourceToFormData";
import { resolveCreatedRewardId } from "../utils/resolveCreatedRewardId";
import type { ManualRewardApiStatus } from "../types/manualRewardApi";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
  useFormDataPersistence,
  clearPersistedFormData,
} from "../../../shared/hooks/useFormDataPersistence";
import { useFormCleanupOnExit } from "../../../shared/hooks/useFormCleanupOnExit";
import { Step } from "../../../shared/components/ui/ProgressStepper";
import SelectCustomersStep from "../components/SelectCustomersStep";
import DefineRewardStep from "../components/DefineRewardStep";
import PreviewRewardStep from "../components/PreviewRewardStep";
import ApplyRewardStep from "../components/ApplyRewardStep";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import MultiStepFormWrapper from "../../../shared/components/MultiStepFormWrapper";

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
  rewardType?: "bundle" | "airtime" | "points" | "discount" | "cashback";
  /** Selected reward provider (Configurations → Reward Providers) */
  rewardProviderId?: string;
  /** Active reward configuration used for RewardDeliveryService */
  rewardConfigurationId?: number;
  rewardConfigurationName?: string;
  /** Runtime auth/payload overrides for this grant */
  rewardAuthConfig?: Record<string, unknown>;
  rewardPayloadConfig?: Record<string, unknown>;
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
  const [editBlockedMessage, setEditBlockedMessage] = useState("");
  const [loadedEditStatus, setLoadedEditStatus] =
    useState<ManualRewardApiStatus | null>(null);

  // Load reward data in edit mode (GET /manual-reward/:id)
  useEffect(() => {
    if (!isEditMode || !rewardId) {
      return;
    }

    const parsedId = Number(rewardId);
    if (!Number.isFinite(parsedId)) {
      setEditBlockedMessage("Invalid reward id.");
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const row = await manualRewardService.getById(parsedId);
        if (cancelled) return;

        if (!canEditManualReward(row.status)) {
          setEditBlockedMessage(
            "Applied rewards cannot be edited. View details or create a new grant.",
          );
          return;
        }

        setLoadedEditStatus(row.status);
        setRewardData(mapManualRewardResourceToFormData(row));
      } catch (err) {
        if (!cancelled) {
          setEditBlockedMessage(
            extractBackendError(err, "Failed to load reward for editing."),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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
            parseRecipientMsisdns(rewardData).length > 0
          );
        }
        return false;
      case 2: // Define Reward
        if (isEditMode) {
          return !!(
            rewardData.rewardConfigurationId &&
            rewardData.rewardValue &&
            rewardData.rewardValue.trim()
          );
        }
        return !!(
          rewardData.rewardConfigurationId &&
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
      if (isEditMode && rewardId) {
        if (loadedEditStatus && !canEditManualReward(loadedEditStatus)) {
          showError(
            "Applied rewards cannot be edited. View details or create a new grant.",
          );
          return;
        }
        const parsedId = Number(rewardId);
        const updatePayload = buildUpdateManualRewardPayload(rewardData);
        await manualRewardService.update(parsedId, updatePayload);

        if (
          rewardData.applyType === "now" &&
          loadedEditStatus &&
          loadedEditStatus !== "applied"
        ) {
          const applyResult = await manualRewardService.apply(parsedId);
          showToast(
            applyResult.message ||
              t.manualRewards.updatedSuccess ||
              "Reward updated and applied.",
          );
        } else {
          showToast(
            t.manualRewards.updatedSuccess || "Reward updated successfully",
          );
        }

        navigate(`/dashboard/manual-rewards/${parsedId}`);
        return;
      }

      const payload = buildCreateManualRewardPayload(rewardData);
      const result = await manualRewardService.create(payload);

      if (!result.success) {
        showError(
          result.message ||
            result.error ||
            "Reward could not be granted. Check configuration and MSISDN.",
        );
        return;
      }

      showToast(result.message || t.manualRewards.createdSuccess);

      clearPersistedFormData("reward_form_data");

      const createdId = resolveCreatedRewardId(result);

      if (createdId) {
        navigate(`/dashboard/manual-rewards/${createdId}`);
      } else {
        navigate("/dashboard/manual-rewards");
      }
    } catch (err) {
      console.error(
        `Failed to ${isEditMode ? "update" : "create"} manual reward:`,
        err,
      );
      showError(
        extractBackendError(
          err,
          isEditMode ? "Update failed" : t.manualRewards.createFailed,
        ),
      );
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
            readOnly={isEditMode}
          />
        );
      case 2:
        return (
          <DefineRewardStep
            data={rewardData}
            onUpdate={updateRewardData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isEditMode={isEditMode}
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

  if (isEditMode && editBlockedMessage) {
    return (
      <div className="space-y-4">
        <p className={`text-sm ${tw.textSecondary}`}>{editBlockedMessage}</p>
        <button
          type="button"
          onClick={() =>
            navigate(returnTo?.pathname || "/dashboard/manual-rewards")
          }
          className={`px-4 py-2 text-sm font-medium text-white ${tw.rounded}`}
          style={{ backgroundColor: color.primary.action }}
        >
          Back to Manual Rewards
        </button>
      </div>
    );
  }

  const handleCancel = () => {
    navigate(returnTo?.pathname || "/dashboard/manual-rewards");
  };

  const handleSaveDraft = async () => {
    // Manual rewards don't have draft save, just clear form
    clearPersistedFormData("reward_form_data");
    showToast("Form cleared");
  };

  const canNavigateToStepCheck = (stepId: number) => {
    if (stepId <= currentStep) return true;
    if (stepId === currentStep + 1) return isCurrentStepValid();
    return false;
  };

  return (
    <MultiStepFormWrapper
      steps={STEPS}
      currentStep={currentStep}
      onStepClick={handleStepClick}
      canNavigateToStep={canNavigateToStepCheck}
      onNext={handleNext}
      onPrev={handlePrevious}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onSaveDraft={handleSaveDraft}
      isLoading={isSaving}
      isSavingDraft={false}
      currentLabel={isEditMode ? "Edit Manual Reward" : "Create Manual Reward"}
      submitButtonText={isEditMode ? "Update Reward" : "Create Reward"}
      saveDraftText="Clear Form"
      showSaveDraft={false}
    >
      {renderStep()}
    </MultiStepFormWrapper>
  );
}
