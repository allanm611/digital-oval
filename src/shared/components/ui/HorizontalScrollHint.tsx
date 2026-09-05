import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { color } from "../../utils/utils";

export const DEFAULT_HORIZONTAL_SCROLL_HINT =
  "Scroll horizontally to see more columns";

type HorizontalScrollHintProps = {
  hint?: string;
  direction?: "start" | "end";
  align?: "top" | "center";
  onClick: () => void;
};

/**
 * Same overflow affordance used on campaign / offer tables: a teal
 * chevron with a dark tooltip that appears when more content is off-screen.
 */
export default function HorizontalScrollHint({
  hint = DEFAULT_HORIZONTAL_SCROLL_HINT,
  direction = "end",
  align = "top",
  onClick,
}: HorizontalScrollHintProps) {
  const [showHint, setShowHint] = useState(false);
  const isStart = direction === "start";
  const Icon = isStart ? ChevronLeft : ChevronRight;

  return (
    <div
      style={{
        position: "absolute",
        top: align === "top" ? "-8px" : "50%",
        transform: align === "center" ? "translateY(-50%)" : undefined,
        [isStart ? "left" : "right"]: 0,
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        onFocus={() => setShowHint(true)}
        onBlur={() => setShowHint(false)}
        className="p-2 rounded transition-all duration-200 hover:opacity-70"
        style={{
          backgroundColor: "transparent",
          color: color.primary.accent,
          border: "none",
          cursor: "pointer",
        }}
        aria-label={hint}
      >
        <Icon className="w-5 h-5" />
      </button>
      {showHint && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "100%",
            [isStart ? "left" : "right"]: 0,
            marginTop: "4px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 30,
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
