import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import OverflowScrollArea from "../../../shared/components/ui/OverflowScrollArea";
import { color } from "../../../shared/utils/utils";
import {
  CUSTOMER_PROFILE_TAB_PANEL_ID,
  CUSTOMER_PROFILE_TABS,
  type CustomerProfileTabId,
} from "../constants/customerProfileTabs";

const STICKY_TOP = "var(--sticky-toolbar-offset, 4rem)";
const DEFAULT_OFFSET_PX = 64;
/** Below the sidebar (Tailwind z-50) and app header (z-index 100). */
const TABS_Z_INDEX = 40;

function readStickyOffsetPx(from: HTMLElement | null): number {
  if (!from) return DEFAULT_OFFSET_PX;
  const raw =
    getComputedStyle(from).getPropertyValue("--sticky-toolbar-offset").trim() ||
    "4rem";
  if (raw.endsWith("rem")) {
    const rootSize = Number.parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    const rem = Number.parseFloat(raw);
    return rem * (Number.isFinite(rootSize) ? rootSize : 16);
  }
  const px = Number.parseFloat(raw);
  return Number.isFinite(px) ? px : DEFAULT_OFFSET_PX;
}

type CustomerProfileTabsProps = {
  activeTab: CustomerProfileTabId;
  onChange: (tab: CustomerProfileTabId) => void;
};

export default function CustomerProfileTabs({
  activeTab,
  onChange,
}: CustomerProfileTabsProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const hasMountedRef = useRef(false);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const bar = barRef.current;
    if (!sentinel || !bar) return;

    const offsetPx = readStickyOffsetPx(bar);
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPinned(entry.boundingClientRect.top <= offsetPx);
      },
      {
        threshold: [0, 1],
        rootMargin: `-${offsetPx}px 0px 0px 0px`,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const offsetPx = readStickyOffsetPx(barRef.current);
    const naturalTop = window.scrollY + sentinel.getBoundingClientRect().top;
    const target = Math.max(0, naturalTop - offsetPx);
    if (window.scrollY > target) {
      window.scrollTo({ top: target, behavior: "auto" });
    }
  }, [activeTab]);

  const focusTab = useCallback((tabId: CustomerProfileTabId) => {
    barRef.current
      ?.querySelector<HTMLElement>(`[data-tab-id="${tabId}"]`)
      ?.focus();
  }, []);

  const handleTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();
    const currentIndex = CUSTOMER_PROFILE_TABS.findIndex(
      (tab) => tab.id === activeTab,
    );
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % CUSTOMER_PROFILE_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + CUSTOMER_PROFILE_TABS.length) %
        CUSTOMER_PROFILE_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else {
      nextIndex = CUSTOMER_PROFILE_TABS.length - 1;
    }

    const nextTab = CUSTOMER_PROFILE_TABS[nextIndex];
    if (!nextTab || nextTab.id === activeTab) return;
    onChange(nextTab.id);
    requestAnimationFrame(() => focusTab(nextTab.id));
  };

  const barStyle: CSSProperties = {
    position: "sticky",
    top: STICKY_TOP,
    zIndex: TABS_Z_INDEX,
    backgroundColor: "var(--c-primary-background)",
    boxShadow: isPinned
      ? "0 1px 0 rgba(15, 23, 42, 0.08), 0 10px 18px -14px rgba(15, 23, 42, 0.28)"
      : undefined,
  };

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        className="pointer-events-none h-px -mb-px"
      />
      <div
        ref={barRef}
        data-customer-profile-tabs
        data-pinned={isPinned ? "true" : "false"}
        className="min-w-0"
        style={barStyle}
      >
        <OverflowScrollArea
          hint="Scroll horizontally to see more tabs"
          hideScrollbar
          scrollMode="page"
          role="tablist"
          ariaLabel="Customer profile sections"
          observeKey={CUSTOMER_PROFILE_TABS.length}
          activeItemSelector={`[data-tab-id="${activeTab}"]`}
          contentClassName="flex flex-nowrap gap-1 border-b border-gray-200 pr-10"
          onKeyDown={handleTabListKeyDown}
        >
          {CUSTOMER_PROFILE_TABS.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`customer-profile-tab-${tab.id}`}
                data-tab-id={tab.id}
                aria-selected={selected}
                aria-controls={CUSTOMER_PROFILE_TAB_PANEL_ID}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(tab.id)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors relative whitespace-nowrap flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-primary-accent)] focus-visible:ring-offset-1 ${
                  selected
                    ? "text-black"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {selected && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: color.primary.accent }}
                  />
                )}
              </button>
            );
          })}
        </OverflowScrollArea>
      </div>
    </>
  );
}
