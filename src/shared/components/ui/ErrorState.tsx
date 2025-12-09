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
  message = "We couldn’t complete this request. Please try again in a moment.",
  actionLabel = "Try again",
  onRetry,
  icon,
  children,
  className = "",
}: ErrorStateProps) {
  const Icon = icon ?? (
    <div className="rounded-full bg-gray-200 p-2 text-gray-600">
      <AlertCircle className="h-5 w-5" />
    </div>
  );

  return (
    <div
      className={`${tw.rounded} border border-gray-200 bg-white px-5 py-6 text-left shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <div>{Icon}</div>
        <div className="flex-1">
          <h3 className={`${tw.cardHeading} text-gray-900`}>{title}</h3>
          <p className={`${tw.textSecondary} mt-1 text-sm`}>{message}</p>
          {children && (
            <div className="mt-2 text-sm text-gray-600">{children}</div>
          )}
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className={`mt-4 inline-flex items-center gap-2 ${tw.rounded} border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
