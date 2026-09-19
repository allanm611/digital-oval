import { Eye } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import type { AiPromptPreviewRow } from "../utils/aiPromptPreview";

interface AiPromptPreviewPanelProps {
  title: string;
  subtitle: string;
  rows: AiPromptPreviewRow[];
  showHeader?: boolean;
}

export default function AiPromptPreviewPanel({
  title,
  subtitle,
  rows,
  showHeader = true,
}: AiPromptPreviewPanelProps) {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div>
          <p className={`text-sm font-medium ${tw.textPrimary}`}>{title}</p>
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        </div>
      )}
      <dl className={`border border-gray-200 ${tw.rounded} divide-y divide-gray-100`}>
        {rows.map((row) => (
          <div key={row.key} className="px-3 py-2.5 sm:grid sm:grid-cols-3 sm:gap-3">
            <dt className="text-xs font-medium text-gray-500">{row.label}</dt>
            <dd
              className={`mt-1 sm:mt-0 sm:col-span-2 text-sm whitespace-pre-wrap ${
                row.empty ? "text-gray-400 italic" : tw.textPrimary
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface PreviewPromptButtonProps {
  label: string;
  ariaLabel?: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}

export function PreviewPromptButton({
  label,
  ariaLabel,
  onClick,
  disabled = false,
  active = false,
}: PreviewPromptButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || label}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 px-4 py-2 border ${tw.rounded} text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active ? "" : "text-gray-700 hover:bg-gray-50"
      }`}
      style={{
        borderColor: active ? color.primary.accent : color.border.default,
        backgroundColor: active ? `${color.primary.accent}10` : "white",
        color: active ? color.primary.accent : undefined,
      }}
    >
      <Eye className="w-4 h-4" />
      {label}
    </button>
  );
}
