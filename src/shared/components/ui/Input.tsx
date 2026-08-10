import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
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
  labelBgColor?: string; // Custom background color for floating label (e.g., 'var(--c-dashboard-background)')
  style?: React.CSSProperties;
  /** Show eye toggle for password fields. Defaults to true when type is password. */
  showPasswordToggle?: boolean;
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
  labelBgColor,
  style = {},
  showPasswordToggle,
  onFocus,
  onBlur,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPasswordType = type === 'password';
  const shouldShowToggle = isPasswordType && showPasswordToggle !== false;
  const inputType = shouldShowToggle && showPassword ? 'text' : type;
  /** Hides Edge/IE native reveal so only our single eye control is shown */
  const passwordToggleInputClass = shouldShowToggle
    ? 'c-input--password-toggle pr-10 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden'
    : '';

  let paddingClass = 'px-4 py-2'; // default
  if (variant === 'medium') paddingClass = 'px-3 py-2';
  if (variant === 'compact') paddingClass = 'px-3 py-1';

  // Determine background based on disabled/readOnly state
  const isReadOnly = rest.readOnly;
  let inputStyle: React.CSSProperties = {
    backgroundColor: labelBgColor || 'var(--c-input-bg)',
    borderColor: hasError ? '#ef4444' : 'var(--c-border-default)',
    color: 'var(--c-text-primary)',
    accentColor: ['date', 'time', 'datetime-local'].includes(type) ? 'var(--c-input-accent)' : undefined,
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
      backgroundColor: labelBgColor || 'var(--c-input-bg)',
      color: 'var(--c-text-primary)',
      cursor: 'default',
      ...style
    };
  }

  const hasValue = value !== '' && value !== null && value !== undefined;
  const shouldFloatLabel = isFocused || hasValue;

  const passwordToggleButton = shouldShowToggle ? (
    <button
      type="button"
      tabIndex={-1}
      onClick={() => setShowPassword((prev) => !prev)}
      disabled={disabled}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  ) : null;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Without floating label (backward compatible)
  if (!label) {
    const inputEl = (
      <input
        ref={ref}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          onChange(newValue);
        }}
        disabled={disabled}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`w-full ${paddingClass} text-sm placeholder:text-sm border ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${passwordToggleInputClass}
          ${className}`}
        style={inputStyle}
        {...rest}
        type={inputType}
      />
    );

    if (!shouldShowToggle) {
      return inputEl;
    }

    return (
      <div className="relative w-full">
        {inputEl}
        {passwordToggleButton}
      </div>
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
        placeholder={shouldFloatLabel ? placeholder : " "}
        value={value}
        onChange={(e) => {
          const newValue = type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
          onChange(newValue);
        }}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className={`w-full px-3 pt-3 pb-2 text-sm leading-tight border ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-transparent
          ${shouldFloatLabel && !isDateTimeInput && !isNumberInput ? 'placeholder:text-gray-400' : ''}
          ${passwordToggleInputClass}
          ${className}`}
        style={{
          ...inputStyle,
          ...transparentStyle,
        }}
        {...rest}
        type={inputType}
        onFocus={(e) => {
          handleFocus(e);
          // Auto-select all text for number inputs so user can immediately type to replace
          if (isNumberInput && value !== '') {
            e.target.select();
          }
        }}
        onBlur={handleBlur}
      />

      {/* Floating Label */}
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none font-medium
          ${shouldFloatLabel
            ? 'top-0 -translate-y-1/2 px-1 text-xs'
            : 'top-1/2 -translate-y-1/2 text-sm'
          }
        `}
        style={
          shouldFloatLabel
            ? { backgroundColor: labelBgColor || 'var(--c-input-bg)', color: 'var(--c-text-primary)' }
            : { color: 'var(--c-text-secondary)' }
        }
      >
        {label}
      </label>

      {passwordToggleButton}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
