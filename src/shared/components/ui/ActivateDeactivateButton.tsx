import { Power } from "lucide-react";

interface ActivateDeactivateButtonProps {
  isActive: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  title?: string;
}

export default function ActivateDeactivateButton({
  isActive,
  onToggle,
  disabled = false,
  isLoading = false,
  title,
}: ActivateDeactivateButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || isLoading}
      className="p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center rounded"
      style={{
        color: isActive ? "#FF9500" : "#10B981",
      }}
      title={title || (isActive ? "Deactivate" : "Activate")}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Power className="w-4 h-4" />
      )}
    </button>
  );
}
