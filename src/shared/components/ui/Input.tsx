import React from 'react';
import { tw } from '../../utils/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  variant?: 'default' | 'compact'; // default: px-4 py-2, compact: px-3 py-1
}

export default function Input({
  placeholder,
  value,
  onChange,
  disabled = false,
  className = '',
  onKeyDown,
  variant = 'default',
  ...rest
}: InputProps) {
  const paddingClass = variant === 'compact' ? 'px-3 py-1' : 'px-4 py-2';

  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={`w-full ${paddingClass} text-sm border border-gray-300 ${tw.rounded}
        transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'}
        ${className}`}
      {...rest}
    />
  );
}
