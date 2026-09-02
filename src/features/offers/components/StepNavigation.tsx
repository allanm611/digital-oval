import { ArrowLeft, ArrowRight } from "lucide-react";
import WizardActionButton from "../../../shared/components/ui/WizardActionButton";

interface StepNavigationProps {
  onPrev: () => void;
  onNext: () => void;
  showPrev?: boolean;
  showNext?: boolean;
  prevText?: string;
  nextText?: string;
  isNextDisabled?: boolean;
  isLoading?: boolean;
}

export default function StepNavigation({
  onPrev,
  onNext,
  showPrev = true,
  showNext = true,
  prevText = "Previous",
  nextText = "Next Step",
  isNextDisabled = false,
  isLoading = false,
}: StepNavigationProps) {
  return (
    <div className="flex justify-between pt-6">
      {showPrev && (
        <WizardActionButton nav onClick={onPrev}>
          <ArrowLeft className="w-4 h-4" />
          {prevText}
        </WizardActionButton>
      )}

      {showNext && (
        <WizardActionButton
          variant="primary"
          nav
          onClick={onNext}
          disabled={isNextDisabled}
          loading={isLoading}
          loadingLabel="Loading..."
        >
          {nextText}
          <ArrowRight className="w-4 h-4" />
        </WizardActionButton>
      )}
    </div>
  );
}
