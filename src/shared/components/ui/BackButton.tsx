import { useMemo } from "react";
import { useLocation, useNavigate, type To } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { navigateBackOrFallback, getResolvedReturnTo, navigateToReturnTo } from "../../utils/navigation";
import { useNavigationHistory } from "../../contexts/NavigationHistoryContext";

interface BackButtonProps {
  className?: string;
  onClick?: () => void;
  iconSize?: string;
  showBreadcrumb?: boolean;
  currentLabel?: string;
  parentLabel?: string;
  /**
   * Hierarchy parent path. When set, the back arrow and parent crumb go here
   * instead of using browser history (which labels list pages as "Details").
   */
  parentTo?: To;
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

function findEntitySegment(segments: string[]): string | null {
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i];
    if (
      !segment ||
      segment === "dashboard" ||
      isLikelyIdSegment(segment) ||
      segment === "create" ||
      segment === "edit" ||
      segment === "new" ||
      segment === "details"
    ) {
      continue;
    }
    return segment;
  }
  return null;
}

function getPathLabel(path: string): string {
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 0) {
    return "Home";
  }

  const lastSegment = segments[segments.length - 1];
  const previousSegment = segments[segments.length - 2] || "";

  if (isLikelyIdSegment(lastSegment)) {
    if (previousSegment === "details") {
      const entity = segments[segments.length - 3];
      if (entity) {
        return `${toTitleCaseLabel(toSingular(entity))} Details`;
      }
    }
    const baseName = previousSegment
      ? toTitleCaseLabel(toSingular(previousSegment))
      : "Item";
    return `${baseName} Details`;
  }

  if (lastSegment === "catalogs" && previousSegment) {
    return `${toTitleCaseLabel(toSingular(previousSegment))} Catalogs`;
  }

  // Avoid bare "Edit" / "Create" crumbs when previous path ends in an action
  // segment (e.g. /offers/138/edit → "Edit Offer").
  if (
    lastSegment === "create" ||
    lastSegment === "edit" ||
    lastSegment === "new" ||
    lastSegment === "details"
  ) {
    const entity = findEntitySegment(segments.slice(0, -1));
    if (entity) {
      const entityLabel = toTitleCaseLabel(toSingular(entity));
      if (lastSegment === "details") return `${entityLabel} Details`;
      return `${toTitleCaseLabel(lastSegment)} ${entityLabel}`;
    }
  }

  return toTitleCaseLabel(lastSegment);
}

export default function BackButton({
  className,
  onClick,
  iconSize,
  showBreadcrumb,
  currentLabel,
  parentLabel,
  parentTo,
}: BackButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { previousPath } = useNavigationHistory();
  const returnTo = getResolvedReturnTo(location);

  const handleClick = onClick
    ? onClick
    : () => {
        if (returnTo) {
          navigateToReturnTo(navigate, returnTo);
          return;
        }
        if (parentTo != null) {
          navigate(parentTo);
          return;
        }
        navigateBackOrFallback(navigate, "/");
      };

  // Keep compact/icon-only behavior for places that provide explicit icon sizing.
  const shouldShowBreadcrumb = showBreadcrumb ?? !iconSize;

  const breadcrumbData = useMemo(() => {
    let fallbackLabel = parentLabel || returnTo?.parentLabel || "Back";

    // If no parentLabel provided, infer from actual previous path or current path structure
    if (!parentLabel && !returnTo?.parentLabel) {
      if (returnTo?.pathname) {
        fallbackLabel = getPathLabel(returnTo.pathname);
      } else if (previousPath) {
        fallbackLabel = getPathLabel(previousPath);
      } else {
        // Fallback: infer from current path structure
        const segments = location.pathname.split("/").filter(Boolean);
        if (segments.length > 1) {
          // Remove last segment (the detail/analytics page) to get parent
          const parentSegments = segments.slice(0, -1);
          const parentPath = "/" + parentSegments.join("/");
          fallbackLabel = getPathLabel(parentPath);
        }
      }
    }

    const computedCurrentLabel =
      currentLabel || getPathLabel(location.pathname);

    return {
      fallbackLabel,
      computedCurrentLabel,
    };
  }, [currentLabel, location.pathname, parentLabel, previousPath, returnTo]);

  if (shouldShowBreadcrumb) {
    return (
      <nav
        aria-label="Breadcrumb"
        className={`flex items-center gap-2 text-base ${className || ""}`}
      >
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center text-gray-700 hover:text-black transition-colors"
          aria-label={`Go back to ${breadcrumbData.fallbackLabel}`}
        >
          <ArrowLeft className={iconSize || "w-5 h-5"} />
        </button>

        <ol className="flex items-center gap-1 text-base flex-wrap">
          <li>
            <button
              type="button"
              onClick={handleClick}
              className="text-base text-gray-600 hover:text-black transition-colors"
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
              <li className="text-base font-medium text-gray-900" aria-current="page">
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
