import { ArrowLeft, ArrowRight } from "lucide-react";
import { tw } from "../../utils/utils";

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
        <button
          onClick={onPrev}
          className={`inline-flex items-center px-4 py-2 border ${tw.borderDefault} ${tw.textSecondary} ${tw.rounded} text-sm font-medium hover:bg-[var(--c-interactive-hover)] transition-all duration-200`}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
      )}

      {showNextButton && (
        <button
          onClick={onNext}
          disabled={isNextDisabled}
          className={`inline-flex items-center px-4 py-2 ${tw.rounded} text-sm font-medium transition-all duration-200 ${
            isNextDisabled
              ? "bg-[var(--c-interactive-disabled)] text-[var(--c-text-muted)] cursor-not-allowed"
              : `${tw.button.primary} hover:shadow-md`
          }`}
        >
          {nextButtonText}
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      )}
    </div>
  );
}
