import {
  useEffect,
  useRef,
  type KeyboardEventHandler,
  type ReactNode,
} from "react";
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
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  /** Fade overlay color when content overflows. Defaults to the page background. */
  fadeColor?: string;
};

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollActiveItemHorizontally(
  scroller: HTMLElement,
  active: HTMLElement,
  behavior: ScrollBehavior,
) {
  const scrollerRect = scroller.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  const edgePadding = 48;

  if (activeRect.left < scrollerRect.left + edgePadding) {
    scroller.scrollBy({
      left: activeRect.left - scrollerRect.left - edgePadding,
      behavior,
    });
    return;
  }

  if (activeRect.right > scrollerRect.right - edgePadding) {
    scroller.scrollBy({
      left: activeRect.right - scrollerRect.right + edgePadding,
      behavior,
    });
  }
}

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
  onKeyDown,
  fadeColor = "var(--c-primary-background, #e5e7eb)",
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
    scrollActiveItemHorizontally(
      scrollerRef.current,
      active,
      prefersReducedMotion() ? "auto" : "smooth",
    );
  }, [activeItemSelector]);

  const scrollByDirection = (direction: "start" | "end") => {
    const el = scrollerRef.current;
    if (!el) return;
    const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
    if (scrollMode === "end") {
      el.scrollTo({
        left: direction === "end" ? el.scrollWidth : 0,
        behavior,
      });
      return;
    }
    const delta = Math.max(el.clientWidth * 0.7, 160);
    el.scrollBy({
      left: direction === "end" ? delta : -delta,
      behavior,
    });
  };

  return (
    <div className={`relative min-w-0 w-full ${className}`}>
      {hasOverflow && !isAtStart ? (
        <HorizontalScrollHint
          direction="start"
          align="center"
          size="lg"
          hint={hint}
          onClick={() => scrollByDirection("start")}
        />
      ) : null}
      {hasOverflow && !isAtEnd ? (
        <HorizontalScrollHint
          direction="end"
          align="center"
          size="lg"
          hint={hint}
          onClick={() => scrollByDirection("end")}
        />
      ) : null}
      {hasOverflow && !isAtStart ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-14 z-10"
          style={{
            background: `linear-gradient(to right, ${fadeColor}, transparent)`,
          }}
        />
      ) : null}
      {hasOverflow && !isAtEnd ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-14 z-10"
          style={{
            background: `linear-gradient(to left, ${fadeColor}, transparent)`,
          }}
        />
      ) : null}
      <div
        ref={scrollerRef}
        role={role}
        aria-label={ariaLabel}
        aria-orientation={role === "tablist" ? "horizontal" : undefined}
        onKeyDown={onKeyDown}
        className={`overflow-x-auto min-w-0 overscroll-x-contain ${
          hideScrollbar
            ? "[&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]"
            : ""
        } ${contentClassName}`}
        style={{
          ...(hideScrollbar
            ? {
                scrollbarWidth: "none" as const,
                msOverflowStyle: "none" as const,
              }
            : undefined),
          paddingLeft: hasOverflow && !isAtStart ? 44 : undefined,
          paddingRight: hasOverflow && !isAtEnd ? 44 : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
