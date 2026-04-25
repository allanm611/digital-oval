import { getButtonStyles, button } from "../../utils/utils";

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
  const buttonStyles = getButtonStyles(button.bordered);

  return (
    <button
      onClick={onToggle}
      disabled={disabled || isLoading}
      style={buttonStyles}
      title={title}
      className="transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
      ) : null}
      <span>{isActive ? "Deactivate" : "Activate"}</span>
    </button>
  );
}
