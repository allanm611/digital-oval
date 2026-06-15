import React from 'react';
import { color } from '../../utils/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'modern' | 'elegant' | 'minimal';
  color?: 'primary' | 'white' | 'muted';
  className?: string;
}

export default function LoadingSpinner({
  size = 'md',
  variant = 'default',
  color: spinnerColor = 'primary',
  className = ''
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const getSpinnerColor = () => {
    if (spinnerColor === 'primary') return 'var(--c-primary-action)';
    if (spinnerColor === 'white') return 'white';
    return 'var(--c-text-muted)';
  };

  const spinnerColorValue = getSpinnerColor();

  // Default spinner (modern sleek rotating circle)
  if (variant === 'default') {
    return (
      <div className={`${className}`}>
        <svg
          className={`animate-spin ${sizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: spinnerColorValue }}
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            className="opacity-90"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            d="M12 2a10 10 0 0 1 10 10"
          />
        </svg>
      </div>
    );
  }

  // Dots spinner
  if (variant === 'dots') {
    return (
      <div className={`flex space-x-1 ${className}`}>
        <div
          className={`${sizeClasses[size]} rounded-full animate-bounce`}
          style={{
            backgroundColor: spinnerColorValue,
            animationDelay: '0ms'
          }}
        />
        <div
          className={`${sizeClasses[size]} rounded-full animate-bounce`}
          style={{
            backgroundColor: spinnerColorValue,
            animationDelay: '150ms'
          }}
        />
        <div
          className={`${sizeClasses[size]} rounded-full animate-bounce`}
          style={{
            backgroundColor: spinnerColorValue,
            animationDelay: '300ms'
          }}
        />
      </div>
    );
  }

  // Pulse spinner
  if (variant === 'pulse') {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full animate-pulse ${className}`}
        style={{
          backgroundColor: spinnerColorValue
        }}
      />
    );
  }

  // Bounce spinner
  if (variant === 'bounce') {
    return (
      <div className={`${className}`}>
        <div
          className={`${sizeClasses[size]} rounded-full animate-bounce`}
          style={{
            backgroundColor: spinnerColorValue
          }}
        />
      </div>
    );
  }

  // Modern spinner (thin elegant ring)
  if (variant === 'modern') {
    return (
      <div className={`${className}`}>
        <svg
          className={`animate-spin ${sizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: spinnerColorValue }}
        >
          <circle
            className="opacity-10"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="1"
          />
          <path
            className="opacity-100"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            d="M12 2a10 10 0 0 1 10 10"
          />
        </svg>
      </div>
    );
  }

  // Elegant spinner (smooth gradient ring)
  if (variant === 'elegant') {
    return (
      <div className={`${className}`}>
        <div className={`${sizeClasses[size]} relative`}>
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              borderTopColor: spinnerColorValue,
              borderRightColor: spinnerColorValue,
              opacity: 0.3
            }}
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: spinnerColorValue,
              borderRightColor: spinnerColorValue
            }}
          />
        </div>
      </div>
    );
  }

  // Minimal spinner (ultra-thin)
  if (variant === 'minimal') {
    return (
      <div className={`${className}`}>
        <svg
          className={`animate-spin ${sizeClasses[size]}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: spinnerColorValue }}
        >
          <circle
            className="opacity-5"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="0.5"
          />
          <path
            className="opacity-100"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinecap="round"
            d="M12 2a10 10 0 0 1 10 10"
          />
        </svg>
      </div>
    );
  }

  return null;
}