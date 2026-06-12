import { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { tw } from "../../../shared/utils/utils";

type ErrorStateProps = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onRetry?: () => void;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export default function ErrorState({
  title = "Something went wrong",
  _message = "We couldn’t complete this request. Please try again in a moment.",
  actionLabel = "Try again",
  onRetry,
  icon,
  children,
  className = "",
}: ErrorStateProps) {
  const Icon = icon ?? (
    <div
      className={`rounded-full bg-[var(--c-interactive-hover)] p-2 ${tw.textSecondary}`}
    >
      <AlertCircle className="h-5 w-5" />
    </div>
  );

  return (
    <div
      className={`${tw.rounded} border ${tw.borderDefault} ${tw.surfaceBackground} px-5 py-6 text-left shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div>{Icon}</div>
        <div className="flex-1">
          <h3 className={`${tw.cardHeading} ${tw.textPrimary}`}>
            {String(title)}
          </h3>
          {/* <p className={`${tw.textSecondary} mt-1 text-sm`}>{String(message)}</p> */}
          {children && (
            <div className={`mt-2 text-sm ${tw.textSecondary}`}>{children}</div>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-4 inline-flex items-center gap-2 ${tw.rounded} border ${tw.borderDefault} px-4 py-2 text-sm font-semibold transition hover:bg-[var(--c-interactive-hover)]`}
              style={{
                color: 'var(--c-text-primary)',
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
