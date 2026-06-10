import React, { forwardRef, useState } from 'react';
import { tw } from '../../utils/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  hasError?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  variant?: 'default' | 'medium' | 'compact'; // default: px-4 py-2, medium: px-3 py-2, compact: px-3 py-1
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'date' | 'time'; // default: text
  label?: string; // Floating label (optional)
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  placeholder,
  value,
  onChange,
  disabled = false,
  hasError = false,
  className = '',
  onKeyDown,
  variant = 'medium',
  type = 'text',
  label,
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

  const hasValue = value !== '' && value !== 0;
  const shouldFloatLabel = isFocused || hasValue;

  // Without floating label (backward compatible)
  if (!label) {
    return (
      <input
        ref={ref}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          onChange(newValue);
        }}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className={`w-full ${paddingClass} text-sm placeholder:text-sm border ${borderClass} ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${bgClass}
          ${className}`}
        {...rest}
      />
    );
  }

  // With floating label
  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={type}
        placeholder={shouldFloatLabel ? placeholder : ""}
        value={value}
        onChange={(e) => {
          const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          onChange(newValue);
        }}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className={`w-full px-3 py-3 text-sm border ${borderClass} ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${bgClass}
          ${className}`}
        {...rest}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Floating Label */}
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none text-sm font-medium
          ${shouldFloatLabel
            ? 'top-0 -translate-y-1/2 bg-white px-1 text-gray-700'
            : 'top-1/2 -translate-y-1/2 text-gray-700'
          }
        `}
      >
        {label}
      </label>
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
