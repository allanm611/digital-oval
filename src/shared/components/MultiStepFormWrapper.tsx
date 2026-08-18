import { ReactNode } from "react";
import BackButton from "./ui/BackButton";
import ProgressStepper, { Step } from "./ui/ProgressStepper";
import { color, tw } from "../utils/utils";

interface MultiStepFormWrapperProps {
  // Navigation & Structure
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  canNavigateToStep: (stepId: number) => boolean;

  // Handlers
  onNext: () => void;
  onPrev: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  onSaveDraft: () => void;

  // Content
  children: ReactNode; // The step content

  // States
  isLoading: boolean;
  isSavingDraft: boolean;
  validationError?: string;

  // Labels & Customization
  currentLabel: string; // e.g., "Create Campaign"
  submitButtonText?: string; // Text for final submit button (default: "Submit")
  saveDraftText?: string; // Text for save draft button (default: "Save Draft")
  hideTopButtons?: boolean; // Hide Cancel/Save Draft buttons
  showSaveDraft?: boolean; // Show Save Draft button (default: true)
  showCancel?: boolean; // Show Cancel button (default: true)

  // Custom loading state messages for different steps
  loadingMessage?: string;
}

export default function MultiStepFormWrapper({
  steps,
  currentStep,
  onStepClick,
  canNavigateToStep,
  onNext,
  onPrev,
  onSubmit,
  onCancel,
  onSaveDraft,
  children,
  isLoading,
  isSavingDraft,
  validationError,
  currentLabel,
  submitButtonText = "Submit",
  saveDraftText = "Save Draft",
  hideTopButtons = false,
  showSaveDraft = true,
  showCancel = true,
  loadingMessage,
}: MultiStepFormWrapperProps) {
  const isLastStep = currentStep === steps.length;
  const showTopButtons = !hideTopButtons && currentStep !== steps.length;

  return (
    <div className="min-h-screen">
      <div
        className={`bg-white ${tw.rounded} border p-4`}
        style={{ borderColor: color.border.default }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Top Navigation */}
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
            <BackButton showBreadcrumb={true} currentLabel={currentLabel} />

            {showTopButtons && (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
                {showCancel && (
                  <button
                    onClick={onCancel}
                    className={`inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium ${tw.rounded} transition-all duration-200 sm:w-auto dark:text-white dark:border-white`}
                    style={{
                      background: "transparent",
                      color: "var(--c-bordered-button-color)",
                      border: `1px solid var(--c-bordered-button-color)`,
                    }}
                  >
                    Cancel
                  </button>
                )}

                {showSaveDraft && (
                  <button
                    onClick={onSaveDraft}
                    disabled={isSavingDraft}
                    className={`inline-flex w-full items-center justify-center px-4 py-2 text-sm font-medium ${tw.rounded} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto`}
                    style={{
                      backgroundColor: color.primary.action,
                      color: "white",
                    }}
                  >
                    {isSavingDraft ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      saveDraftText
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Progress Stepper */}
          <ProgressStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={onStepClick}
            canNavigateToStep={canNavigateToStep}
            primaryColor={color.primary.action}
            textPrimary={tw.textPrimary}
            textMuted={tw.textMuted}
          />

          {/* Step Content */}
          <div className="py-4">{children}</div>

          {/* Validation Error Display */}
          {validationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="sticky bottom-12 bg-white py-4 shadow-sm">
            <div className="flex justify-between items-center">
              <button
                onClick={onPrev}
                disabled={currentStep === 1}
                className={`inline-flex items-center px-4 py-2 border text-sm font-medium ${tw.rounded} transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white dark:border-white hover:dark:bg-gray-700`}
                style={{
                  borderColor: "var(--c-bordered-button-color)",
                  color: "var(--c-bordered-button-color)",
                }}
              >
                Previous
              </button>

              <button
                onClick={isLastStep ? onSubmit : onNext}
                disabled={isLoading}
                className={`inline-flex items-center px-5 py-2 text-sm font-medium ${tw.rounded} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                style={{ backgroundColor: color.primary.action }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {loadingMessage || (isLastStep ? "Submitting..." : "Loading...")}
                  </>
                ) : isLastStep ? (
                  submitButtonText
                ) : (
                  "Next Step"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
