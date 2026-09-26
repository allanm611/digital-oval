import { ArrowLeft, ArrowRight } from "lucide-react";
import { tw } from "../../utils/utils";
import WizardActionButton from "./WizardActionButton";

interface StepNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  nextButtonText?: string;
  showNextButton?: boolean;
  showPrevButton?: boolean;
  className?: string;
}

export default function StepNavigation({
  onPrev,
  onNext,
  isNextDisabled = false,
  nextButtonText = "Next Step",
  showNextButton = true,
  showPrevButton = true,
  className = "",
}: StepNavigationProps) {
  return (
    <div
      className={`flex justify-between pt-6 border-t gap-6 ${tw.borderDefault} ${className}`}
    >
      {showPrevButton && (
        <WizardActionButton nav onClick={onPrev}>
          <ArrowLeft className="w-4 h-4" />
          Previous
        </WizardActionButton>
      )}

      {showNextButton && (
        <WizardActionButton
          variant="primary"
          nav
          onClick={onNext}
          disabled={isNextDisabled}
        >
          {nextButtonText}
          <ArrowRight className="w-4 h-4" />
        </WizardActionButton>
      )}
    </div>
  );
}
