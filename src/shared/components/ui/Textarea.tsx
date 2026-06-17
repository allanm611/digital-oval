import React, { forwardRef, useState } from 'react';
import { tw } from '../../utils/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  variant?: 'default' | 'medium' | 'compact'; // default: px-4 py-2, medium: px-3 py-2, compact: px-3 py-1
  label?: string; // Floating label (optional)
  rows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  placeholder,
  value,
  onChange,
  disabled = false,
  hasError = false,
  className = '',
  variant = 'medium',
  label,
  rows = 3,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  let paddingClass = 'px-3 py-2'; // default (medium)
  if (variant === 'default') paddingClass = 'px-4 py-2';
  if (variant === 'compact') paddingClass = 'px-3 py-1';

  // Determine border color based on error state
  const borderClass = hasError ? 'border-red-500' : 'border-gray-300';

  // Determine background based on disabled/readOnly state
  const isReadOnly = rest.readOnly;
  let bgClass = 'bg-white';
  if (disabled) bgClass = 'bg-gray-100 cursor-not-allowed text-gray-500';
  else if (isReadOnly) bgClass = 'bg-gray-50 cursor-default text-gray-600';

  const hasValue = value !== '';
  const shouldFloatLabel = isFocused || hasValue;

  // Without floating label (backward compatible)
  if (!label) {
    return (
      <textarea
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className={`w-full ${paddingClass} text-sm placeholder:text-sm border ${borderClass} ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none
          ${bgClass}
          ${className}`}
        {...rest}
      />
    );
  }

  // With floating label
  return (
    <div className="relative w-full">
      <textarea
        ref={ref}
        placeholder=""
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className={`w-full px-3 py-3 text-sm border ${borderClass} ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none
          ${bgClass}
          ${className}`}
        {...rest}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Floating Label */}
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none font-medium
          ${shouldFloatLabel
            ? 'top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-700'
            : 'top-3 text-sm text-gray-700'
          }
        `}
      >
        {label}
      </label>
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
