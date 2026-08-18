/**
 * FORM VALIDATION PATTERN - Example & Documentation
 *
 * Components & Hooks:
 * - useFormValidation: Hook for managing validation state and auto-scroll
 * - FormField: Wrapper component for error styling and display
 *
 * Features:
 * ✓ Auto-scroll to first field with error
 * ✓ Auto-focus input on error
 * ✓ Red border on inputs with errors
 * ✓ Error message display below field
 * ✓ Easy error clearing (on change or manual)
 */

import { useState, useCallback } from 'react';
import Input from './ui/Input';
import FormField from './FormField';
import { useFormValidation } from '../hooks/useFormValidation';

export default function FormValidationExample() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Initialize validation hook
  const {
    validationErrors,
    registerFieldRef,
    hasError,
    setValidationErrors,
    clearValidationError,
  } = useFormValidation();

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    }
    if (!formData.phone.trim()) {
      errors.phone = 'Phone is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = useCallback(() => {
    if (validateForm()) {
      console.log('Form is valid:', formData);
      // Submit form...
    }
  }, [formData]);

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Form with Validation</h1>

      {/* Name Field */}
      <FormField error={validationErrors.name} ref={registerFieldRef('name')}>
        <Input
          label="Full Name"
          value={formData.name}
          onChange={(value) => {
            setFormData({ ...formData, name: value });
            // Clear error when user starts typing
            if (hasError('name')) {
              clearValidationError('name');
            }
          }}
          hasError={hasError('name')}
          required
        />
      </FormField>

      {/* Email Field */}
      <FormField error={validationErrors.email} ref={registerFieldRef('email')}>
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => {
            setFormData({ ...formData, email: value });
            if (hasError('email')) {
              clearValidationError('email');
            }
          }}
          hasError={hasError('email')}
          required
        />
      </FormField>

      {/* Phone Field */}
      <FormField error={validationErrors.phone} ref={registerFieldRef('phone')}>
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(value) => {
            setFormData({ ...formData, phone: value });
            if (hasError('phone')) {
              clearValidationError('phone');
            }
          }}
          hasError={hasError('phone')}
          required
        />
      </FormField>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700"
      >
        Submit
      </button>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-gray-100 rounded text-sm text-gray-700">
        <h3 className="font-semibold mb-2">How to use:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Call <code className="bg-gray-200 px-1 rounded">validateForm()</code> to set errors</li>
          <li>Errors auto-scroll to first field and focus input</li>
          <li>Red border appears on inputs with errors</li>
          <li>Error message displays below field</li>
          <li>Clear error manually with <code className="bg-gray-200 px-1 rounded">clearValidationError()</code></li>
          <li>Or clear on user input by checking <code className="bg-gray-200 px-1 rounded">hasError()</code></li>
        </ul>
      </div>
    </div>
  );
}

/**
 * PATTERN FOR MULTI-STEP FORMS (like Offer Creation)
 *
 * Example:
 *
 * function CreatePage() {
 *   const [currentStep, setCurrentStep] = useState(1);
 *   const [formData, setFormData] = useState({...});
 *
 *   const {
 *     validationErrors,
 *     registerFieldRef,
 *     hasError,
 *     setValidationErrors,
 *     clearValidationErrors,
 *   } = useFormValidation();
 *
 *   const handleNext = useCallback(() => {
 *     if (validateCurrentStep()) {
 *       setCurrentStep(currentStep + 1);
 *       clearValidationErrors(); // Clear errors when moving to next step
 *     } else {
 *       // Set validation errors - auto-scroll happens automatically
 *       setValidationErrors({
 *         field1: 'Error message',
 *         field2: 'Another error',
 *       });
 *     }
 *   }, [currentStep, formData, validateCurrentStep]);
 *
 *   return (
 *     <>
 *       {currentStep === 1 && (
 *         <FormField error={validationErrors.name} ref={registerFieldRef('name')}>
 *           <Input value={formData.name} hasError={hasError('name')} ... />
 *         </FormField>
 *       )}
 *       <button onClick={handleNext}>Next</button>
 *     </>
 *   );
 * }
 */
