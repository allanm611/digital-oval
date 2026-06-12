# MultiStepFormWrapper Integration Checklist

## Summary

Created a reusable `MultiStepFormWrapper` component to eliminate code duplication across all multi-step forms in the application. The wrapper maintains the exact UI from the Campaign Create form and provides consistent behavior across all forms.

## Completed Integrations

### ✅ 1. CreateManualRewardPage
- **Status:** INTEGRATED
- **Path:** `/src/features/manual-rewards/pages/CreateManualRewardPage.tsx`
- **Changes:**
  - Removed manual ProgressStepper rendering
  - Removed BackButton from page
  - Removed bottom navigation buttons
  - Wrapped entire form in `MultiStepFormWrapper`
  - Created helper functions: `handleCancel`, `handleSaveDraft`, `canNavigateToStepCheck`
- **Result:** ~34 lines removed, cleaner code

### ✅ 2. CreateControlGroupPage
- **Status:** INTEGRATED
- **Path:** `/src/features/control-groups/pages/CreateControlGroupPage.tsx`
- **Changes:**
  - Removed manual UI structure (BackButton, ProgressStepper, bottom nav)
  - Wrapped step content in `renderStep()` function
  - Created helper functions: `handleCancel`, `handleSaveDraft`, `canNavigateToStepCheck`
  - Passed all form logic to `MultiStepFormWrapper`
- **Result:** ~50 lines removed, much cleaner structure

## Pending Integrations

### ⏳ 3. CreateCampaignPage
- **Path:** `/src/features/campaigns/pages/CreateCampaignPage.tsx`
- **Size:** 1,659 lines
- **Status:** READY FOR INTEGRATION
- **Notes:** This is the reference form the wrapper was built from - refactoring will significantly clean it up
- **Estimated savings:** 70-100 lines of boilerplate code

### ⏳ 4. CreateOfferPage
- **Path:** `/src/features/offers/pages/CreateOfferPage.tsx`
- **Size:** 3,043 lines (largest)
- **Status:** READY FOR INTEGRATION
- **Notes:** Most complex form; same refactoring pattern applies
- **Estimated savings:** 100-150 lines of boilerplate code

### ⏳ 5. CreateCommunicationPage (Optional)
- **Path:** `/src/features/communications/pages/CreateCommunicationPage.tsx`
- **Status:** Different UI pattern (simpler flow)
- **Notes:** Could be refactored but doesn't use ProgressStepper currently

## How to Integrate Remaining Forms

Follow this pattern for **CreateCampaignPage** and **CreateOfferPage**:

### Step 1: Update Imports
```tsx
// REMOVE:
import BackButton from "../../../shared/components/ui/BackButton";
import ProgressStepper, { Step } from "../../../shared/components/ui/ProgressStepper";

// ADD:
import { Step } from "../../../shared/components/ui/ProgressStepper";
import MultiStepFormWrapper from "../../../shared/components/MultiStepFormWrapper";
```

### Step 2: Create Helper Functions (before return statement)
```tsx
const handleCancel = () => {
  navigate("/dashboard/campaigns"); // or appropriate path
};

const handleSaveDraft = async () => {
  setIsSavingDraft(true);
  try {
    // Your draft save logic
  } finally {
    setIsSavingDraft(false);
  }
};

const canNavigateToStepCheck = (stepId: number) => {
  if (stepId < currentStep) return true;
  if (stepId === currentStep + 1) return validateCurrentStep().isValid;
  return false;
};
```

### Step 3: Create renderStep Function
```tsx
const renderStep = () => {
  switch (currentStep) {
    case 1:
      return <YourStep1Component {...props} />;
    case 2:
      return <YourStep2Component {...props} />;
    // ... etc
    default:
      return null;
  }
};
```

### Step 4: Replace Return Statement
Replace the entire `return (...)` block with:

```tsx
return (
  <MultiStepFormWrapper
    steps={steps}
    currentStep={currentStep}
    onStepClick={handleStepClick}
    canNavigateToStep={canNavigateToStepCheck}
    onNext={handleNext}
    onPrev={handlePrev}
    onSubmit={handleSubmit}
    onCancel={handleCancel}
    onSaveDraft={handleSaveDraft}
    isLoading={isLoading}
    isSavingDraft={isSavingDraft}
    currentLabel={isEditMode ? "Edit Campaign" : "Create Campaign"}
    submitButtonText={isEditMode ? "Update Campaign" : "Create Campaign"}
    saveDraftText="Save Draft"
    showSaveDraft={true}
    showCancel={true}
  >
    {renderStep()}
  </MultiStepFormWrapper>
);
```

## Component Files

- **Wrapper:** `/src/shared/components/MultiStepFormWrapper.tsx` (93 lines)
- **Usage Guide:** `/src/shared/components/MULTISTEP_FORM_USAGE.md`
- **Example:** `/src/shared/components/MULTISTEP_FORM_EXAMPLE.tsx`

## Benefits

✅ **Code Reuse** - Eliminates 200+ lines of duplicated boilerplate across 5 forms  
✅ **Consistency** - All multi-step forms have identical UI and behavior  
✅ **Maintainability** - UI changes affect all forms instantly  
✅ **Faster Development** - New multi-step forms need 1/3 the code  
✅ **Testability** - Wrapper logic can be tested once and applied everywhere  

## Testing Checklist

After integrating each form:

- [ ] Page renders without errors
- [ ] ProgressStepper displays correctly
- [ ] Can navigate between steps
- [ ] Validation works (can't proceed with invalid step)
- [ ] Can go back to previous steps
- [ ] Cancel button navigates back
- [ ] Save Draft button works (if applicable)
- [ ] Submit button submits form
- [ ] Loading state shows spinner
- [ ] BackButton with breadcrumb displays correctly

## Next Steps

1. **Quick Win:** Integrate CreateCampaignPage (1,659 lines) - cleanup will be visible
2. **Big Win:** Integrate CreateOfferPage (3,043 lines) - saves most code
3. **Optional:** Consider refactoring CreateCommunicationPage to use same pattern

Recommended order: Campaign → Offer → Communications

All three can be done in parallel with same pattern.
