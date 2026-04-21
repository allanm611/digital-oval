import { LucideIcon } from "lucide-react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepIcon from "@mui/material/StepIcon";
import { styled } from "@mui/material/styles";
import { colors } from "../../../shared/utils/tokens";

const ACCENT_COLOR = colors.primary.accent;
const GRAY_COLOR = "#e5e7eb";
const TEXT_GRAY = "#9ca3af";

// Custom step icon
const _CustomStepIcon = styled(StepIcon)((_theme) => ({
  "& .MuiStepIcon-root": {
    width: 32,
    height: 32,
    color: GRAY_COLOR,
    border: `2px solid ${GRAY_COLOR}`,
    borderRadius: "50%",
    backgroundColor: "white",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  "& .MuiStepIcon-root.Mui-active": {
    color: ACCENT_COLOR,
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
  },
  "& .MuiStepIcon-root.Mui-completed": {
    color: ACCENT_COLOR,
    backgroundColor: ACCENT_COLOR,
    borderColor: ACCENT_COLOR,
  },
  "& .MuiStepIcon-text": {
    display: "none",
  },
}));

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
  _primaryColor,
  _textPrimary,
  _textMuted,
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
          const isDisabled = !canNavigateToStep(step.id);
          return (
            <button
              key={step.id}
              onClick={() => onStepClick(step.id)}
              disabled={isDisabled}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                status === "completed" || status === "current" ? "w-8" : ""
              }`}
              style={{
                backgroundColor:
                  status === "completed" || status === "current"
                    ? ACCENT_COLOR
                    : GRAY_COLOR,
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.6 : 1,
              }}
            />
          );
        })}
      </div>

      {/* Desktop - MUI Stepper with alternativeLabel */}
      <div className="hidden md:block">
        <Box sx={{ width: "100%" }}>
          <Stepper
            activeStep={currentStep - 1}
            alternativeLabel
            sx={{
              "& .MuiStepLabel-root": {
                cursor: "pointer",
                userSelect: "none",
                ".MuiStepLabel-label": {
                  fontSize: "14px",
                  fontWeight: "normal",
                  color: "#000000",
                  marginTop: "12px",
                  cursor: "pointer",
                  "&.Mui-active": {
                    color: "#000000",
                    fontWeight: "normal",
                  },
                  "&.Mui-completed": {
                    color: "#000000",
                    fontWeight: "normal",
                  },
                },
                "& .MuiSvgIcon-root": {
                  cursor: "pointer",
                },
              },
              "& .MuiStep-root": {
                cursor: "pointer",
              },
              "& .MuiStepConnector-root": {
                "& .MuiStepConnector-line": {
                  borderColor: GRAY_COLOR,
                  borderTopWidth: 2,
                },
                "&.Mui-active .MuiStepConnector-line": {
                  borderColor: ACCENT_COLOR,
                },
                "&.Mui-completed .MuiStepConnector-line": {
                  borderColor: ACCENT_COLOR,
                },
              },
            }}
          >
            {steps.map((step) => {
              const isDisabled = !canNavigateToStep(step.id);
              const status = getStepStatus(step.id);
              const Icon = step.icon;

              return (
                <Step
                  key={step.id}
                  completed={status === "completed"}
                  onClick={() => !isDisabled && onStepClick(step.id)}
                  sx={{
                    opacity: isDisabled ? 0.6 : 1,
                    cursor: isDisabled ? "not-allowed" : "pointer",
                  }}
                >
                  <StepLabel
                    icon={
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          border: `2px solid ${
                            status === "completed" || status === "current"
                              ? ACCENT_COLOR
                              : GRAY_COLOR
                          }`,
                          backgroundColor:
                            status === "completed" || status === "current"
                              ? ACCENT_COLOR
                              : "white",
                          color:
                            status === "completed" || status === "current"
                              ? "white"
                              : TEXT_GRAY,
                          fontSize: 16,
                        }}
                      >
                        <Icon size={16} />
                      </div>
                    }
                  >
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          color: "#000000",
                          fontSize: "14px",
                          fontWeight: "normal",
                        }}
                      >
                        {step.name}
                      </div>
                      {step.description && (
                        <div className="text-xs text-gray-500 mt-1 hidden lg:block">
                          {step.description}
                        </div>
                      )}
                    </div>
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      </div>
    </nav>
  );
}
