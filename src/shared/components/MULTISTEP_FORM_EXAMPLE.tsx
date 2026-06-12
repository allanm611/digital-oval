/**
 * EXAMPLE: How to refactor a multi-step form to use MultiStepFormWrapper
 *
 * This is a simplified example showing the pattern.
 * Adapt this to your actual form needs.
 */

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Gift, Eye } from "lucide-react";
import MultiStepFormWrapper from "./MultiStepFormWrapper";
import { Step } from "./ui/ProgressStepper";
import { useToast } from "../contexts/ToastContext";

// Example step components
const Step1Component = ({ formData, setFormData, errors }: any) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">Select Audience</h2>
    {/* Your step 1 form content */}
  </div>
);

const Step2Component = ({ formData, setFormData, errors }: any) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">Define Reward</h2>
    {/* Your step 2 form content */}
  </div>
);

const PreviewStep = ({ formData }: any) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold">Review & Submit</h2>
    {/* Your preview content */}
  </div>
);

interface MyFormData {
  audience?: string;
  reward?: string;
  // Add your form fields
}

export default function CreateMyFormPageExample() {
  const navigate = useNavigate();
  const { showToast, error: showError } = useToast();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formData, setFormData] = useState<MyFormData>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Step definitions
  const steps: Step[] = [
    {
      id: 1,
      name: "Audience",
      description: "Select audience",
      icon: Users,
    },
    {
      id: 2,
      name: "Reward",
      description: "Define reward",
      icon: Gift,
    },
    {
      id: 3,
      name: "Preview",
      description: "Review & submit",
      icon: Eye,
    },
  ];

  // Validation for current step
  const validateCurrentStep = useCallback(() => {
    const errors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!formData.audience) {
          errors.audience = "Audience is required";
        }
        break;
      case 2:
        if (!formData.reward) {
          errors.reward = "Reward is required";
        }
        break;
      case 3:
        // Preview doesn't need validation
        break;
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }, [currentStep, formData]);

  // Navigation handlers
  const handleNext = () => {
    const validation = validateCurrentStep();
    setValidationErrors(validation.errors);

    if (validation.isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Form submission
  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Validate all steps before final submission
      const validation = validateCurrentStep();
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      // Call your API to submit
      // const response = await myFormService.create(formData);

      showToast("Form submitted successfully!");
      navigate("/my-forms");
    } catch (error) {
      showError("Failed to submit form");
    } finally {
      setIsLoading(false);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // Call your API to save draft
      // const response = await myFormService.saveDraft(formData);

      showToast("Draft saved successfully!");
    } catch (error) {
      showError("Failed to save draft");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    navigate("/my-forms");
  };

  // Check if user can navigate to a specific step
  const canNavigateToStep = (targetStep: number) => {
    if (targetStep < currentStep) return true; // Can always go back
    if (targetStep > currentStep + 1) return false; // Can't skip ahead
    if (targetStep === currentStep + 1) {
      // Can go forward only if current step is valid
      return validateCurrentStep().isValid;
    }
    return true;
  };

  // Render the appropriate step component
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Component
            formData={formData}
            setFormData={setFormData}
            errors={validationErrors}
          />
        );
      case 2:
        return (
          <Step2Component
            formData={formData}
            setFormData={setFormData}
            errors={validationErrors}
          />
        );
      case 3:
        return <PreviewStep formData={formData} />;
      default:
        return null;
    }
  };

  // The wrapper handles all the UI structure and navigation
  return (
    <MultiStepFormWrapper
      steps={steps}
      currentStep={currentStep}
      onStepClick={(stepId) => {
        if (canNavigateToStep(stepId)) {
          setCurrentStep(stepId);
          setValidationErrors({});
        }
      }}
      canNavigateToStep={canNavigateToStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onSaveDraft={handleSaveDraft}
      isLoading={isLoading}
      isSavingDraft={isSavingDraft}
      validationError={
        Object.values(validationErrors).length > 0
          ? Object.values(validationErrors)[0]
          : undefined
      }
      currentLabel="Create My Form"
      submitButtonText="Create Form"
      saveDraftText="Save Draft"
      showCancel={true}
      showSaveDraft={true}
    >
      {renderStep()}
    </MultiStepFormWrapper>
  );
}
