# MultiStepFormWrapper Usage Guide

A reusable form wrapper component for multi-step forms with consistent UI across the application.

## Features

✅ Consistent UI with Campaign Create form  
✅ Top navigation (Back button, Cancel, Save Draft)  
✅ Progress stepper showing all steps  
✅ Step content area  
✅ Bottom navigation (Previous, Next/Submit)  
✅ Built-in validation error display  
✅ Loading states and spinners  
✅ Customizable button text  

## Basic Usage

```tsx
import MultiStepFormWrapper from "../../../shared/components/MultiStepFormWrapper";
import { Step } from "../../../shared/components/ui/ProgressStepper";

const steps: Step[] = [
  {
    id: 1,
    name: "Step 1",
    description: "First step",
    icon: Users,
  },
  {
    id: 2,
    name: "Step 2",
    description: "Second step",
    icon: Gift,
  },
  {
    id: 3,
    name: "Preview",
    description: "Review & submit",
    icon: Eye,
  },
];

export default function CreateMyFormPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [formData, setFormData] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const handleNext = () => {
    // Validate current step
    const validation = validateCurrentStep();
    setValidationErrors(validation.errors);
    
    if (validation.isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Submit form data
      await myFormService.create(formData);
      navigate("/my-form-list");
    } catch (error) {
      showError("Failed to submit form");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      // Save draft
      await myFormService.saveDraft(formData);
      showSuccess("Draft saved!");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleCancel = () => {
    navigate("/my-form-list");
  };

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep < currentStep) return true;
    if (targetStep > currentStep + 1) return false;
    return validateCurrentStep().isValid;
  };

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
        return (
          <PreviewStep
            formData={formData}
          />
        );
      default:
        return null;
    }
  };

  return (
    <MultiStepFormWrapper
      steps={steps}
      currentStep={currentStep}
      onStepClick={(stepId) => {
        if (canNavigateToStep(stepId)) {
          setCurrentStep(stepId);
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
      currentLabel="Create My Form"
      submitButtonText="Create Form"
      saveDraftText="Save Draft"
    >
      {renderStep()}
    </MultiStepFormWrapper>
  );
}
```

## Props Reference

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `steps` | `Step[]` | Array of step definitions |
| `currentStep` | `number` | Current active step |
| `onStepClick` | `(stepId: number) => void` | Callback when step clicked |
| `canNavigateToStep` | `(stepId: number) => boolean` | Check if step is navigable |
| `onNext` | `() => void` | Handle next button click |
| `onPrev` | `() => void` | Handle previous button click |
| `onSubmit` | `() => void` | Handle final submit |
| `onCancel` | `() => void` | Handle cancel button |
| `onSaveDraft` | `() => void` | Handle save draft |
| `children` | `ReactNode` | Step content to render |
| `isLoading` | `boolean` | Show loading state on submit button |
| `isSavingDraft` | `boolean` | Show loading state on save draft button |
| `currentLabel` | `string` | Label for breadcrumb (e.g., "Create Campaign") |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `submitButtonText` | `string` | `"Submit"` | Text for final submit button |
| `saveDraftText` | `string` | `"Save Draft"` | Text for save draft button |
| `hideTopButtons` | `boolean` | `false` | Hide Cancel/Save Draft buttons |
| `showSaveDraft` | `boolean` | `true` | Show Save Draft button |
| `showCancel` | `boolean` | `true` | Show Cancel button |
| `validationError` | `string` | `undefined` | Display validation error banner |
| `loadingMessage` | `string` | `undefined` | Custom loading message |

## Step Interface

```tsx
interface Step {
  id: number;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}
```

## Styling

The component uses:
- **Color scheme:** From `color` utility (primary action, borders)
- **Typography:** From `tw` utility (text sizes, colors)
- **Spacing:** Tailwind CSS classes
- **Rounded corners:** From `tw.rounded`

All styling is inherited from the existing design system, so it will automatically match your app's theme.

## Example: Converting Campaign Create Form

See `CreateCampaignPage.tsx` for the original non-wrapped version. To convert it:

**Before (2000+ lines):**
```tsx
export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(1);
  // 100+ lines of state management
  
  return (
    <div className="min-h-screen">
      <div className="bg-white border...">
        <BackButton />
        {currentStep !== 5 && (
          <div className="flex gap-3">
            <button>Cancel</button>
            <button>Save Draft</button>
          </div>
        )}
        <ProgressStepper ... />
        <div>{renderStep()}</div>
        <div className="sticky bottom-12">
          <button>Previous</button>
          <button>Next/Submit</button>
        </div>
      </div>
    </div>
  );
}
```

**After (much cleaner):**
```tsx
export default function CreateCampaignPage() {
  const [currentStep, setCurrentStep] = useState(1);
  // State management
  
  return (
    <MultiStepFormWrapper
      steps={steps}
      currentStep={currentStep}
      onStepClick={handleStepClick}
      canNavigateToStep={canNavigateToStep}
      onNext={handleNext}
      onPrev={handlePrev}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      onSaveDraft={handleSaveDraft}
      isLoading={isLoading}
      isSavingDraft={isSavingDraft}
      currentLabel={isEditMode ? "Edit Campaign" : "Create Campaign"}
      submitButtonText="Create Campaign"
    >
      {renderStep()}
    </MultiStepFormWrapper>
  );
}
```

## Notes

- The wrapper maintains the **exact UI** from Campaign Create page
- All forms using this wrapper will have **consistent behavior and styling**
- The wrapper is **form-agnostic** - works with any step components
- **No breaking changes** to existing forms when refactored to use this wrapper
- Can be customized via props without modifying the component
