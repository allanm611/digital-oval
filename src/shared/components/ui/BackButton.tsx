import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { navigateBackOrFallback } from "../../utils/navigation";

interface BackButtonProps {
  fallbackTo?: string;
  className?: string;
  onClick?: () => void;
}

export default function BackButton({ fallbackTo, className, onClick }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = onClick
    ? onClick
    : () => navigateBackOrFallback(navigate, fallbackTo || "/");

  return (
    <button
      onClick={handleClick}
      className={`transition-colors ${className || ""}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
