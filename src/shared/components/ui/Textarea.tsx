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
  style?: React.CSSProperties;
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
  style = {},
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  let paddingClass = 'px-3 py-2'; // default (medium)
  if (variant === 'default') paddingClass = 'px-4 py-2';
  if (variant === 'compact') paddingClass = 'px-3 py-1';

  // Determine border color based on error state
  const borderClass = hasError ? 'border-red-500' : 'border-gray-300';

  // Explicit theme-aware colors so typed text stays legible in both light and
  // dark mode (mirrors Input.tsx — previously this relied on inherited text
  // color, which washed out against dark-mode surfaces).
  const isReadOnly = rest.readOnly;
  let textareaStyle: React.CSSProperties = {
    backgroundColor: 'var(--c-input-bg)',
    color: 'var(--c-text-primary)',
    ...style,
  };
  let cursorClass = '';

  if (disabled) {
    textareaStyle = {
      backgroundColor: 'var(--c-input-disabled-bg)',
      color: 'var(--c-text-muted)',
      ...style,
    };
    cursorClass = 'cursor-not-allowed';
  } else if (isReadOnly) {
    textareaStyle = {
      backgroundColor: 'var(--c-input-bg)',
      color: 'var(--c-text-primary)',
      ...style,
    };
    cursorClass = 'cursor-default';
  }

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
        className={`w-full ${paddingClass} text-sm placeholder:text-sm placeholder:text-[var(--c-text-muted)] border ${borderClass} ${tw.rounded}
          transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          resize-none
          ${cursorClass}
          ${className}`}
        style={textareaStyle}
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
          ${cursorClass}
          ${className}`}
        style={textareaStyle}
        {...rest}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Floating Label */}
      <label
        className={`absolute left-3 transition-all duration-200 pointer-events-none font-medium
          ${shouldFloatLabel
            ? 'top-0 -translate-y-1/2 px-1 text-xs'
            : 'top-3 text-sm'
          }
        `}
        style={{
          color: 'var(--c-text-secondary)',
          backgroundColor: shouldFloatLabel ? 'var(--c-input-bg)' : 'transparent',
        }}
      >
        {label}
      </label>
    </div>
  );
});

Textarea.displayName = 'Textarea';
export default Textarea;
