import { ReactNode } from "react";
import { Save, X, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { tw } from "../../utils/utils";
import WizardActionButton from "./WizardActionButton";

interface StepFlowLayoutProps {
  currentStep: number;
  stepTitle: string;
  stepDescription: string;
  onNext: () => void;
  onPrev: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
  isNextDisabled?: boolean;
  nextButtonText?: string;
  customNavigation?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function StepFlowLayout({
  currentStep,
  stepTitle,
  stepDescription,
  onNext,
  onPrev,
  onSaveDraft,
  onCancel,
  isNextDisabled = false,
  nextButtonText = "Next Step",
  customNavigation,
  children,
  className = "",
}: StepFlowLayoutProps) {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft();
    } else {
      showToast("success", "Draft saved successfully!");
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`max-w-7xl space-y-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <WizardActionButton onClick={handleCancel}>
            <X className="w-4 h-4" />
            Cancel
          </WizardActionButton>
          <WizardActionButton onClick={handleSaveDraft}>
            <Save className="w-4 h-4" />
            Save Draft
          </WizardActionButton>
        </div>

        <div className="flex items-center gap-3">
          {currentStep > 1 && (
            <WizardActionButton nav onClick={onPrev}>
              <ArrowLeft className="w-4 h-4" />
              Previous
            </WizardActionButton>
          )}
          <WizardActionButton
            variant="primary"
            nav
            onClick={onNext}
            disabled={isNextDisabled}
          >
            {nextButtonText}
            <ArrowRight className="w-4 h-4" />
          </WizardActionButton>
        </div>
      </div>

      {customNavigation && <div className="mb-6">{customNavigation}</div>}

      <div className="mt-8 mb-8">
        <h2 className={`text-xl font-semibold ${tw.textPrimary} mb-2`}>
          {stepTitle}
        </h2>
        <p className={`text-sm ${tw.textSecondary}`}>{stepDescription}</p>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  );
}
