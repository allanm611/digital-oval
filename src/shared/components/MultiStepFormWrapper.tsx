import { ReactNode, useEffect, useRef } from "react";
import BackButton from "./ui/BackButton";
import ProgressStepper, { Step } from "./ui/ProgressStepper";
import WizardActionButton from "./ui/WizardActionButton";
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
  nextButtonText?: string; // Text for next-step button (default: "Next Step")
  saveDraftText?: string; // Text for save draft button (default: "Save Draft")
  hideTopButtons?: boolean; // Hide Cancel/Save Draft buttons
  showSaveDraft?: boolean; // Show Save Draft button (default: true)
  showCancel?: boolean; // Show Cancel button (default: true)

  // Custom loading state messages for different steps
  loadingMessage?: string;
}

function scrollWizardIntoView(toolbar: HTMLElement | null) {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });

  let parent = toolbar?.parentElement ?? null;
  while (parent && parent !== document.body) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    if (overflowY === "auto" || overflowY === "scroll") {
      parent.scrollTo({ top: 0, left: 0, behavior: "auto" });
      break;
    }
    parent = parent.parentElement;
  }
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
  nextButtonText = "Next Step",
  saveDraftText = "Save Draft",
  hideTopButtons = false,
  showSaveDraft = true,
  showCancel = true,
  loadingMessage,
}: MultiStepFormWrapperProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isFirstStep = currentStep <= 1;
  const isLastStep = currentStep === steps.length;
  const showCancelButton = !hideTopButtons && showCancel;
  const showSaveDraftButton = !hideTopButtons && showSaveDraft;

  useEffect(() => {
    scrollWizardIntoView(toolbarRef.current);
  }, [currentStep]);

  const handlePrev = () => {
    if (isFirstStep || isLoading) return;
    onPrev();
  };

  const handlePrimaryAction = () => {
    if (isLoading) return;
    if (isLastStep) {
      onSubmit();
      return;
    }
    onNext();
  };

  return (
    <div className="min-h-screen">
      <div
        className={`bg-white ${tw.rounded} border overflow-visible`}
        style={{ borderColor: color.border.default }}
      >
        {/* Sticky chrome: stays below the app header on pages, flush in modals */}
        <div
          ref={toolbarRef}
          className="sticky border-b px-4 sm:px-6 lg:px-8 pt-4"
          style={{
            top: "var(--sticky-toolbar-offset, 4rem)",
            backgroundColor: "var(--c-surface-cards, #ffffff)",
            borderColor: color.border.default,
            zIndex: 40,
            boxShadow: "0 1px 0 rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
            <BackButton showBreadcrumb={true} currentLabel={currentLabel} />

            <div
              className="flex flex-wrap items-center gap-2 sm:gap-3 md:justify-end"
              role="toolbar"
              aria-label="Wizard actions"
            >
              {showCancelButton && (
                <WizardActionButton onClick={onCancel}>
                  Cancel
                </WizardActionButton>
              )}

              {!isFirstStep && (
                <WizardActionButton
                  nav
                  onClick={handlePrev}
                  disabled={isLoading}
                >
                  Previous
                </WizardActionButton>
              )}

              <WizardActionButton
                variant="primary"
                nav
                onClick={handlePrimaryAction}
                disabled={isLoading}
                loading={isLoading}
                loadingLabel={
                  loadingMessage ||
                  (isLastStep ? "Submitting..." : "Loading...")
                }
              >
                {isLastStep ? submitButtonText : nextButtonText}
              </WizardActionButton>

              {showSaveDraftButton && (
                <WizardActionButton
                  onClick={onSaveDraft}
                  disabled={isSavingDraft || isLoading}
                  loading={isSavingDraft}
                  loadingLabel="Saving..."
                >
                  {saveDraftText}
                </WizardActionButton>
              )}
            </div>
          </div>

          <ProgressStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={onStepClick}
            canNavigateToStep={canNavigateToStep}
            primaryColor={color.primary.action}
            textPrimary={tw.textPrimary}
            textMuted={tw.textMuted}
          />

          {validationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-4">{children}</div>
      </div>
    </div>
  );
}
