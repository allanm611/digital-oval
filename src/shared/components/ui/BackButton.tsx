import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { navigateBackOrFallback } from "../../utils/navigation";

interface BackButtonProps {
  fallbackTo: string;
  className?: string;
}

export default function BackButton({ fallbackTo, className }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigateBackOrFallback(navigate, fallbackTo)}
      className={`transition-colors ${className || ""}`}
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
}
