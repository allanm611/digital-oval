import { Check, LucideIcon } from "lucide-react";

export interface Step {
  id: number;
  name: string;
  description?: string;
  icon: LucideIcon;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepId: number) => void;
  canNavigateToStep: (stepId: number) => boolean;
  primaryColor: string;
  textPrimary: string;
  textMuted: string;
}

export default function ProgressStepper({
  steps,
  currentStep,
  onStepClick,
  canNavigateToStep,
  primaryColor,
  textPrimary,
  textMuted,
}: ProgressStepperProps) {
  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "current";
    return "upcoming";
  };

  return (
    <nav
      aria-label="Progress"
      className="sticky top-16 z-40 bg-white py-4 sm:py-6 px-2 sm:px-0"
    >
      {/* Mobile - Simple dots */}
      <div className="md:hidden flex items-center justify-center gap-2 flex-wrap">
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              disabled={!canNavigateToStep(step.id)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                status === "completed" || status === "current" ? "w-8" : ""
              }`}
              style={{
                backgroundColor:
                  status === "completed" || status === "current"
                    ? primaryColor
                    : "#d1d5db",
              }}
            />
          );
        })}
      </div>

      {/* Desktop - Full stepper */}
      <div className="hidden md:flex items-center justify-between w-full relative">
        {/* Background line - full width */}
        <div
          className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200"
          style={{ zIndex: 0 }}
        />

        {/* Progress line for completed steps */}
        {/* The line should reach from the center of the first circle to the center of the current step's circle */}
        {currentStep > 1 && (
          <div
            className="absolute top-4 h-0.5 transition-all duration-500"
            style={{
              left: "0",
              // Calculate width to reach the center of the current step's circle
              // When on the last step, the line should reach 100% (the right edge where the last circle center is)
              // For intermediate steps, calculate proportionally
              width:
                currentStep === steps.length
                  ? "100%"
                  : `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
              backgroundColor: primaryColor,
              zIndex: 1,
            }}
          />
        )}

        {/* Cover divs to hide line at edges */}
        {/* Hide right cover when on last step to allow line to reach the circle */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-white z-20"
          style={{
            width: "5rem",
          }}
        />
        {currentStep < steps.length && (
          <div
            className="absolute top-4 right-0 h-0.5 bg-white z-20"
            style={{
              width: "5rem",
            }}
          />
        )}

        {steps.map((step, stepIdx) => {
          const status = getStepStatus(step.id);
          const Icon = step.icon;
          const isFirst = stepIdx === 0;
          const isLast = stepIdx === steps.length - 1;

          return (
            <div key={step.id} className="relative" style={{ zIndex: 30 }}>
              <button
                onClick={() => onStepClick(step.id)}
                className="relative flex flex-col items-center group"
                disabled={!canNavigateToStep(step.id)}
              >
                {/* Background circle to cover the line completely - matches circle background */}
                <div
                  className="absolute top-4 left-1/2 w-10 h-10 rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{
                    zIndex: 25,
                    backgroundColor:
                      status === "completed" ? primaryColor : "white",
                  }}
                />

                {/* Circle with higher z-index to ensure it covers the line */}
                <div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${
                      status === "completed"
                        ? `bg-[${primaryColor}] border-[${primaryColor}] text-white`
                        : status === "current"
                        ? `bg-white border-[${primaryColor}] text-[${primaryColor}]`
                        : "bg-white border-gray-300 text-gray-400"
                    }
                    ${
                      step.id <= currentStep + 2
                        ? "cursor-pointer hover:scale-110"
                        : "cursor-not-allowed"
                    }
                  `}
                  style={{ zIndex: 30 }}
                >
                  {status === "completed" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-medium ${
                      status === "current"
                        ? `text-[${primaryColor}]`
                        : status === "completed"
                        ? textPrimary
                        : textMuted
                    }`}
                  >
                    {step.name}
                  </div>
                  {step.description && (
                    <div
                      className={`text-xs mt-1 hidden lg:block ${textMuted}`}
                    >
                      {step.description}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}