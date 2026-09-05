import { useEffect, useRef, type ReactNode } from "react";
import { useHorizontalOverflow } from "../../hooks/useHorizontalOverflow";
import HorizontalScrollHint, {
  DEFAULT_HORIZONTAL_SCROLL_HINT,
} from "./HorizontalScrollHint";

type OverflowScrollAreaProps = {
  children: ReactNode;
  hint?: string;
  className?: string;
  contentClassName?: string;
  /** Recalculate overflow when this identity changes (tab count, labels, etc.). */
  observeKey?: unknown;
  /** CSS selector within the scroller; that node is kept in view. */
  activeItemSelector?: string;
  hideScrollbar?: boolean;
  scrollMode?: "end" | "page";
  role?: string;
  ariaLabel?: string;
};

/**
 * Horizontal scroller with the campaigns-table overflow chevron.
 * Use for tab rows and other single-axis strips that clip on zoom.
 */
export default function OverflowScrollArea({
  children,
  hint = DEFAULT_HORIZONTAL_SCROLL_HINT,
  className = "",
  contentClassName = "",
  observeKey,
  activeItemSelector,
  hideScrollbar = false,
  scrollMode = "end",
  role,
  ariaLabel,
}: OverflowScrollAreaProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { hasOverflow, isAtStart, isAtEnd } = useHorizontalOverflow(
    scrollerRef,
    [observeKey],
  );

  useEffect(() => {
    if (!activeItemSelector || !scrollerRef.current) return;
    const active = scrollerRef.current.querySelector(activeItemSelector);
    if (!(active instanceof HTMLElement)) return;
    active.scrollIntoView({
      inline: "nearest",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeItemSelector]);

  const scrollByDirection = (direction: "start" | "end") => {
    const el = scrollerRef.current;
    if (!el) return;
    if (scrollMode === "end") {
      el.scrollTo({
        left: direction === "end" ? el.scrollWidth : 0,
        behavior: "smooth",
      });
      return;
    }
    const delta = Math.max(el.clientWidth * 0.7, 160);
    el.scrollBy({
      left: direction === "end" ? delta : -delta,
      behavior: "smooth",
    });
  };

  return (
    <div className={`relative min-w-0 w-full ${className}`}>
      {hasOverflow && !isAtStart ? (
        <HorizontalScrollHint
          direction="start"
          align="center"
          hint={hint}
          onClick={() => scrollByDirection("start")}
        />
      ) : null}
      {hasOverflow && !isAtEnd ? (
        <HorizontalScrollHint
          direction="end"
          align="center"
          hint={hint}
          onClick={() => scrollByDirection("end")}
        />
      ) : null}
      {hasOverflow && !isAtStart ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-8 z-10"
          style={{
            background:
              "linear-gradient(to right, var(--c-surface-page, #fff), transparent)",
          }}
        />
      ) : null}
      {hasOverflow && !isAtEnd ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 z-10"
          style={{
            background:
              "linear-gradient(to left, var(--c-surface-page, #fff), transparent)",
          }}
        />
      ) : null}
      <div
        ref={scrollerRef}
        role={role}
        aria-label={ariaLabel}
        className={`overflow-x-auto min-w-0 ${
          hideScrollbar
            ? "[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
            : ""
        } ${contentClassName}`}
        style={
          hideScrollbar
            ? {
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
