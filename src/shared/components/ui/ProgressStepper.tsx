import { LucideIcon } from "lucide-react";

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
                    ? "#00BBCC"
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
        {currentStep > 1 && (
          <div
            className="absolute top-4 h-0.5 transition-all duration-500"
            style={{
              left: "5%",
              // Calculate width to reach the center of the current step's circle
              width:
                currentStep === steps.length
                  ? "90%"
                  : `${((currentStep - 1) / (steps.length - 1)) * 90}%`,
              backgroundColor: "#00BBCC",
              zIndex: 1,
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
                      status === "completed" || status === "current" ? "#00BBCC" : "white",
                  }}
                />

                {/* Circle with higher z-index to ensure it covers the line */}
                <div
                  className={`
                    relative flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-200
                    ${
                      step.id <= currentStep + 2
                        ? "cursor-pointer hover:scale-110"
                        : "cursor-not-allowed"
                    }
                  `}
                  style={{
                    zIndex: 30,
                    backgroundColor: status === "completed" || status === "current" ? "#00BBCC" : "white",
                    borderColor: status === "completed" || status === "current" ? "#00BBCC" : "#d1d5db",
                    color: status === "completed" || status === "current" ? "white" : "#9ca3af",
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="mt-2 text-center">
                  <div
                    className="text-sm font-medium"
                    style={{
                      color:
                        status === "completed" || status === "current"
                          ? "#00BBCC"
                          : "#9ca3af",
                    }}
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