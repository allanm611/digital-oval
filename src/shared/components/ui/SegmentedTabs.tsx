import {
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import OverflowScrollArea from "./OverflowScrollArea";
import { tw } from "../../utils/utils";

export type SegmentedTabItem<T extends string = string> = {
  id: T;
  label: string;
};

type SegmentedTabsProps<T extends string> = {
  items: Array<SegmentedTabItem<T>>;
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  /** `inline` hugs content (Overview/Trends). `scroll` is full-width with overflow paging. */
  layout?: "inline" | "scroll";
  getButtonId?: (id: T) => string;
  getAriaControls?: (id: T) => string;
  overflowHint?: string;
  className?: string;
};

const SHELL_CLASS = `${tw.rounded} border border-gray-200 bg-white p-0.5`;

function tabButtonClass(selected: boolean) {
  return `${tw.rounded} px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-interactive-focus)] focus-visible:ring-offset-1 ${
    selected
      ? "bg-[var(--c-bg-tab-active)] text-white"
      : "text-gray-700 hover:bg-gray-50"
  }`;
}

function nextIndex(
  current: number,
  key: string,
  count: number,
  rtl: boolean,
): number {
  if (key === "Home") return 0;
  if (key === "End") return count - 1;

  const goingNext =
    key === "ArrowRight" ? !rtl : key === "ArrowLeft" ? rtl : null;
  if (goingNext === null) return current;
  if (goingNext) return (current + 1) % count;
  return (current - 1 + count) % count;
}

export default function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  layout = "inline",
  getButtonId,
  getAriaControls,
  overflowHint = "Scroll horizontally to see more tabs",
  className = "",
}: SegmentedTabsProps<T>) {
  const rootRef = useRef<HTMLDivElement>(null);

  const focusTab = useCallback((tabId: T) => {
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-tab-id="${tabId}"]`)
      ?.focus();
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    const currentIndex = items.findIndex((tab) => tab.id === value);
    if (currentIndex < 0 || items.length === 0) return;

    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const targetIndex = nextIndex(currentIndex, event.key, items.length, rtl);
    const nextTab = items[targetIndex];
    if (!nextTab || nextTab.id === value) return;

    onChange(nextTab.id);
    requestAnimationFrame(() => focusTab(nextTab.id));
  };

  const buttons = items.map((tab) => {
    const selected = value === tab.id;
    return (
      <button
        key={tab.id}
        type="button"
        role="tab"
        id={getButtonId?.(tab.id)}
        data-tab-id={tab.id}
        aria-selected={selected}
        aria-controls={getAriaControls?.(tab.id)}
        tabIndex={selected ? 0 : -1}
        title={tab.label}
        onClick={() => {
          if (tab.id !== value) onChange(tab.id);
        }}
        className={tabButtonClass(selected)}
      >
        {tab.label}
      </button>
    );
  });

  if (layout === "scroll") {
    return (
      <div
        ref={rootRef}
        className={`${SHELL_CLASS} min-w-0 w-full ${className}`}
      >
        <OverflowScrollArea
          hint={overflowHint}
          hideScrollbar
          scrollMode="page"
          role="tablist"
          ariaLabel={ariaLabel}
          observeKey={`${items.length}:${value}`}
          activeItemSelector={`[data-tab-id="${value}"]`}
          fadeColor="var(--c-surface-card-bg, #ffffff)"
          contentClassName="flex flex-nowrap"
          onKeyDown={handleKeyDown}
        >
          {buttons}
        </OverflowScrollArea>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={`${SHELL_CLASS} inline-flex ${className}`}
    >
      {buttons}
    </div>
  );
}
