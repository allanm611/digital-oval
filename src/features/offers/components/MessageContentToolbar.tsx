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
 * Message Content actions stay on one row in the expanded editor.
 * The bar does not use a persistent horizontal scrollbar; on very narrow
 * viewports the actions wrap under the label instead of clipping.
 */
export default function MessageContentToolbar({
  label,
  children,
}: MessageContentToolbarProps) {
  const { t } = useLanguage();

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg min-w-0"
      style={{ backgroundColor: color.surface.cards }}
    >
      <span
        className={`text-sm font-medium leading-5 whitespace-nowrap ${tw.textPrimary}`}
      >
        {label ?? t.offers.messageContent.label}
      </span>
      <div className="flex items-center gap-2 flex-nowrap">
        {children}
      </div>
    </div>
  );
}
