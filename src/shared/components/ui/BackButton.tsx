import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { navigateBackOrFallback } from "../../utils/navigation";

interface BackButtonProps {
  fallbackTo?: string;
  className?: string;
  onClick?: () => void;
  iconSize?: string;
  showBreadcrumb?: boolean;
  currentLabel?: string;
}

function toTitleCaseLabel(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function isLikelyIdSegment(segment: string): boolean {
  return (
    /^\d+$/.test(segment) ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      segment,
    )
  );
}

function toSingular(value: string): string {
  if (value.endsWith("ies")) {
    return `${value.slice(0, -3)}y`;
  }

  if (value.endsWith("s") && !value.endsWith("ss")) {
    return value.slice(0, -1);
  }

  return value;
}

function getPathLabel(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "Home";
  }

  const lastSegment = segments[segments.length - 1];
  const previousSegment = segments[segments.length - 2] || "";

  if (isLikelyIdSegment(lastSegment)) {
    const baseName = previousSegment
      ? toTitleCaseLabel(toSingular(previousSegment))
      : "Item";
    return `${baseName} Details`;
  }

  if (lastSegment === "catalogs" && previousSegment) {
    return `${toTitleCaseLabel(toSingular(previousSegment))} Catalogs`;
  }

  return toTitleCaseLabel(lastSegment);
}

export default function BackButton({
  fallbackTo,
  className,
  onClick,
  iconSize,
  showBreadcrumb,
  currentLabel,
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = onClick
    ? onClick
    : () => navigateBackOrFallback(navigate, fallbackTo || "/");

  // Keep compact/icon-only behavior for places that provide explicit icon sizing.
  const shouldShowBreadcrumb = showBreadcrumb ?? !iconSize;

  const breadcrumbData = useMemo(() => {
    const fallbackLabel = fallbackTo ? getPathLabel(fallbackTo) : "Back";
    const computedCurrentLabel =
      currentLabel || getPathLabel(location.pathname);

    return {
      fallbackLabel,
      computedCurrentLabel,
    };
  }, [fallbackTo, currentLabel, location.pathname]);

  if (shouldShowBreadcrumb && fallbackTo) {
    return (
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-2 text-sm ${className || ""}`}
      >
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center text-gray-700 hover:text-black transition-colors"
          aria-label={`Go back to ${breadcrumbData.fallbackLabel}`}
        >
          <ArrowLeft className={iconSize || "w-5 h-5"} />
        </button>

        <ol className="flex items-center gap-1 text-sm sm:text-base flex-wrap">
          <li>
            <button
              type="button"
              onClick={handleClick}
              className="text-gray-600 hover:text-black transition-colors"
            >
              {breadcrumbData.fallbackLabel}
            </button>
          </li>

          {breadcrumbData.computedCurrentLabel !==
            breadcrumbData.fallbackLabel && (
            <>
              <li className="text-gray-400" aria-hidden="true">
                <ChevronRight className="w-3 h-3" />
              </li>
              <li className="font-medium text-gray-900" aria-current="page">
                {breadcrumbData.computedCurrentLabel}
              </li>
            </>
          )}
        </ol>
      </nav>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center text-gray-700 hover:text-black transition-colors ${className || ""}`}
    >
      <ArrowLeft className={iconSize || "w-5 h-5"} />
    </button>
  );
}
