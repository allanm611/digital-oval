import { Plus } from "lucide-react";

interface LoyaltyAddButtonProps {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

export default function LoyaltyAddButton({
  label,
  disabled = false,
  onClick,
}: LoyaltyAddButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md bg-neutral-950 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
    >
      <Plus className="h-4 w-4" />
      {label}
    </button>
  );
}
