import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { color, tw } from "../../utils/utils";

export const DEFAULT_HORIZONTAL_SCROLL_HINT =
  "Scroll horizontally to see more columns";

type HorizontalScrollHintProps = {
  hint?: string;
  direction?: "start" | "end";
  align?: "top" | "center";
  /** `sm` is the table-column hint. `lg` is the tab pager control. */
  size?: "sm" | "lg";
  onClick: () => void;
};

/**
 * Overflow affordance: a teal chevron that pages clipped content.
 * Large size is a 44px circular button so tab strips stay usable at zoom.
 */
export default function HorizontalScrollHint({
  hint = DEFAULT_HORIZONTAL_SCROLL_HINT,
  direction = "end",
  align = "top",
  size = "sm",
  onClick,
}: HorizontalScrollHintProps) {
  const [showHint, setShowHint] = useState(false);
  const isStart = direction === "start";
  const Icon = isStart ? ChevronLeft : ChevronRight;
  const isLarge = size === "lg";

  return (
    <div
      style={{
        position: "absolute",
        top: align === "top" ? "-8px" : "50%",
        transform: align === "center" ? "translateY(-50%)" : undefined,
        [isStart ? "left" : "right"]: isLarge ? 6 : 0,
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
        className={
          isLarge
            ? `flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md transition-colors hover:bg-gray-50 hover:border-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-interactive-focus)] focus-visible:ring-offset-1`
            : `p-2 ${tw.rounded} transition-all duration-200 hover:opacity-70`
        }
        style={
          isLarge
            ? { color: color.primary.accent, cursor: "pointer" }
            : {
                backgroundColor: "transparent",
                color: color.primary.accent,
                border: "none",
                cursor: "pointer",
              }
        }
        aria-label={hint}
      >
        <Icon
          className={isLarge ? "h-7 w-7" : "h-5 w-5"}
          strokeWidth={isLarge ? 2.5 : 2}
        />
      </button>
      {showHint && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            top: "100%",
            [isStart ? "left" : "right"]: 0,
            marginTop: "6px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: isLarge ? "13px" : "12px",
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
