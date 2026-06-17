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
  variant?: 'default' | 'medium' | 'compact'; 
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local'; // default: text
  label?: string; // Floating label 
  style?: React.CSSProperties;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  placeholder,
  value,
  onChange,
  disabled = false,
  hasError = false,
  className = '',
  onKeyDown,
  variant = 'default',
  type = 'text',
  label,
  style = {},
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  let paddingClass = 'px-4 py-2'; // default
  if (variant === 'medium') paddingClass = 'px-3 py-2';
  if (variant === 'compact') paddingClass = 'px-3 py-1';

  // Determine border color based on error state
  const borderClass = hasError ? 'border-red-500' : 'border-gray-200';

  // Determine background based on disabled/readOnly state
  const isReadOnly = rest.readOnly;
  let inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--c-input-bg)',
    color: 'var(--c-text-primary)',
    ...style
  };

  if (disabled) {
    inputStyle = {
      backgroundColor: 'var(--c-input-disabled-bg)',
      color: 'var(--c-text-muted)',
      cursor: 'not-allowed',
      ...style
    };
  } else if (isReadOnly) {
    inputStyle = {
      backgroundColor: 'var(--c-input-bg)',
      color: 'var(--c-text-primary)',
      cursor: 'default',
      ...style
    };
  }

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
          ${className}`}
        style={inputStyle}
        {...rest}
      />
    );
  }

  // With floating label
  // For date/time and number inputs, make text transparent when empty to show floating label clearly
  const isDateTimeInput = ['date', 'time', 'datetime-local'].includes(type);
  const isNumberInput = type === 'number';
  const makeTransparent = (isDateTimeInput || isNumberInput) && !shouldFloatLabel;

  const transparentStyle: React.CSSProperties = makeTransparent ? {
    color: 'transparent',
  } : {};

  return (
    <div className="relative w-full">
      <input
        ref={ref}
        type={type}
        placeholder={shouldFloatLabel ? placeholder : " "}
        value={value}
        onChange={(e) => {
          const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          onChange(newValue);
        }}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className={`w-full px-3 pt-3 pb-2 text-sm leading-tight border ${borderClass} ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-transparent
          ${shouldFloatLabel && !isDateTimeInput && !isNumberInput ? 'placeholder:text-gray-400' : ''}
          ${className}`}
        style={{
          ...inputStyle,
          ...transparentStyle,
        }}
        {...rest}
        onFocus={(e) => {
          setIsFocused(true);
          // Auto-select all text for number inputs so user can immediately type to replace
          if (isNumberInput && value !== '') {
            e.target.select();
          }
        }}
        onBlur={() => setIsFocused(false)}
      />

      {/* Floating Label */}
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none font-medium
          ${shouldFloatLabel
            ? 'top-0 -translate-y-1/2 bg-white px-1 text-xs text-gray-700'
            : 'top-1/2 -translate-y-1/2 text-sm text-gray-700'
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
