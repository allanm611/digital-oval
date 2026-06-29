import React, { ReactNode } from 'react';

interface FormFieldProps {
  error?: string;
  errorSize?: 'xs' | 'sm';
  children: ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Wrapper component for form fields with error styling and display
 *
 * Provides:
 * - Red border styling on child inputs when error exists
 * - Error message display below field
 * - Consistent spacing
 *
 * Usage:
 * ```tsx
 * <FormField error={errors.name}>
 *   <Input value={name} onChange={setName} hasError={!!errors.name} />
 * </FormField>
 * ```
 */
const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ error, errorSize = 'xs', children, className = '' }, ref) => {
    return (
      <div ref={ref} className={className}>
        {children}
        {error && (
          <p className={`mt-1 text-${errorSize} text-red-600`}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
