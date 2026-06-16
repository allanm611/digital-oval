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
  'seed-lists': { create: 'seed_lists.create', edit: 'seed_lists.update' },
  'vip-lists': { create: 'vip_lists.create', edit: 'vip_lists.update' },
  'scheduled-jobs': { create: 'jobs.create', edit: 'jobs.update' },
  'job-types': { create: 'jobs.create', edit: 'jobs.update' },
  'job-dependencies': { create: 'jobs.create', edit: 'jobs.update' },
  'offer-categories': { create: 'offers.create', edit: 'offers.update' },
  'product-categories': { create: 'products.create', edit: 'products.update' },
  'offer-creatives': { create: 'offers.create', edit: 'offers.update' },
  'campaign-categories': { create: 'campaigns.create', edit: 'campaigns.update' },
  'connection-profiles': { create: 'connection-profiles.create', edit: 'connection-profiles.update' },
  kpi: { create: 'kpi.create', edit: 'kpi.update' },
  'kpi-categories': { create: 'kpi.create', edit: 'kpi.update' },
  'email-routes': { create: 'offers.create', edit: 'offers.update' },
  servers: { create: 'servers.create', edit: 'servers.update' },
  'subscriber-profiles': { create: 'kpi.create', edit: 'kpi.update' },
  quicklists: { create: 'quicklists.create', edit: 'quicklists.update' },
  programs: { create: 'campaigns.create', edit: 'campaigns.update' },
  'segment-categories': { create: 'segments.create', edit: 'segments.update' },
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
  'scheduled-jobs': '/dashboard/scheduled-jobs',
  'job-types': '/dashboard/job-types',
  'job-dependencies': '/dashboard/job-dependencies',
  'offer-categories': '/dashboard/offer-categories',
  'product-categories': '/dashboard/product-categories',
  'offer-creatives': '/dashboard/offer-creatives',
  'campaign-categories': '/dashboard/campaign-categories',
  'connection-profiles': '/dashboard/connection-profiles',
  kpi: '/dashboard/kpis',
  'kpi-categories': '/dashboard/kpi-categories',
  'email-routes': '/dashboard/email-routes',
  servers: '/dashboard/servers',
  'subscriber-profiles': '/dashboard/kpis/subscriber-profiles',
  quicklists: '/dashboard/quicklists',
  programs: '/dashboard/programs',
  'segment-categories': '/dashboard/segment-categories',
  'manual-communications': '/dashboard/manual-communications',
  'data-connectors': '/dashboard/data-connectors',
  'gateway-configurations': '/dashboard/gateway-configurations',
  'job-workflow-steps': '/dashboard/job-workflow-steps',
  'team-roles': '/dashboard/team-roles',
  'segment-management': '/dashboard/segments',
  'sender-ids': '/dashboard/sender-ids',
  'notification-categories': '/dashboard/notification-categories',
  'timezones': '/dashboard/timezones',
  'configuration': '/dashboard/administration',
};

export default function FeatureActionButton({
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

  const baseRoute = ROUTE_MAP[featureId];
  if (!baseRoute) {
    return null;
  }

  const permissions = PERMISSION_MAP[featureId];
  const permission = permissions?.[action];

  // Skip permission check for now - render button regardless
  // if (!permission || !hasPermission(permission)) {
  //   return null;
  // }

  let route = baseRoute;
  if (action === 'create') {
    const createPath = ['connection-profiles', 'servers'].includes(featureId) ? '/new' : '/create';
    route = `${baseRoute}${createPath}`;
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
