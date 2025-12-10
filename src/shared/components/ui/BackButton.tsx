import { ArrowLeft } from "lucide-react";
import { useNavigate, To, NavigateOptions } from "react-router-dom";
import { navigateBackOrFallback } from "../../utils/navigation";
import { tw } from "../../utils/utils";

interface BackButtonProps {
  /** Fallback path to navigate to if there's no browser history */
  fallbackTo: To;
  /** Optional navigation options */
  fallbackOptions?: NavigateOptions;
  /** Optional className for styling */
  className?: string;
  /** Optional icon size */
  iconSize?: string;
  /** Optional title/tooltip */
  title?: string;
  /** Optional custom onClick handler (overrides default behavior) */
  onClick?: () => void;
}

/**
 * Reusable back button component that behaves like browser back button.
 * Navigates to previous page in history, or falls back to specified path if no history exists.
 */
export default function BackButton({
  fallbackTo,
  fallbackOptions,
  className = "",
  iconSize = "w-5 h-5",
  title = "Go back",
  onClick,
}: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    navigateBackOrFallback(navigate, fallbackTo, fallbackOptions);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 text-gray-600 hover:text-gray-800 ${tw.rounded} transition-colors ${className}`}
      title={title}
    >
      <ArrowLeft className={iconSize} />
    </button>
  );
}
