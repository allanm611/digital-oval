import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import React from "react";
import {
  Home,
  Target,
  Users,
  MessageSquare,
  Settings,
  Package,
  FolderOpen,
  UserCheck,
  ChevronDown,
  ChevronRight,
  X,
  Cog,
  Tag,
  Layers,
  Calendar,
  Briefcase,
  List,
  Activity,
  LineChart,
  Gift,
  Mail,
  LogOut,
  User,
  Server,
  Database,
  Link2,
  PlayCircle,
  GitBranch,
  ChevronLeft,
  Plug,
  ListChecks,
  Archive,
  LayoutGrid,
  Network,
  UserRound,
  UsersRound,
  UserCog,
  TrendingUp,
  Send,
  Box,
  Download,
  Zap,
  BookOpen,
} from "lucide-react";
import logo from "../../../assets/Effortel_logo.svg";
import { color, tw, zIndex } from "../../../shared/utils/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { roleService } from "../../roles/services/roleService";
import { userService } from "../../users/services/userService";
import { Role } from "../../roles/types/role";
import { UserType as FullUserType } from "../../users/types/user";
import { PermissionGate } from "../../auth/components/PermissionGate";

// Hide scrollbar CSS and custom animations
const hideScrollbarStyle = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  @keyframes slideInFromLeft {
    0% {
      transform: translateY(10px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
`;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onMinimizeChange?: (minimized: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "single" | "parent";
  children?: NavigationItem[];
  entity?:
    | "campaigns"
    | "products"
    | "offers"
    | "segments"
    | "quicklists"
    | "users"
    | "analytics"
    | "configuration"
    | "customers"
    | "servers"
    | "jobs"
    | "settings"
    | "manual-actions";
}

const SIDEBAR_ROUTE_PRELOADERS: Record<string, () => Promise<unknown>> = {
  "/dashboard": () => import("../components/DashboardHome"),
  "/dashboard/administration": () =>
    import("../../administration/pages/AdminHubPage"),
  "/dashboard/campaigns": () =>
    import("../../campaigns/pages/CampaignsPageWrapper"),
  "/dashboard/campaign-objectives": () =>
    import("../../campaigns/pages/CampaignObjectivesPage"),
  "/dashboard/programs": () => import("../../campaigns/pages/ProgramsPage"),
  "/dashboard/campaign-catalogs": () =>
    import("../../campaigns/pages/CampaignCategoriesPage"),
  "/dashboard/campaign-types": () =>
    import("../../campaigns/pages/CampaignTypesPage"),
  "/dashboard/campaign-broadcasts": () =>
    import("../../campaigns/pages/CampaignBroadcastsPage"),
  "/dashboard/offers": () => import("../../offers/pages/OffersPageWrapper"),
  "/dashboard/offer-types": () => import("../../offers/pages/OfferTypesPage"),
  "/dashboard/offer-catalogs": () =>
    import("../../offers/pages/OfferCategoriesPageWrapper"),
  "/dashboard/offer-tracking-sources": () =>
    import("../../offers/pages/TrackingSourcesPage"),
  "/dashboard/products": () =>
    import("../../products/pages/ProductsPageWrapper"),
  "/dashboard/product-types": () =>
    import("../../products/pages/ProductTypesPage"),
  "/dashboard/resource-types": () =>
    import("../../products/pages/ResourceTypesPage"),
  "/dashboard/utilities": () =>
    import("../../products/pages/UtilitiesPage"),
  "/dashboard/products/catalogs": () =>
    import("../../products/pages/ProductCategoriesPageWrapper"),
  "/dashboard/segments": () =>
    import("../../segments/pages/SegmentManagementPageWrapper"),
  "/dashboard/segment-types": () =>
    import("../../segments/pages/SegmentTypesPage"),
  "/dashboard/segment-catalogs": () =>
    import("../../segments/pages/SegmentCategoriesPageWrapper"),
  "/dashboard/quick-lists": () =>
    import("../../quicklists/pages/QuickListsPageWrapper"),
  "/dashboard/vip-list-management": () =>
    import("../../campaigns/pages/VIPListManagementPage"),
  "/dashboard/seed-list-management": () =>
    import("../../campaigns/pages/SeedListManagementPage"),
  "/dashboard/customers": () =>
    import("../../customers360/pages/CustomersPageWrapper"),
  "/dashboard/customer-identity": () =>
    import("../../customerIdentity/pages/CustomerIdentityPage"),
  "/dashboard/user-management": () =>
    import("../../users/pages/UserManagementPageWrapper"),
  "/dashboard/roles": () =>
    import("../../configurations/pages/TeamRolesPage"),
  "/dashboard/access-control": () =>
    import("../../roles/pages/TeamRolesPermissionsPage"),
  "/dashboard/reports/overview": () =>
    import("../pages/OverallDashboardPerformancePage"),
  "/dashboard/reports/customer-profiles": () =>
    import("../../reports-analytics/pages/CustomerProfileReportsPage"),
  "/dashboard/reports/campaigns": () =>
    import("../../reports-analytics/pages/CampaignReportsPage"),
  "/dashboard/reports/offers": () =>
    import("../../reports-analytics/pages/OfferReportsPage"),
  "/dashboard/reports/segments": () =>
    import("../../reports-analytics/pages/SegmentReportsPage"),
  "/dashboard/reports/delivery": () =>
    import("../../reports-analytics/pages/DeliverySMSReportsPage"),
  "/dashboard/reports/email-delivery": () =>
    import("../../reports-analytics/pages/DeliveryEmailReportsPage"),
  "/dashboard/servers": () => import("../../servers/pages/ServersPageWrapper"),
  "/dashboard/connection-profiles": () =>
    import("../../connection-profiles/pages/ConnectionProfilesPage"),
  "/dashboard/data-connectors": () =>
    import("../../data-connectors/pages/DataConnectors"),
  "/dashboard/etl": () => import("../../etl/pages/EtlFileRegistryPage"),
  "/dashboard/kpis": () => import("../../kpis/pages/KPIsPage"),
  "/dashboard/jobs": () => import("../../jobs/pages/ScheduledJobsPageWrapper"),
  "/dashboard/job-executions": () =>
    import("../../jobs/pages/JobExecutionsPage"),
  "/dashboard/job-types": () => import("../../jobs/pages/JobTypesPage"),
  "/dashboard/job-dependencies": () =>
    import("../../jobs/pages/JobDependenciesPage"),
  "/dashboard/job-workflow-steps": () =>
    import("../../jobs/pages/JobWorkflowStepsPage"),
  "/dashboard/workflows": () => import("../../jobs/pages/WorkflowsPage"),
  "/dashboard/manual-broadcasts": () =>
    import("../../manual-actions/pages/ManualBroadcastsHubPage"),
  "/dashboard/configuration": () =>
    import("../../configurations/pages/ConfigurationPage"),
  "/dashboard/profile": () => import("../../users/pages/UserProfilePage"),
  "/dashboard/settings": () => import("../../settings/pages/SettingsPage"),
};

function resolvePrefetchRoute(pathname: string): string {
  if (SIDEBAR_ROUTE_PRELOADERS[pathname]) {
    return pathname;
  }

  if (pathname.startsWith("/dashboard/kpis")) {
    return "/dashboard/kpis";
  }

  if (pathname.startsWith("/dashboard/sms-routes")) {
    return "/dashboard/settings";
  }

  return pathname;
}

export default function Sidebar({
  isOpen,
  onClose,
  isMinimized: initialMinimized = false,
  onMinimizeChange,
}: SidebarProps) {
  const location = useLocation();
  const { t } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const previousPathnameRef = useRef<string>("");
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());
  const { user, logout } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState<string>(
    t.sidebar.user.defaultRole,
  );

  const handleMinimizeToggle = useCallback(() => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    onMinimizeChange?.(newState);
  }, [isMinimized, onMinimizeChange]);

  const loadCurrentUserRole = useCallback(async () => {
    if (!user?.user_id) {
      setCurrentUserRole(t.sidebar.user.defaultRole);
      return;
    }

    try {
      const { roles } = await roleService.listRoles({
        limit: 100,
        offset: 0,
      });
      const mappedRoles: Record<number, Role> = {};
      roles.forEach((role) => {
        mappedRoles[role.id] = role;
      });

      let fullUser: FullUserType | null = null;
      try {
        const userResponseById = await userService.getUserById(user.user_id);
        if (userResponseById.success && userResponseById.data) {
          fullUser = userResponseById.data as FullUserType;
        }
      } catch {
        // use fallback below
      }

      if (fullUser) {
        const primaryRoleId = fullUser.primary_role_id ?? fullUser.role_id;
        const resolvedRoleName =
          primaryRoleId != null ? mappedRoles[primaryRoleId]?.name : undefined;
        const fallbackRoleName = fullUser.role_name;
        setCurrentUserRole(resolvedRoleName ?? fallbackRoleName ?? "User");
      } else {
        setCurrentUserRole(
          user.role
            ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
            : t.sidebar.user.defaultRole,
        );
      }
    } catch {
      setCurrentUserRole(
        user?.role
          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
          : t.sidebar.user.defaultRole,
      );
    }
  }, [user, t.sidebar.user.defaultRole]);

  useEffect(() => {
    loadCurrentUserRole();
  }, [loadCurrentUserRole]);

  const handleSidebarLogout = async () => {
    try {
      await logout();
    } finally {
      onClose();
    }
  };

  const userDisplayName = user?.email || "User";

  const navigation: NavigationItem[] = useMemo(
    () => [
      {
        name: t.sidebar.navigation.dashboard,
        href: "/dashboard",
        icon: Home,
        type: "single",
      },
      {
        name: t.sidebar.navigation.campaignManagement,
        href: "/dashboard/campaigns",
        icon: TrendingUp,
        type: "parent",
        entity: "campaigns",
        children: [
          {
            name: t.sidebar.navigation.allCampaigns,
            href: "/dashboard/campaigns",
            icon: ListChecks,
            type: "single",
            entity: "campaigns",
          },
          {
            name: t.sidebar.navigation.campaignObjective,
            href: "/dashboard/campaign-objectives",
            icon: Target,
            type: "single",
            entity: "campaigns",
          },
          // {
          //   name: t.sidebar.navigation.programs,
          //   href: "/dashboard/programs",
          //   icon: GitBranch,
          //   type: "single",
          //   entity: "campaigns",
          // },
          {
            name: "Campaign Broadcasts",
            href: "/dashboard/campaign-broadcasts",
            icon: Send,
            type: "single",
            entity: "campaigns",
          },
          {
            name: t.sidebar.navigation.campaignCatalogs,
            href: "/dashboard/campaign-catalogs",
            icon: Archive,
            type: "single",
            entity: "campaigns",
          },
          {
            name: t.sidebar.navigation.campaignTypes,
            href: "/dashboard/campaign-types",
            icon: LayoutGrid,
            type: "single",
            entity: "campaigns",
          },
        ],
      },
      {
        name: t.sidebar.navigation.offerManagement,
        href: "/dashboard/offers",
        icon: Calendar,
        type: "parent",
        entity: "offers",
        children: [
          {
            name: t.sidebar.navigation.allOffers,
            href: "/dashboard/offers",
            icon: MessageSquare,
            type: "single",
            entity: "offers",
          },
          {
            name: t.sidebar.navigation.offerTypes,
            href: "/dashboard/offer-types",
            icon: Tag,
            type: "single",
            entity: "offers",
          },
          {
            name: t.sidebar.navigation.offerCatalogs,
            href: "/dashboard/offer-catalogs",
            icon: FolderOpen,
            type: "single",
            entity: "offers",
          },
        ],
      },
      {
        name: t.sidebar.navigation.productManagement,
        href: "/dashboard/products",
        icon: Box,
        type: "parent",
        entity: "products",
        children: [
          {
            name: t.sidebar.navigation.allProducts,
            href: "/dashboard/products",
            icon: Package,
            type: "single",
            entity: "products",
          },
          {
            name: t.sidebar.navigation.productTypes,
            href: "/dashboard/product-types",
            icon: Layers,
            type: "single",
            entity: "products",
          },
          {
            name: t.sidebar.navigation.productCatalogs,
            href: "/dashboard/products/catalogs",
            icon: FolderOpen,
            type: "single",
            entity: "products",
          },
        ],
      },
      {
        name: t.sidebar.navigation.segmentManagement,
        href: "/dashboard/segments",
        icon: Network,
        type: "parent",
        entity: "segments",
        children: [
          {
            name: t.sidebar.navigation.allSegments,
            href: "/dashboard/segments",
            icon: UsersRound,
            type: "single",
            entity: "segments",
          },
          {
            name: t.sidebar.navigation.segmentTypes,
            href: "/dashboard/segment-types",
            icon: Layers,
            type: "single",
            entity: "segments",
          },
          {
            name: t.sidebar.navigation.segmentCatalogs,
            href: "/dashboard/segment-catalogs",
            icon: FolderOpen,
            type: "single",
            entity: "segments",
          },
          {
            name: t.sidebar.navigation.quickLists,
            href: "/dashboard/quick-lists",
            icon: List,
            type: "single",
            entity: "quicklists",
          },
          {
            name: "VIP List",
            href: "/dashboard/vip-list-management",
            icon: Gift,
            type: "single",
            entity: "segments",
          },
          {
            name: "Seed List",
            href: "/dashboard/seed-list-management",
            icon: Zap,
            type: "single",
            entity: "segments",
          },
        ],
      },
      {
        name: t.sidebar.navigation.customer360Profile,
        href: "/dashboard/customers",
        icon: UserRound,
        type: "parent",
        entity: "customers",
        children: [
          {
            name: t.sidebar.navigation.customers,
            href: "/dashboard/customers",
            icon: UserRound,
            type: "single",
            entity: "customers",
          },
          {
            name: t.sidebar.navigation.customerIdentity,
            href: "/dashboard/customer-identity",
            icon: UserCog,
            type: "single",
            entity: "customers",
          },
          {
            name: t.sidebar.navigation.kpis,
            href: "/dashboard/kpis",
            icon: TrendingUp,
            type: "single",
            entity: "customers",
          },
        ],
      },
      {
        name: t.sidebar.navigation.reportsAndAnalytics,
        href: "/dashboard/reports",
        icon: LineChart,
        type: "parent",
        children: [
          {
            name: t.sidebar.navigation.overallDashboardPerformance,
            href: "/dashboard/reports/overview",
            icon: Activity,
            type: "single",
          },
          {
            name: t.sidebar.navigation.customerProfileReports,
            href: "/dashboard/reports/customer-profiles",
            icon: Users,
            type: "single",
          },
          {
            name: t.sidebar.navigation.campaignReports,
            href: "/dashboard/reports/campaigns",
            icon: Target,
            type: "single",
          },
          {
            name: t.sidebar.navigation.offerReports,
            href: "/dashboard/reports/offers",
            icon: Gift,
            type: "single",
          },
          {
            name: "Segment Reports",
            href: "/dashboard/reports/segments",
            icon: UsersRound,
            type: "single",
          },
          {
            name: t.sidebar.navigation.deliverySmsReports,
            href: "/dashboard/reports/delivery",
            icon: MessageSquare,
            type: "single",
          },
          {
            name: t.sidebar.navigation.deliveryEmailReports,
            href: "/dashboard/reports/email-delivery",
            icon: Mail,
            type: "single",
          },
        ],
      },
      {
        name: "Administration",
        href: "/dashboard/administration",
        icon: Settings,
        type: "single",
        entity: "configuration",
      },
      {
        name: "Configurations",
        href: "/dashboard/configuration",
        icon: Cog,
        type: "single",
        entity: "configuration",
      },
      {
        name: t.sidebar.navigation.manualBroadcasts,
        href: "/dashboard/manual-broadcasts",
        icon: Send,
        type: "single",
        entity: "campaigns",
      },
      {
        name: "Manual Actions",
        href: "/dashboard/manual-broadcasts",
        icon: Zap,
        type: "single",
        entity: "manual-actions",
      },

    ],
    [t],
  );

  const secondaryNavigation = [
    {
      name: "Documentation",
      href: "/documentation",
      icon: BookOpen,
      type: "single",
      entity: "users" as const,
    },
    {
      name: t.sidebar.secondary.myProfile,
      href: "/dashboard/profile",
      icon: User,
      type: "single",
      entity: "users" as const,
    },
    {
      name: t.sidebar.secondary.settings,
      href: "/dashboard/settings",
      icon: Settings,
      type: "single",
      entity: "settings" as const,
    },
  ];

  const getItemClasses = (isActive: boolean) => {
    return isActive
      ? `${tw.textAction} border-l-[2px] ${tw.borderDefault}/60  ${tw.rounded} font-bold`
      : `${tw.textAction}/90 hover:${tw.textAction} hover:${tw.surfaceBackground}/10 transition-all duration-200 font-normal`;
  };

  const getIconClasses = (isActive: boolean) => {
    if (isActive) {
      return `${tw.textAction}`;
    }
    return `${tw.textAction}/90 group-hover:${tw.textAction} transition-colors duration-200`;
  };

  const parentItemNames = navigation
    .filter((item) => item.type === "parent")
    .map((item) => (item.name || "").toLowerCase());

  const toggleExpanded = (itemName: string, exclusiveItems?: string[]) => {
    setExpandedItems((prev) => {
      if (prev.includes(itemName)) {
        const result = prev.filter((item) => item !== itemName);
        return result;
      }

      const filtered = exclusiveItems
        ? prev.filter((item) => !exclusiveItems.includes(item))
        : prev;

      const result = [...filtered, itemName];
      return result;
    });
  };

  const isItemActive = (item: NavigationItem) => {
    if (item.type === "parent") {
      return (
        item.children?.some(
          (child: NavigationItem) => location.pathname === child.href,
        ) || location.pathname === item.href
      );
    }
    return location.pathname === item.href;
  };

  // Entity permission mapping - consolidates all entity permission strings
  const entityPermissionMap: Record<string, string> = {
    campaigns: "campaigns.read",
    products: "products.read",
    offers: "offers.read",
    segments: "segments.read",
    quicklists: "quicklists.read",
    users: "users.read",
    analytics: "analytics.read",
    configuration: "system.admin",
    customers: "customer.read",
    servers: "servers.read",
    jobs: "jobs.read",
    "manual-actions": "manual-actions.read",
    settings: "system.admin",
  };

  // Get permission for an entity type
  const getEntityPermission = (entity?: string): string | null => {
    if (!entity) return null;
    return entityPermissionMap[entity] || null;
  };

  // Check if entity is a valid/recognized entity type
  const isValidEntity = (entity?: string): boolean => {
    if (!entity) return false;
    return entity in entityPermissionMap;
  };

  // Helper function to check if a pathname matches or is a sub-route of a href
  const isPathActive = useCallback(
    (pathname: string, href: string): boolean => {
      if (pathname === href) return true;
      if (pathname.startsWith(href + "/")) return true;
      return false;
    },
    [],
  );

  // Auto-expand parent items when a child is active
  useEffect(() => {
    // Only run if pathname actually changed
    if (previousPathnameRef.current === location.pathname) {
      return;
    }

    previousPathnameRef.current = location.pathname;

    const activeParentNames: string[] = [];

    navigation.forEach((item) => {
      if (item.type === "parent" && item.children) {
        // Check if the parent's own href matches (exact match or sub-route)
        const isParentActive = isPathActive(location.pathname, item.href);

        // Check if any direct child is active (exact match or sub-route)
        const hasActiveChild = item.children.some((child) =>
          isPathActive(location.pathname, child.href),
        );

        // Also check nested children (grandchildren)
        const hasActiveNestedChild = item.children.some((child) => {
          if (child.type === "parent" && child.children) {
            return child.children.some((grandchild) =>
              isPathActive(location.pathname, grandchild.href),
            );
          }
          return false;
        });

        if (isParentActive || hasActiveChild || hasActiveNestedChild) {
          activeParentNames.push((item.name || "").toLowerCase());

          // If a nested child is active, also expand the intermediate parent
          item.children.forEach((child) => {
            if (child.type === "parent" && child.children) {
              const hasActiveGrandchild = child.children.some((grandchild) =>
                isPathActive(location.pathname, grandchild.href),
              );
              if (hasActiveGrandchild) {
                activeParentNames.push(child.name.toLowerCase());
              }
            }
          });
        }
      }
    });

    // Merge auto-expanded (route-based) with manually expanded items
    setExpandedItems((prev) => {
      const merged = [...new Set([...prev, ...activeParentNames])];
      const prevSorted = [...prev].sort().join(",");
      const mergedSorted = [...merged].sort().join(",");

      // Only update if the arrays are different
      if (prevSorted !== mergedSorted) {
        return merged;
      }
      return prev;
    });
  }, [location.pathname, isPathActive, navigation]);

  const handleLinkClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const prefetchRoute = useCallback((pathname: string) => {
    const routeKey = resolvePrefetchRoute(pathname);
    const preload = SIDEBAR_ROUTE_PRELOADERS[routeKey];

    if (!preload || prefetchedRoutesRef.current.has(routeKey)) {
      return;
    }

    prefetchedRoutesRef.current.add(routeKey);
    preload().catch(() => {
      prefetchedRoutesRef.current.delete(routeKey);
    });
  }, []);

  const handleSidebarIntentPrefetch = useCallback(
    (event: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

      if (!anchor) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || !href.startsWith("/dashboard")) {
        return;
      }

      prefetchRoute(href);
    },
    [prefetchRoute],
  );

  return (
    <>
      <style>{hideScrollbarStyle}</style>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={onClose}
          />
          <div
            className="fixed inset-y-0 left-0 flex w-72 sm:w-80 flex-col shadow-xl transform transition-all duration-300 ease-out animate-in slide-in-from-left-4 fade-in"
            onMouseOver={handleSidebarIntentPrefetch}
            onFocusCapture={handleSidebarIntentPrefetch}
            style={{
              background: `linear-gradient(to bottom, var(--c-sidebar-top) 0%, var(--c-sidebar-middle) 70%, var(--c-sidebar-bottom) 100%)`,
            }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                <Link
                  to="/landingpage"
                  onClick={handleLinkClick}
                  className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                >
                  <img
                    src={logo}
                    alt={t.sidebar.logo.alt}
                    className="w-full h-full object-contain"
                  />
                </Link>
              </div>
              <button
                onClick={onClose}
                className={`${tw.rounded} p-2 text-white/70 hover:text-white hover:bg-white/10`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 hide-scrollbar">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;

                  const isActive = isItemActive(item);
                  const isExpanded = expandedItems.includes(
                    (item.name || "").toLowerCase(),
                  );

                  if (item.entity === "users") {
                    return (
                      <PermissionGate key={item.name} permission="users.read">
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "campaigns") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="campaigns.read"
                      >
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "segments") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="segments.read"
                      >
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "offers") {
                    return (
                      <PermissionGate key={item.name} permission="offers.read">
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() => {
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                );
                              }}
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "products") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="products.read"
                      >
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "customers") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="customer.read"
                      >
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "servers") {
                    return (
                      <PermissionGate key={item.name} permission="servers.read">
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "quicklists") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="quicklists.read"
                      >
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "jobs") {
                    return (
                      <PermissionGate key={item.name} permission="jobs.read">
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "configuration") {
                    return (
                      <PermissionGate key={item.name} permission="system.admin">
                        {item.type === "parent" ? (
                          <div>
                            <button
                              onClick={() =>
                                toggleExpanded(
                                  (item.name || "").toLowerCase(),
                                  parentItemNames,
                                )
                              }
                              className={`group w-full flex items-center justify-between ${
                                tw.rounded
                              } p-3 text-sm transition-all duration-300 ease-out ${getItemClasses(
                                isExpanded,
                              )}`}
                            >
                              <div className="flex items-center gap-x-3">
                                <Icon
                                  className={`h-5 w-5 shrink-0 ${getIconClasses(
                                    isActive || isExpanded,
                                  )}`}
                                />
                                {item.name}
                              </div>
                              {isExpanded ? (
                                <ChevronDown className={`h-4 w-4 ${tw.textAction}/70`} />
                              ) : (
                                <ChevronRight className={`h-4 w-4 ${tw.textAction}/70`} />
                              )}
                            </button>

                            <div
                              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                isExpanded
                                  ? "max-h-[1000px] opacity-100"
                                  : "max-h-0 opacity-0"
                              }`}
                            >
                              <div className="mt-2 ml-7 space-y-2">
                                {item.children?.map((child) => {
                                  const ChildIcon = child.icon;
                                  const isChildActive =
                                    location.pathname === child.href;

                                  return (
                                    <Link
                                      key={child.name}
                                      to={child.href}
                                      onClick={handleLinkClick}
                                      className={`group flex items-center gap-x-3 ${
                                        tw.rounded
                                      } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                    >
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </Link>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        )}
                      </PermissionGate>
                    );
                  }

                  if (item.entity === "manual-actions") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="manual-actions.read"
                      >
                        {item.type === "single" ? (
                          <Link
                            to={item.href}
                            onClick={handleLinkClick}
                            className={`group flex items-center gap-x-3 ${
                              tw.rounded
                            } p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                          >
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            {item.name}
                          </Link>
                        ) : null}
                      </PermissionGate>
                    );
                  }

                  // if (item.entity === "analytics") {
                  //   return (
                  //     <PermissionGate key={item.name} permission="analytics.read">
                  //       {/* Analytics sections */}
                  //     </PermissionGate>
                  //   );
                  // }

                  return (
                    <div key={item.name}>
                      <button
                        onClick={() =>
                          toggleExpanded(
                            (item.name || "").toLowerCase(),
                            parentItemNames,
                          )
                        }
                        className={`group w-full flex items-center justify-between ${
                          tw.rounded
                        } p-3 text-sm transition-all duration-300 ease-out ${
                          !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                        } ${getItemClasses(isActive)}`}
                      >
                        <div className="flex items-center gap-x-3">
                          <Icon
                            className={`h-5 w-5 shrink-0 ${getIconClasses(
                              isActive,
                            )}`}
                          />
                          {item.name}
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </button>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded
                            ? "max-h-[1000px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="mt-2 ml-7 space-y-2">
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive =
                              location.pathname === child.href;

                            // Check if child has its own children (nested dropdown)
                            if (child.type === "parent" && child.children) {
                              const isChildExpanded = expandedItems.includes(
                                child.name.toLowerCase(),
                              );
                              return (
                                <div key={child.name}>
                                  <button
                                    onClick={() =>
                                      toggleExpanded(child.name.toLowerCase())
                                    }
                                    className={`group w-full flex items-center justify-between ${
                                      tw.rounded
                                    } p-2.5 text-sm transition-all duration-200 ${
                                      isChildActive
                                        ? getItemClasses(isChildActive)
                                        : getItemClasses(false)
                                    }`}
                                  >
                                    <div className="flex items-center gap-x-3">
                                      <ChildIcon
                                        className={`h-4 w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      {child.name}
                                    </div>
                                    {isChildExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-gray-400" />
                                    )}
                                  </button>

                                  {isChildExpanded && (
                                    <div className="mt-2 ml-7 space-y-2">
                                      {child.children?.map((grandchild) => {
                                        const GrandchildIcon = grandchild.icon;
                                        const isGrandchildActive =
                                          location.pathname === grandchild.href;
                                        return (
                                          <Link
                                            key={grandchild.name}
                                            to={grandchild.href}
                                            onClick={handleLinkClick}
                                            className={`group flex items-center gap-x-3 ${
                                              tw.rounded
                                            } p-2.5 text-sm transition-all duration-200 ${
                                              isGrandchildActive
                                                ? getItemClasses(
                                                    isGrandchildActive,
                                                  )
                                                : getItemClasses(false)
                                            }`}
                                          >
                                            <GrandchildIcon
                                              className={`h-4 w-4 shrink-0 ${getIconClasses(
                                                isGrandchildActive,
                                              )}`}
                                            />
                                            {grandchild.name}
                                          </Link>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }

                            // Regular child item (no nested children)
                            return (
                              <Link
                                key={child.name}
                                to={child.href}
                                onClick={handleLinkClick}
                                className={`group flex items-center gap-x-3 ${
                                  tw.rounded
                                } p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                  isChildActive,
                                )}`}
                              >
                                <ChildIcon
                                  className={`h-4 w-4 shrink-0 ${getIconClasses(
                                    isChildActive,
                                  )}`}
                                />
                                {child.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </nav>
              <div className="mt-6 space-y-2">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  if (item.entity === "settings") {
                    return (
                      <PermissionGate
                        key={item.name}
                        permission="system.settings.manage"
                      >
                        <Link
                          to={item.href}
                          onClick={handleLinkClick}
                          className={`group flex items-center gap-x-3 ${
                            tw.rounded
                          } p-3 text-sm transition-all duration-300 ease-out ${
                            !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                          } ${getItemClasses(isActive)}`}
                        >
                          <Icon
                            className={`h-5 w-5 shrink-0 ${getIconClasses(
                              isActive,
                            )}`}
                          />
                          {item.name}
                        </Link>
                      </PermissionGate>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={handleLinkClick}
                      className={`group flex items-center gap-x-3 ${
                        tw.rounded
                      } p-3 text-sm transition-all duration-300 ease-out ${
                        !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                      } ${getItemClasses(isActive)}`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${getIconClasses(
                          isActive,
                        )}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={`px-6 pb-6 pt-4 border-t ${tw.borderDefault}/10`}>
              <div className="flex items-center gap-x-3">
                <div className="w-12 h-12 rounded-full ${tw.surfaceBackground}/10 flex items-center justify-center">
                  <User className={`w-5 h-5 `} />
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold  truncate`}>
                    {userDisplayName}
                  </p>
                  <p className={`text-xs tracking-wide /70 truncate`}>
                    {currentUserRole}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSidebarLogout}
                className={`mt-4 inline-flex w-full items-center justify-center gap-x-2 ${tw.rounded} border ${tw.borderDefault}/20 px-3 py-2 text-sm ${tw.textAction}/80 hover:${tw.textAction} hover:${tw.surfaceBackground}/10 transition-colors`}
              >
                <LogOut className="h-4 w-4" />
                {t.sidebar.user.signOut}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Minimized on md/lg, Full on xl */}
      <div
        className={`hidden md:fixed md:inset-y-0 md:z-50 md:flex md:flex-col transition-all duration-300 ${isMinimized ? "md:w-24 xl:w-24" : "md:w-32 xl:w-80"}`}
        onMouseOver={handleSidebarIntentPrefetch}
        onFocusCapture={handleSidebarIntentPrefetch}
      >
        <div
          className="flex flex-col h-screen md:px-3 xl:px-6 md:pt-2 xl:pt-0 pb-6"
          style={{
            background: `linear-gradient(to bottom, var(--c-sidebar-top) 0%, var(--c-sidebar-middle) 70%, var(--c-sidebar-bottom) 100%)`,
            borderRight: 'var(--c-sidebar-border, none)',
          }}
        >
          <div className="md:h-0 xl:h-16 md:hidden xl:flex items-center flex-shrink-0 xl:justify-between xl:px-5">
            <Link
              to="/landingpage"
              onClick={handleLinkClick}
              className="w-28 h-28 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={logo}
                alt={t.sidebar.logo.alt}
                className="w-full h-full object-contain"
              />
            </Link>
            <button
              onClick={handleMinimizeToggle}
              className={`hidden xl:flex items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-all duration-300 ${isMinimized ? "-ml-2" : ""}`}
              title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
            >
              {isMinimized ? (
                <ChevronRight className={`h-5 w-5 ${tw.textAction}/70 hover:`} />
              ) : (
                <ChevronLeft className={`h-5 w-5 ${tw.textAction}/70 hover:`} />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto md:py-2 xl:py-4 hide-scrollbar">
            <ul
              className={`md:space-y-6 ${isMinimized ? "xl:space-y-4" : "xl:space-y-3"}`}
            >
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);
                const isExpanded = expandedItems.includes(
                  (item.name || "").toLowerCase(),
                );

                if (item.entity === "users") {
                  return (
                    <PermissionGate key={item.name} permission="users.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : null}
                    </PermissionGate>
                  );
                }

                if (item.entity === "campaigns") {
                  return (
                    <PermissionGate key={item.name} permission="campaigns.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : null}
                    </PermissionGate>
                  );
                }

                if (item.entity === "segments") {
                  return (
                    <PermissionGate key={item.name} permission="segments.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : null}
                    </PermissionGate>
                  );
                }

                if (item.entity === "offers") {
                  return (
                    <PermissionGate key={item.name} permission="offers.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                if (item.entity === "products") {
                  return (
                    <PermissionGate key={item.name} permission="products.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                // Customers
                if (item.entity === "customers") {
                  return (
                    <PermissionGate key={item.name} permission="customer.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                // Servers
                if (item.entity === "servers") {
                  return (
                    <PermissionGate key={item.name} permission="servers.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                // Quicklists
                if (item.entity === "quicklists") {
                  return (
                    <PermissionGate
                      key={item.name}
                      permission="quicklists.read"
                    >
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                // Jobs
                if (item.entity === "jobs") {
                  return (
                    <PermissionGate key={item.name} permission="jobs.read">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                // Configuration
                if (item.entity === "configuration") {
                  return (
                    <PermissionGate key={item.name} permission="system.admin">
                      {item.type === "parent" ? (
                        <li
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <button
                            onClick={() =>
                              toggleExpanded(
                                (item.name || "").toLowerCase(),
                                parentItemNames,
                              )
                            }
                            className={`group w-full flex items-center ${
                              isMinimized
                                ? "md:justify-center xl:justify-center"
                                : "md:justify-center xl:justify-between"
                            } ${
                              tw.rounded
                            } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                              !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${getItemClasses(isExpanded)}`}
                            title={item.name}
                          >
                            <div className="flex items-center gap-x-3">
                              <Icon
                                className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                  isActive || isExpanded,
                                )}`}
                              />
                              <span
                                className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                              >
                                {item.name}
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            ) : (
                              <ChevronRight
                                className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                              />
                            )}
                          </button>

                          {isExpanded && (
                            <ul
                              className={`mt-2 md:space-y-2 xl:space-y-2 md:ml-0 ${isMinimized ? "" : "xl:ml-7"}`}
                            >
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  location.pathname === child.href;
                                return (
                                  <li
                                    key={child.name}
                                    className="relative group"
                                  >
                                    <Link
                                      to={child.href}
                                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                                        tw.rounded
                                      } md:pl-0 md:pr-0 md:py-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                                        isChildActive,
                                      )}`}
                                      title={child.name}
                                    >
                                      <ChildIcon
                                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span
                                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                      >
                                        {child.name}
                                      </span>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </li>
                      ) : (
                        <li
                          key={item.name}
                          className="relative group"
                          style={{
                            animation: `slideInFromLeft 0.8s ease-out ${
                              index * 0.1
                            }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                          }}
                        >
                          <Link
                            to={item.href}
                            className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                              tw.rounded
                            } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                              isActive,
                            )}`}
                            title={item.name}
                          >
                            <Icon
                              className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                                isActive,
                              )}`}
                            />
                            <span
                              className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                            >
                              {item.name}
                            </span>
                          </Link>
                        </li>
                      )}
                    </PermissionGate>
                  );
                }

                // if (item.entity === "manual-actions") {
                //   return (
                //     <PermissionGate key={item.name} permission="manual-actions.read">
                //       {item.type === "single" ? (
                //         <li
                //           key={item.name}
                //           className="relative group"
                //           style={{
                //             animation: `slideInFromLeft 0.8s ease-out ${
                //               index * 0.1
                //             }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                //           }}
                //         >
                //           <Link
                //             to={item.href}
                //             className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                //               tw.rounded
                //             } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                //               isActive,
                //             )}`}
                //             title={item.name}
                //           >
                //             <Icon
                //               className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                //                 isActive,
                //               )}`}
                //             />
                //             <span
                //               className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                //             >
                //               {item.name}
                //             </span>
                //           </Link>
                //         </li>
                //       ) : null}
                //     </PermissionGate>
                //   );
                // }

                // if (item.entity === "analytics") {
                //   return (
                //     <PermissionGate key={item.name} permission="analytics.read">
                //       {/* Analytics sections nested here */}
                //     </PermissionGate>
                //   );
                // }

                if (item.type === "parent") {
                  const itemLowerName = (item.name || "").toLowerCase();
                  const isExpanded = expandedItems.includes(itemLowerName);

                  return (
                    <li
                      key={item.name}
                      className="relative group"
                      style={{
                        animation: `slideInFromLeft 0.8s ease-out ${
                          index * 0.1
                        }s both, fadeIn 1s ease-out ${index * 0.1}s both`,
                      }}
                    >
                      <button
                        onClick={() =>
                          toggleExpanded(
                            (item.name || "").toLowerCase(),
                            parentItemNames,
                          )
                        }
                        className={`group w-full flex items-center ${
                          isMinimized
                            ? "md:justify-center xl:justify-center"
                            : "md:justify-center xl:justify-between"
                        } ${
                          tw.rounded
                        } md:p-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                          !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                        } ${getItemClasses(isActive)}`}
                        title={item.name}
                      >
                        <div className="flex items-center gap-x-3">
                          <Icon
                            className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                              isActive,
                            )}`}
                          />
                          <span
                            className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                          >
                            {item.name}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown
                            className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                          />
                        ) : (
                          <ChevronRight
                            className={`h-4 w-4 text-gray-400 ${isMinimized ? "hidden" : "hidden xl:block"}`}
                          />
                        )}
                      </button>

                      {/* Tooltip for minimized sidebar */}
                      <div
                        className={`md:block ${isMinimized ? "xl:block" : "xl:hidden"} absolute left-full ml-4 px-3 py-2 ${tw.textAction} text-xs font-medium ${tw.rounded} whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none shadow-xl`}
                        style={{
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: zIndex.popover,
                        }}
                      >
                        {item.name}
                        <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                      </div>

                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded
                            ? "max-h-[1000px] opacity-100"
                            : "max-h-0 opacity-0"
                        }`}
                      >
                        <ul
                          className={`${isMinimized ? "flex flex-col mt-2 md:space-y-5 xl:space-y-5" : "mt-2 md:ml-0 xl:ml-6 md:space-y-4 xl:space-y-2"}`}
                        >
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive =
                              location.pathname === child.href;
                            // Check if child has its own children (nested dropdown)
                            if (child.type === "parent" && child.children) {
                              const isChildExpanded = expandedItems.includes(
                                child.name.toLowerCase(),
                              );
                              return (
                                <li key={child.name} className="relative group">
                                  <button
                                    onClick={() =>
                                      toggleExpanded(child.name.toLowerCase())
                                    }
                                    className={`group w-full flex items-center md:justify-center xl:justify-between ${
                                      tw.rounded
                                    } md:p-2.5 xl:p-2.5 text-sm transition-all duration-200 ${
                                      isChildActive
                                        ? getItemClasses(isChildActive)
                                        : getItemClasses(false)
                                    }`}
                                    title={child.name}
                                  >
                                    <div className="flex items-center gap-x-3">
                                      <ChildIcon
                                        className={`md:h-5 md:w-5 xl:h-4 xl:w-4 shrink-0 ${getIconClasses(
                                          isChildActive,
                                        )}`}
                                      />
                                      <span className="hidden xl:block">
                                        {child.name}
                                      </span>
                                    </div>
                                    {isChildExpanded ? (
                                      <ChevronDown className="h-3 w-3 text-gray-400 hidden xl:block" />
                                    ) : (
                                      <ChevronRight className="h-3 w-3 text-gray-400 hidden xl:block" />
                                    )}
                                  </button>

                                  {/* Tooltip for child */}
                                  <div
                                    className={`md:block ${isMinimized ? "xl:block" : "xl:hidden"} absolute left-full ml-4 px-3 py-2 ${tw.textAction} text-xs font-medium ${tw.rounded} whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none shadow-xl`}
                                    style={{
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      zIndex: zIndex.popover,
                                    }}
                                  >
                                    {child.name}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                                  </div>

                                  {isChildExpanded && (
                                    <ul
                                      className={`${isMinimized ? "flex flex-col mt-2 md:space-y-5 xl:space-y-5" : "mt-2 md:ml-0 xl:ml-6 md:space-y-4 xl:space-y-2"}`}
                                    >
                                      {child.children?.map(
                                        (grandchild, gcIndex) => {
                                          const GrandchildIcon =
                                            grandchild.icon;
                                          const isGrandchildActive =
                                            location.pathname ===
                                            grandchild.href;
                                          const isLastGrandchild =
                                            gcIndex ===
                                            child.children!.length - 1;
                                          return (
                                            <li
                                              key={grandchild.name}
                                              className="relative group"
                                            >
                                              <Link
                                                to={grandchild.href}
                                                onClick={handleLinkClick}
                                                className={`group flex items-center ${isMinimized ? "gap-x-2 px-3 py-2" : "md:justify-center xl:justify-start gap-x-3 md:p-2.5 xl:p-2.5"} ${
                                                  tw.rounded
                                                } text-sm transition-all duration-200 ${getItemClasses(
                                                  isGrandchildActive,
                                                )} ${isMinimized && isLastGrandchild ? `border-b ${tw.borderDefault}/20` : ""}`}
                                                title={grandchild.name}
                                              >
                                                <GrandchildIcon
                                                  className={`${isMinimized ? "h-4 w-4" : "md:h-5 md:w-5 xl:h-4 xl:w-4"} shrink-0 ${getIconClasses(
                                                    isGrandchildActive,
                                                  )}`}
                                                />
                                                <span
                                                  className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                                >
                                                  {grandchild.name}
                                                </span>
                                              </Link>

                                              {/* Tooltip for grandchild */}
                                              <div
                                                className={`md:block ${isMinimized ? "xl:block" : "xl:hidden"} absolute left-full ml-4 px-3 py-2 ${tw.textAction} text-xs font-medium ${tw.rounded} whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none shadow-xl`}
                                                style={{
                                                  top: "50%",
                                                  transform: "translateY(-50%)",
                                                  zIndex: zIndex.popover,
                                                }}
                                              >
                                                {grandchild.name}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                                              </div>
                                            </li>
                                          );
                                        },
                                      )}
                                    </ul>
                                  )}
                                </li>
                              );
                            }

                            // Regular child item (no nested children)
                            const isLastChild =
                              item.children &&
                              index === item.children.length - 1;
                            return (
                              <li key={child.name} className="relative group">
                                <Link
                                  to={child.href}
                                  onClick={handleLinkClick}
                                  className={`group flex items-center ${isMinimized ? "gap-x-2 px-3 py-2" : "md:justify-center xl:justify-start gap-x-3 md:p-2.5 xl:p-2.5"} ${
                                    tw.rounded
                                  } text-sm transition-all duration-200 ${
                                    isChildActive
                                      ? getItemClasses(isChildActive)
                                      : getItemClasses(false)
                                  } ${isMinimized && isLastChild ? `border-b ${tw.borderDefault}/20` : ""}`}
                                  title={child.name}
                                >
                                  <ChildIcon
                                    className={`${isMinimized ? "h-4 w-4" : "md:h-5 md:w-5 xl:h-4 xl:w-4"} shrink-0 ${getIconClasses(
                                      isChildActive,
                                    )}`}
                                  />
                                  <span
                                    className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                                  >
                                    {child.name}
                                  </span>
                                </Link>

                                {/* Tooltip for child */}
                                <div
                                  className={`md:block ${isMinimized ? "xl:block" : "xl:hidden"} absolute left-full ml-4 px-3 py-2 ${tw.textAction} text-sm font-medium ${tw.rounded} whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl`}
                                  style={{
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: zIndex.popover,
                                  }}
                                >
                                  {child.name}
                                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                }

                return (
                  <li
                    key={item.name}
                    className="relative group"
                    style={{
                      animation: `slideInFromLeft 0.6s ease-out ${
                        index * 0.1
                      }s both`,
                    }}
                  >
                    <Link
                      to={item.href}
                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                        tw.rounded
                      } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                        isActive,
                      )}`}
                      title={item.name}
                    >
                      <Icon
                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                          isActive,
                        )}`}
                      />
                      <span
                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                      >
                        {item.name}
                      </span>
                    </Link>

                    {/* Tooltip for minimized sidebar */}
                    <div
                      className={`md:block ${isMinimized ? "xl:block" : "xl:hidden"} absolute left-full ml-4 px-3 py-2 ${tw.textAction} text-sm font-medium ${tw.rounded} whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl`}
                      style={{
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: zIndex.popover,
                      }}
                    >
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="pt-6 flex-shrink-0">
            <ul className="md:space-y-1 xl:space-y-1">
              {secondaryNavigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li
                    key={item.name}
                    className="relative group"
                    style={{
                      animation: `slideInFromLeft 0.6s ease-out ${
                        index * 0.1
                      }s both`,
                    }}
                  >
                    <Link
                      to={item.href}
                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 ${
                        tw.rounded
                      } md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                        isActive,
                      )}`}
                      title={item.name}
                      onClick={() => onClose()}
                    >
                      <Icon
                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                          isActive,
                        )}`}
                      />
                      <span
                        className={`${isMinimized ? "hidden" : "hidden xl:block"}`}
                      >
                        {item.name}
                      </span>
                    </Link>

                    {/* Tooltip for minimized sidebar */}
                    <div
                      className={`md:block ${isMinimized ? "xl:block" : "xl:hidden"} absolute left-full ml-4 px-3 py-2 ${tw.textAction} text-sm font-medium ${tw.rounded} whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl`}
                      style={{
                        top: "50%",
                        transform: "translateY(-50%)",
                        zIndex: 99999,
                      }}
                    >
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
