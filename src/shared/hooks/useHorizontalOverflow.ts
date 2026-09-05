import { useCallback, useEffect, useState, type RefObject } from "react";

export type HorizontalOverflowState = {
  hasOverflow: boolean;
  isAtStart: boolean;
  isAtEnd: boolean;
  measure: () => void;
};

/**
 * Tracks whether an element overflows horizontally and whether the
 * scroll position is at either edge. Recalculates on scroll, window
 * resize, visual-viewport zoom, and ResizeObserver layout changes.
 */
export function useHorizontalOverflow(
  ref: RefObject<HTMLElement | null>,
  deps: readonly unknown[] = [],
): HorizontalOverflowState {
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(true);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const { scrollLeft, clientWidth, scrollWidth } = el;
    const overflow = scrollWidth > clientWidth + 1;
    setHasOverflow(overflow);
    setIsAtStart(!overflow || scrollLeft <= 1);
    setIsAtEnd(!overflow || scrollLeft + clientWidth >= scrollWidth - 1);
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    Array.from(el.children).forEach((child) => observer.observe(child));

    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies layout deps
  }, [measure, ...deps]);

  return { hasOverflow, isAtStart, isAtEnd, measure };
}
