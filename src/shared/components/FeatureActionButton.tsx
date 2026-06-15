import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Plus, Edit } from "lucide-react";
import { color, tw } from "../utils/utils";

interface FeatureActionButtonProps {
  featureId: string;
  action: 'create' | 'edit';
  itemId?: number | string;
  onClick?: () => void;
  className?: string;
  label?: string;
  navigationState?: any;
  variant?: 'icon' | 'primary';
}

const PERMISSION_MAP: Record<string, Record<string, string>> = {
  campaigns: { create: 'campaigns.create', edit: 'campaigns.update' },
  offers: { create: 'offers.create', edit: 'offers.update' },
  products: { create: 'products.create', edit: 'products.update' },
  segments: { create: 'segments.create', edit: 'segments.update' },
  'manual-rewards': { create: 'manual_rewards.create', edit: 'manual_rewards.update' },
  'communication-channels': { create: 'communication_channels.create', edit: 'communication_channels.update' },
  'seed-lists': { create: 'seed_lists.create', edit: 'seed_lists.update' },
  'vip-lists': { create: 'vip_lists.create', edit: 'vip_lists.update' },
  'job-types': { create: 'jobs.create', edit: 'jobs.update' },
  'job-dependencies': { create: 'jobs.create', edit: 'jobs.update' },
  'offer-categories': { create: 'offers.create', edit: 'offers.update' },
  'product-categories': { create: 'products.create', edit: 'products.update' },
  'offer-creatives': { create: 'offers.create', edit: 'offers.update' },
  'connection-profiles': { create: 'connection_profiles.create', edit: 'connection_profiles.update' },
  'kpi-categories': { create: 'kpi.create', edit: 'kpi.update' },
  'email-routes': { create: 'offers.create', edit: 'offers.update' },
};

const ROUTE_MAP: Record<string, string> = {
  campaigns: '/dashboard/campaigns',
  offers: '/dashboard/offers',
  products: '/dashboard/products',
  segments: '/dashboard/segments',
  'manual-rewards': '/dashboard/manual-rewards',
  'communication-channels': '/dashboard/communication-channels',
  'seed-lists': '/dashboard/seed-lists',
  'vip-lists': '/dashboard/vip-lists',
  'job-types': '/dashboard/job-types',
  'job-dependencies': '/dashboard/job-dependencies',
  'offer-categories': '/dashboard/offer-categories',
  'product-categories': '/dashboard/product-categories',
  'offer-creatives': '/dashboard/offer-creatives',
  'connection-profiles': '/dashboard/connection-profiles',
  'kpi-categories': '/dashboard/kpi-categories',
  'email-routes': '/dashboard/email-routes',
};

export function FeatureActionButton({
  featureId,
  action,
  itemId,
  onClick,
  className = '',
  label,
  navigationState,
  variant = 'icon',
}: FeatureActionButtonProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const permissions = PERMISSION_MAP[featureId];
  const permission = permissions?.[action];

  if (!permission || !hasPermission(permission)) {
    return null;
  }

  const baseRoute = ROUTE_MAP[featureId];
  if (!baseRoute) {
    console.warn(`No route configured for feature: ${featureId}`);
    return null;
  }

  let route = baseRoute;
  if (action === 'create') {
    route = `${baseRoute}/create`;
  } else if (action === 'edit' && itemId) {
    route = `${baseRoute}/${itemId}/edit`;
  }

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    navigate(route, navigationState ? { state: navigationState } : undefined);
  };

  if (action === 'create') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center px-4 py-2.5 font-semibold ${tw.rounded} shadow-sm text-sm whitespace-nowrap text-white transition-all duration-200 hover:shadow-md active:shadow-sm ${className}`}
        style={{ backgroundColor: color.primary.action }}
      >
        <Plus className="h-5 w-5 mr-2" />
        {label || 'Create'}
      </button>
    );
  }

  if (variant === 'primary') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2 ${tw.rounded} font-semibold transition-all duration-200 text-sm text-white ${className}`}
        style={{ backgroundColor: color.primary.action }}
        title={label || 'Edit'}
      >
        <Edit className="w-4 h-4" />
        {label || 'Edit'}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`group p-3 ${tw.rounded} ${tw.textMuted} hover:bg-gray-100 transition-all duration-300 ${className}`}
      title={label || 'Edit'}
    >
      <Edit className="w-4 h-4" />
    </button>
  );
}
