import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { color, tw } from "../../utils/utils";

interface CreateButtonProps {
  route: string;
  className?: string;
}

export default function CreateButton({
  route,
  className = "",
}: CreateButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(route)}
      className={`inline-flex items-center px-4 py-2.5 font-semibold ${tw.rounded} shadow-sm text-sm whitespace-nowrap text-white transition-all duration-200 hover:shadow-md active:shadow-sm ${className}`}
      style={{ backgroundColor: color.primary.action }}
    >
      <Plus className="h-5 w-5 mr-2" />
      Create
    </button>
  );
}
