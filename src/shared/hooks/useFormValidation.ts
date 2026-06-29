import { useRef, useEffect, useCallback, useState } from 'react';

interface UseFormValidationOptions {
  autoScrollBehavior?: 'smooth' | 'auto';
  autoFocusInput?: boolean;
}

interface UseFormValidationReturn {
  validationErrors: Record<string, string>;
  fieldRefs: Record<string, HTMLDivElement | null>;
  setValidationError: (field: string, message: string) => void;
  setValidationErrors: (errors: Record<string, string>) => void;
  clearValidationError: (field: string) => void;
  clearValidationErrors: () => void;
  hasError: (field: string) => boolean;
  registerFieldRef: (field: string) => (el: HTMLDivElement | null) => void;
}

/**
 * Hook for managing form validation with auto-scroll to first error
 *
 * Features:
 * - Tracks validation errors per field
 * - Auto-scrolls to first field with error
 * - Auto-focuses the input element
 * - Provides helpers to set/clear errors
 *
 * Usage:
 * ```tsx
 * const { validationErrors, registerFieldRef, hasError, setValidationErrors } = useFormValidation();
 *
 * return (
 *   <div ref={registerFieldRef('name')}>
 *     <Input hasError={hasError('name')} />
 *     {validationErrors.name && <p>{validationErrors.name}</p>}
 *   </div>
 * );
 * ```
 */
export function useFormValidation(options: UseFormValidationOptions = {}): UseFormValidationReturn {
  const { autoScrollBehavior = 'smooth', autoFocusInput = true } = options;
  const [validationErrors, setValidationErrorsState] = useState<Record<string, string>>({});
  const fieldRefsObj = useRef<Record<string, HTMLDivElement | null>>({});

  // Auto-scroll to first field with error
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      const errorFieldKey = Object.keys(validationErrors)[0];
      const fieldElement = fieldRefsObj.current[errorFieldKey];

      if (fieldElement) {
        fieldElement.scrollIntoView({ behavior: autoScrollBehavior, block: 'center' });
        if (autoFocusInput) {
          const input = fieldElement.querySelector('input, select, textarea') as HTMLElement;
          if (input) {
            input.focus();
          }
        }
      }
    }
  }, [validationErrors, autoScrollBehavior, autoFocusInput]);

  const setValidationError = useCallback((field: string, message: string) => {
    setValidationErrorsState((prev) => ({
      ...prev,
      [field]: message,
    }));
  }, []);

  const setValidationErrors = useCallback((errors: Record<string, string>) => {
    setValidationErrorsState(errors);
  }, []);

  const clearValidationError = useCallback((field: string) => {
    setValidationErrorsState((prev) => {
      const updated = { ...prev };
      delete updated[field];
      return updated;
    });
  }, []);

  const clearValidationErrors = useCallback(() => {
    setValidationErrorsState({});
  }, []);

  const hasError = useCallback(
    (field: string) => !!validationErrors[field],
    [validationErrors]
  );

  const registerFieldRef = useCallback((field: string) => {
    return (el: HTMLDivElement | null) => {
      fieldRefsObj.current[field] = el;
    };
  }, []);

  return {
    validationErrors,
    fieldRefs: fieldRefsObj.current,
    setValidationError,
    setValidationErrors,
    clearValidationError,
    clearValidationErrors,
    hasError,
    registerFieldRef,
  };
}
