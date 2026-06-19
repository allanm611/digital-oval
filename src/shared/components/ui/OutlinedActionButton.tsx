import React from 'react';
import { tw, button } from '../../utils/utils';

interface OutlinedActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

/**
 * Secondary action button with transparent background and primary border —
 * matches Campaigns "Analytics" and other list-page outline actions.
 */
export default function OutlinedActionButton({
  children,
  icon,
  className = '',
  type = 'button',
  ...props
}: OutlinedActionButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center gap-2 ${tw.rounded} px-4 py-2 text-sm font-medium focus:outline-none transition-colors hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      style={{
        backgroundColor: 'transparent',
        color: 'var(--c-text-primary)',
        border: button.bordered.border,
      }}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
