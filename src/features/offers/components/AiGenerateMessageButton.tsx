import { Sparkles } from "lucide-react";
import { color } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { messageContentActionClass } from "./MessageContentToolbar";

interface AiGenerateMessageButtonProps {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

export default function AiGenerateMessageButton({
  onClick,
  disabled = false,
  active = false,
}: AiGenerateMessageButtonProps) {
  const { t } = useLanguage();
  const label = t.offers.aiGenerate.buttonLabel;
  const aria = t.offers.aiGenerate.buttonAria;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={aria}
      aria-label={aria}
      className={`${messageContentActionClass} disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        backgroundColor: active ? `${color.primary.accent}10` : "white",
        borderColor: active ? color.primary.accent : color.border.default,
        color: active ? color.primary.accent : color.text.secondary,
      }}
    >
      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{label}</span>
    </button>
  );
}
