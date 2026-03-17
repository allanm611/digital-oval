import { useCallback } from "react";
import { Plus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { color, tw } from "../../utils/utils";

interface CreateButtonProps {
  route?: string;
  onClick?: () => void;
  className?: string;
  label?: string;
  navigationState?: any;
}

const ROUTE_PRELOADERS: Record<string, () => Promise<unknown>> = {
  "/dashboard/campaigns/create": () =>
    import("../../../features/campaigns/pages/CreateCampaignPageWrapper"),
  "/dashboard/offers/create": () =>
    import("../../../features/offers/pages/CreateOfferPage"),
  "/dashboard/products/create": () =>
    import("../../../features/products/pages/CreateProductPage"),
};

export default function CreateButton({
  route,
  onClick,
  className = "",
  label = "Create",
  navigationState,
}: CreateButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const prefetchRoute = useCallback(() => {
    if (!route) return;

    const preload = ROUTE_PRELOADERS[route];
    if (preload) {
      preload().catch(() => {
        // Ignore prefetch errors and allow normal navigation flow.
      });
    }
  }, [route]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }

    if (!route) {
      return;
    }

    if (route === location.pathname) {
      return;
    }

    prefetchRoute();
    navigate(route, navigationState ? { state: navigationState } : undefined);
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={prefetchRoute}
      onFocus={prefetchRoute}
      className={`inline-flex items-center px-4 py-2.5 font-semibold ${tw.rounded} shadow-sm text-sm whitespace-nowrap text-white transition-all duration-200 hover:shadow-md active:shadow-sm ${className}`}
      style={{ backgroundColor: color.primary.action }}
    >
      <Plus className="h-5 w-5 mr-2" />
      {label}
    </button>
  );
}
