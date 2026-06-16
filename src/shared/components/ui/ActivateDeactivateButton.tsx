import { ReactNode } from "react";

interface ActivateDeactivateButtonProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
  children?: ReactNode; // Text content for button variant
}

export default function ActivateDeactivateButton({
  isActive,
  onToggle,
  disabled = false,
  isLoading = false,
  title,
  children,
}: ActivateDeactivateButtonProps) {
  const hasText = !!children;

  if (hasText) {
    // Button variant with text
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          disabled={disabled || isLoading}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            isActive ? "bg-[#252829] focus:ring-[#252829]" : "bg-gray-300 focus:ring-gray-300"
          }`}
          title={title || (isActive ? "Deactivate" : "Activate")}
        >
          {isLoading ? (
            <div className="absolute left-0.5 h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          )}
        </button>
        <span className="text-sm font-medium">{children}</span>
      </div>
    );
  }

  // Icon-only variant (default) - toggle switch
  return (
    <button
      onClick={onToggle}
      disabled={disabled || isLoading}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? "bg-[#252829] focus:ring-[#252829]" : "bg-gray-300 focus:ring-gray-300"
      }`}
      title={title || (isActive ? "Deactivate" : "Activate")}
    >
      {isLoading ? (
        <div className="absolute left-0.5 h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      ) : (
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
            isActive ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      )}
    </button>
  );
}
