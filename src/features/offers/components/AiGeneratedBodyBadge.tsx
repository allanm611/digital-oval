import { type ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { tw } from "../../../shared/utils/utils";

const AI_BADGE_GREEN = "#059669";
const AI_BADGE_GREEN_BG = "#ecfdf5";
const AI_BADGE_GREEN_BORDER = "#6ee7b7";

interface AiGeneratedBodyBadgeProps {
  visible: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}

/**
 * Wraps the message body editor and pins a greenish AI mark at the bottom-right
 * after an AI-generated message has been inserted.
 */
export default function AiGeneratedBodyBadge({
  visible,
  onClick,
  label,
  children,
}: AiGeneratedBodyBadgeProps) {
  return (
    <div className={`relative ${visible ? "[&_textarea]:pb-10" : ""}`}>
      {children}
      {visible && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClick();
          }}
          title={label}
          aria-label={label}
          className={`absolute bottom-2.5 right-2.5 z-10 inline-flex items-center justify-center w-8 h-8 ${tw.rounded} border shadow-sm hover:opacity-90 transition-opacity`}
          style={{
            backgroundColor: AI_BADGE_GREEN_BG,
            borderColor: AI_BADGE_GREEN_BORDER,
            color: AI_BADGE_GREEN,
          }}
        >
          <Sparkles className="w-4 h-4" strokeWidth={2.25} />
        </button>
      )}
    </div>
  );
}
