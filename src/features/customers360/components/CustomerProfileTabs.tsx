import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import SegmentedTabs from "../../../shared/components/ui/SegmentedTabs";
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
        className="min-w-0 py-2"
        style={barStyle}
      >
        <SegmentedTabs
          layout="scroll"
          items={CUSTOMER_PROFILE_TABS}
          value={activeTab}
          onChange={onChange}
          ariaLabel="Customer profile sections"
          getButtonId={(id) => `customer-profile-tab-${id}`}
          getAriaControls={() => CUSTOMER_PROFILE_TAB_PANEL_ID}
        />
      </div>
    </>
  );
}
