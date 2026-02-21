# Error Prevention Guide: Avoiding Full Page Crashes

## The Problem We Just Fixed
Nested functions (like `ControlGroupConfigModal` in `AudienceConfigurationStep.tsx`) were using `t` from `useLanguage()` without having access to it, causing the entire page to crash.

## Root Cause
```tsx
// ❌ WRONG - This crashes the whole page
function AudienceConfigurationStep() {
  const { t } = useLanguage(); // t is defined here
  
  function ControlGroupConfigModal() {
    // ❌ t is NOT accessible here! ReferenceError: t is not defined
    return <h3>{t.campaigns.title}</h3>
  }
}

// ✅ FIXED - Add useLanguage inside nested function
function ControlGroupConfigModal() {
  const { t } = useLanguage(); // Now t is defined locally
  return <h3>{t.campaigns.title}</h3>
}
```

## Prevention Strategies

### Strategy 1: Give Nested Functions Their Own Hooks ✅ (PREFERRED)
```tsx
function OuterComponent() {
  const { t } = useLanguage();

  function NestedModal() {
    const { t: t2 } = useLanguage(); // Add hook here too
    return <h3>{t2.campaigns.title}</h3>;
  }
}
```

### Strategy 2: Pass `t` as a Prop
```tsx
interface NestedModalProps {
  t: typeof translations; // Pass t as prop
}

function NestedModal({ t }: NestedModalProps) {
  return <h3>{t.campaigns.title}</h3>;
}

function OuterComponent() {
  const { t } = useLanguage();
  return <NestedModal t={t} />;
}
```

### Strategy 3: Use Local Error Boundary (Isolates the Crash)
Wrap risky sections to prevent propagation:

```tsx
import { ErrorBoundary } from "./SuspenseBoundaryWrapper";

function AudienceConfigurationStep() {
  return (
    <ErrorBoundary fallback={(error) => (
      <div className="bg-red-50 p-4 rounded">
        <p className="text-red-600">Control group configuration failed</p>
      </div>
    )}>
      <ControlGroupConfigModal />
    </ErrorBoundary>
  );
}
```

This way:
- ✅ Error is caught and handled gracefully
- ✅ Rest of page stays functional
- ✅ User sees error message instead of blank page

### Strategy 4: Defensive Null Checks
```tsx
function renderContent(item: any) {
  // Prevent accessing undefined properties
  if (!item?.name) {
    return <div>No data available</div>;
  }
  return <div>{item.name}</div>;
}
```

## How to Find Similar Issues

Search for this pattern:
```bash
grep -r "function \w\+Modal" src/features/
```

Then check if they have:
1. `const { t } = useLanguage();` at the top
2. Or if they access other hooks like `useContext`, `useState`, etc.

If not → they'll crash when that hook is used.

## Current Status: All Critical Issues Fixed
- ✅ `ControlGroupConfigModal` in `AudienceConfigurationStep.tsx` - FIXED (added useLanguage)
- ✅ Most other nested modals already have their own hooks
- ✅ Error boundary in place as fallback

## Best Practices Going Forward

1. **Always call hooks inside functions** - Don't rely on parent's hooks
2. **Test nested modals independently** - Catch issues early
3. **Use TypeScript** - Detects missing variable references at compile time
4. **Add error boundaries around risky sections** - Isolate crashes
5. **Lint before committing** - ESLint catches unused variables

## Testing
To test if a modal crashes the page:
```tsx
// Temporarily render just the modal at a shallow depth
<ControlGroupConfigModal 
  isOpen={true}
  segment={mockSegment}
  onClose={() => {}}
  onSave={() => {}}
/>
```

If it crashes, it's missing a hook or has an undefined reference.
