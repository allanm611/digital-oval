import { ReactNode } from "react";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

export const messageContentActionClass =
  "inline-flex items-center justify-center gap-1.5 h-8 px-2.5 sm:px-3 text-sm leading-none whitespace-nowrap shrink-0 rounded-md border box-border transition-colors";

interface MessageContentToolbarProps {
  label?: string;
  children: ReactNode;
}

/**
 * Keeps Message Content actions (Plain Text, Insert Variable, AI) on one row
 * at every breakpoint. The control group never wraps; if the column is too
 * narrow the bar scrolls horizontally instead of stacking buttons.
 */
export default function MessageContentToolbar({
  label,
  children,
}: MessageContentToolbarProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-nowrap items-center gap-2 sm:gap-3 p-3 rounded-lg min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
      style={{ backgroundColor: color.surface.cards }}
    >
      <span
        className={`text-sm font-medium leading-5 whitespace-nowrap shrink-0 ${tw.textPrimary}`}
      >
        {label ?? t.offers.messageContent.label}
      </span>
      <div className="ml-auto flex items-center gap-2 flex-nowrap shrink-0">
        {children}
      </div>
    </div>
  );
}
