import React, { useState, useRef } from "react";
import { LucideIcon, Eye, EyeOff } from "lucide-react";

import { tw } from "../../../shared/utils/utils";
interface AnimatedInputProps {
  label?: string;
  placeholder?: string;
  type?: "text" | "email" | "password" | "tel" | "url" | "number";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  error?: string;
  success?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  variant?: "default" | "floating" | "minimal";
  size?: "sm" | "md" | "lg";
  autoComplete?: string;
  maxLength?: number;
}

export default function AnimatedInput({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  onBlur,
  onFocus,
  icon: Icon,
  iconPosition = "left",
  error,
  success = false,
  disabled = false,
  required = false,
  className = "",
  variant = "default",
  size = "md",
  autoComplete,
  maxLength,
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFloatingLabel = variant === "floating" && label;
  const hasValue = value.length > 0;
  const shouldFloatLabel = isFloatingLabel && (isFocused || hasValue);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  };

  const baseInputClasses = `
    w-full ${tw.rounded} border transition-all duration-300 ease-smooth
    focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${Icon && iconPosition === "left" ? "pl-11" : ""}
    ${Icon && iconPosition === "right" ? "pr-11" : ""}
    ${type === "password" ? "pr-11" : ""}
    ${className}
  `;

  const variantClasses = {
    default: `
      bg-secondary-50 border-secondary-300 text-secondary-900 placeholder-secondary-500
      focus:bg-[var(--c-surface-background)]
      hover:border-secondary-400 hover:bg-[var(--c-surface-background)]
      ${error ? "border-error-500 focus:border-error-500" : ""}
      ${success ? "border-success-500 focus:border-success-500" : ""}
    `,
    floating: `
      bg-transparent border-secondary-300 text-secondary-900 placeholder-transparent
      
      hover:border-secondary-400
      ${error ? "border-error-500 focus:border-error-500" : ""}
      ${success ? "border-success-500 focus:border-success-500" : ""}
    `,
    minimal: `
      bg-transparent border-0 border-b-2 border-secondary-300 ${tw.rounded} text-secondary-900
       hover:border-secondary-400 px-0
      ${error ? "border-error-500 focus:border-error-500" : ""}
      ${success ? "border-success-500 focus:border-success-500" : ""}
    `,
  };

  return (
    <div className="relative">
      {/* Standard Label */}
      {label && !isFloatingLabel && (
        <label className="block text-sm font-semibold text-secondary-700 mb-2">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {Icon && iconPosition === "left" && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon
              className={`h-5 w-5 transition-colors duration-200 ${
                isFocused
                  ? error
                    ? "text-error-500"
                    : success
                      ? "text-success-500"
                      : "text-primary-500"
                  : "text-secondary-400"
              }`}
            />
          </div>
        )}

        {/* Input Field */}
        <input
          ref={inputRef}
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFloatingLabel ? "" : placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`${baseInputClasses} ${variantClasses[variant]}`}
        />

        {/* Floating Label */}
        {isFloatingLabel && (
          <label
            className={`
              absolute left-4 transition-all duration-300 ease-smooth pointer-events-none
              ${
                shouldFloatLabel
                  ? "top-0 -translate-y-1/2 text-xs bg-[var(--c-surface-background)] px-2 font-medium"
                  : "top-1/2 -translate-y-1/2 text-base"
              }
              ${
                isFocused
                  ? error
                    ? "text-error-500"
                    : success
                      ? "text-success-500"
                      : "text-primary-500"
                  : "text-secondary-500"
              }
            `}
          >
            {label}
            {required && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        {/* Right Icon or Password Toggle */}
        {(Icon && iconPosition === "right") || type === "password" ? (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {type === "password" ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-secondary-400 hover:text-secondary-600 transition-colors duration-200"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            ) : Icon && iconPosition === "right" ? (
              <Icon
                className={`h-5 w-5 transition-colors duration-200 ${
                  isFocused
                    ? error
                      ? "text-error-500"
                      : success
                        ? "text-success-500"
                        : "text-primary-500"
                    : "text-secondary-400"
                }`}
              />
            ) : null}
          </div>
        ) : null}

        {/* Focus Ring Animation */}
        <div
          className={`
          absolute inset-0 ${tw.rounded} pointer-events-none transition-all duration-300
          ${isFocused && !error && !success ? "ring-0" : ""}
          ${isFocused && error ? "ring-0" : ""}
          ${isFocused && success ? "ring-0" : ""}
        `}
        />
      </div>

      {/* Error/Success Message */}
      {(error || success) && (
        <div
          className={`mt-2 text-sm transition-all duration-300 ${
            error ? "text-error-600" : "text-success-600"
          }`}
        >
          {error || (success && "Looks good!")}
        </div>
      )}

      {/* Character Count */}
      {maxLength && (
        <div className="mt-1 text-xs text-secondary-500 text-right">
          {value.length}/{maxLength}
        </div>
      )}
    </div>
  );
}
