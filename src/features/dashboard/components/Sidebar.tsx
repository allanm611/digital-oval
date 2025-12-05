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
  BarChart3,
  Calendar,
  Zap,
  Folder,
  Briefcase,
  Flag,
  // Bell,
  List,
  Upload,
  Fingerprint,
  Activity,
  LineChart,
  Gift,
  Mail,
  LogOut,
  User,
  Server,
  Database,
  Link2,
} from "lucide-react";
import logo from "../../../assets/Effortel_logo.svg";
import { color } from "../../../shared/utils/utils";
import { useAuth } from "../../../contexts/AuthContext";
import { roleService } from "../../roles/services/roleService";
import { userService } from "../../users/services/userService";
import { Role } from "../../roles/types/role";
import { UserType as FullUserType } from "../../users/types/user";

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
    | "users"
    | "analytics"
    | "configuration"
    | "customers"
    | "servers";
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const previousPathnameRef = useRef<string>("");
  const { user, logout } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState<string>("User");

  const loadCurrentUserRole = useCallback(async () => {
    if (!user?.user_id) {
      setCurrentUserRole("User");
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
            : "User"
        );
      }
    } catch {
      setCurrentUserRole(
        user?.role
          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
          : "User"
      );
    }
  }, [user]);

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
        name: "Dashboard",
        href: "/dashboard",
        icon: Home,
        type: "single",
        entity: "campaigns",
      },
      {
        name: "Campaign Management",
        href: "/dashboard/campaigns",
        icon: BarChart3,
        type: "parent",
        entity: "campaigns",
        children: [
          {
            name: "All Campaigns",
            href: "/dashboard/campaigns",
            icon: Target,
            type: "single",
            entity: "campaigns",
          },
          {
            name: "Campaign Objective",
            href: "/dashboard/campaign-objectives",
            icon: Flag,
            type: "single",
            entity: "campaigns",
          },
          {
            name: "Programs",
            href: "/dashboard/programs",
            icon: Briefcase,
            type: "single",
            entity: "campaigns",
          },
          {
            name: "Campaign Catalogs",
            href: "/dashboard/campaign-catalogs",
            icon: Folder,
            type: "single",
            entity: "campaigns",
          },
          {
            name: "Campaign Types",
            href: "/dashboard/campaign-types",
            icon: Layers,
            type: "single",
            entity: "campaigns",
          },
        ],
      },
      {
        name: "Offer Management",
        href: "/dashboard/offers",
        icon: Calendar,
        type: "parent",
        entity: "offers",
        children: [
          {
            name: "All Offers",
            href: "/dashboard/offers",
            icon: MessageSquare,
            type: "single",
            entity: "offers",
          },
          {
            name: "Offer Types",
            href: "/dashboard/offer-types",
            icon: Tag,
            type: "single",
            entity: "offers",
          },
          {
            name: "Offer Catalogs",
            href: "/dashboard/offer-catalogs",
            icon: FolderOpen,
            type: "single",
            entity: "offers",
          },
        ],
      },
      {
        name: "Product Management",
        href: "/dashboard/products",
        icon: Zap,
        type: "parent",
        entity: "products",
        children: [
          {
            name: "All Products",
            href: "/dashboard/products",
            icon: Package,
            type: "single",
            entity: "products",
          },
          {
            name: "Product Types",
            href: "/dashboard/product-types",
            icon: Layers,
            type: "single",
            entity: "products",
          },
          {
            name: "Product Catalogs",
            href: "/dashboard/products/catalogs",
            icon: FolderOpen,
            type: "single",
            entity: "products",
          },
        ],
      },
      {
        name: "Segment Management",
        href: "/dashboard/segments",
        icon: Users,
        type: "parent",
        entity: "segments",
        children: [
          {
            name: "All Segments",
            href: "/dashboard/segments",
            icon: Users,
            type: "single",
            entity: "segments",
          },
          {
            name: "Segment Types",
            href: "/dashboard/segment-types",
            icon: Layers,
            type: "single",
            entity: "segments",
          },
          {
            name: "Segment Catalogs",
            href: "/dashboard/segment-catalogs",
            icon: FolderOpen,
            type: "single",
            entity: "segments",
          },
          {
            name: "Segment Lists",
            href: "/dashboard/segment-list",
            icon: List,
            type: "single",
            entity: "segments",
          },
        ],
      },
      {
        name: "Customer Management",
        href: "/dashboard/customers",
        icon: Users,
        type: "parent",
        entity: "customers",
        children: [
          {
            name: "Customers",
            href: "/dashboard/customers",
            icon: Users,
            type: "single",
            entity: "customers",
          },
          {
            name: "Customer Identity",
            href: "/dashboard/customer-identity",
            icon: Fingerprint,
            type: "single",
            entity: "customers",
          },
        ],
      },
      {
        name: "User Management",
        href: "/dashboard/user-management",
        icon: UserCheck,
        type: "parent",
        entity: "users",
        children: [
          {
            name: "All Users",
            href: "/dashboard/user-management",
            icon: Users,
            type: "single",
            entity: "users",
          },
          {
            name: "Team Roles",
            href: "/dashboard/team-roles",
            icon: UserCheck,
            type: "single",
            entity: "users",
          },
        ],
      },
      {
        name: "Reports & Analytics",
        href: "/dashboard/reports",
        icon: LineChart,
        type: "parent",
        entity: "analytics",
        children: [
          {
            name: "Overall Dashboard Performance",
            href: "/dashboard/reports/overview",
            icon: Activity,
            type: "single",
            entity: "analytics",
          },
          {
            name: "Customer Profile Reports",
            href: "/dashboard/reports/customer-profiles",
            icon: Users,
            type: "single",
            entity: "analytics",
          },
          {
            name: "Campaign Reports",
            href: "/dashboard/reports/campaigns",
            icon: Target,
            type: "single",
            entity: "analytics",
          },
          {
            name: "Offer Reports",
            href: "/dashboard/reports/offers",
            icon: Gift,
            type: "single",
            entity: "analytics",
          },
          {
            name: "Delivery & SMS Reports",
            href: "/dashboard/reports/delivery",
            icon: MessageSquare,
            type: "single",
            entity: "analytics",
          },
          {
            name: "Delivery & Email Reports",
            href: "/dashboard/reports/email-delivery",
            icon: Mail,
            type: "single",
            entity: "analytics",
          },
        ],
      },
      {
        name: "Infrastructure",
        href: "/dashboard/servers",
        icon: Server,
        type: "parent",
        entity: "servers",
        children: [
          {
            name: "Servers",
            href: "/dashboard/servers",
            icon: Server,
            type: "single",
            entity: "servers",
          },
          {
            name: "Connection Profiles",
            href: "/dashboard/connection-profiles",
            icon: Database,
            type: "single",
            entity: "servers",
          },
        ],
      },

      {
        name: "Job Management",
        href: "/dashboard/jobs",
        icon: Briefcase,
        type: "parent",
        entity: "campaigns",
        children: [
          {
            name: "Scheduled Jobs",
            href: "/dashboard/jobs",
            icon: Briefcase,
            type: "single",
            entity: "campaigns",
          },
          {
            name: "Job Types",
            href: "/dashboard/job-types",
            icon: Layers,
            type: "single",
            entity: "campaigns",
          },
          {
            name: "Job Dependencies",
            href: "/dashboard/job-dependencies",
            icon: Link2,
            type: "single",
            entity: "campaigns",
          },
        ],
      },
      {
        name: "Manual Broadcast",
        href: "/dashboard/quicklists",
        icon: Upload,
        type: "single",
        entity: "segments",
      },

      {
        name: "Configuration",
        href: "/dashboard/configuration",
        icon: Cog,
        type: "single",
        entity: "configuration",
      },
    ],
    []
  );

  const secondaryNavigation = [
    {
      name: "My Profile",
      href: "/dashboard/profile",
      icon: User,
      type: "single",
      entity: "users" as const,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      type: "single",
      entity: "configuration" as const,
    },
  ];

  const getItemClasses = (isActive: boolean) => {
    return isActive
      ? `text-white border-l-[2px] border-white/60  rounded-md font-bold`
      : `text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200 font-normal`;
  };

  const getIconClasses = (isActive: boolean) => {
    if (isActive) {
      return `text-white`;
    }
    return `text-white/90 group-hover:text-white transition-colors duration-200`;
  };

  const parentItemNames = navigation
    .filter((item) => item.type === "parent")
    .map((item) => item.name.toLowerCase());

  const toggleExpanded = (itemName: string, exclusiveItems?: string[]) => {
    setExpandedItems((prev) => {
      if (prev.includes(itemName)) {
        return prev.filter((item) => item !== itemName);
      }

      const filtered = exclusiveItems
        ? prev.filter((item) => !exclusiveItems.includes(item))
        : prev;

      return [...filtered, itemName];
    });
  };

  const isItemActive = (item: NavigationItem) => {
    if (item.type === "parent") {
      return (
        item.children?.some(
          (child: NavigationItem) => location.pathname === child.href
        ) || location.pathname === item.href
      );
    }
    return location.pathname === item.href;
  };

  // Helper function to check if a pathname matches or is a sub-route of a href
  const isPathActive = useCallback(
    (pathname: string, href: string): boolean => {
      if (pathname === href) return true;
      if (pathname.startsWith(href + "/")) return true;
      return false;
    },
    []
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
          isPathActive(location.pathname, child.href)
        );

        // Also check nested children (grandchildren)
        const hasActiveNestedChild = item.children.some((child) => {
          if (child.type === "parent" && child.children) {
            return child.children.some((grandchild) =>
              isPathActive(location.pathname, grandchild.href)
            );
          }
          return false;
        });

        if (isParentActive || hasActiveChild || hasActiveNestedChild) {
          activeParentNames.push(item.name.toLowerCase());

          // If a nested child is active, also expand the intermediate parent
          item.children.forEach((child) => {
            if (child.type === "parent" && child.children) {
              const hasActiveGrandchild = child.children.some((grandchild) =>
                isPathActive(location.pathname, grandchild.href)
              );
              if (hasActiveGrandchild) {
                activeParentNames.push(child.name.toLowerCase());
              }
            }
          });
        }
      }
    });

    // Only update if the expanded items actually changed
    setExpandedItems((prev) => {
      const newExpanded = [...new Set(activeParentNames)];
      const prevSorted = [...prev].sort().join(",");
      const newSorted = [...newExpanded].sort().join(",");

      // Only update if the arrays are different
      if (prevSorted !== newSorted) {
        return newExpanded;
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
            style={{
              background: `linear-gradient(to bottom, ${color.gradients.sidebar.top} 0%, ${color.gradients.sidebar.middle} 70%, ${color.gradients.sidebar.bottom} 100%)`,
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
                    alt="Sentra Logo"
                    className="w-full h-full object-contain"
                  />
                </Link>
              </div>
              <button
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                    item.name.toLowerCase()
                  );

                  if (item.type === "parent") {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() =>
                            toggleExpanded(
                              item.name.toLowerCase(),
                              parentItemNames
                            )
                          }
                          className={`group w-full flex items-center justify-between rounded-md p-3 text-sm transition-all duration-300 ease-out ${
                            !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                          } ${getItemClasses(isActive)}`}
                        >
                          <div className="flex items-center gap-x-3">
                            <Icon
                              className={`h-5 w-5 shrink-0 ${getIconClasses(
                                isActive
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
                          <div className="mt-2 ml-6 space-y-2">
                            {item.children?.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildActive =
                                location.pathname === child.href;

                              // Check if child has its own children (nested dropdown)
                              if (child.type === "parent" && child.children) {
                                const isChildExpanded = expandedItems.includes(
                                  child.name.toLowerCase()
                                );
                                return (
                                  <div key={child.name}>
                                    <button
                                      onClick={() =>
                                        toggleExpanded(child.name.toLowerCase())
                                      }
                                      className={`group w-full flex items-center justify-between rounded-md p-2.5 text-sm transition-all duration-200 ${
                                        isChildActive
                                          ? getItemClasses(isChildActive)
                                          : getItemClasses(false)
                                      }`}
                                    >
                                      <div className="flex items-center gap-x-3">
                                        <ChildIcon
                                          className={`h-4 w-4 shrink-0 ${getIconClasses(
                                            isChildActive
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
                                      <div className="mt-2 ml-6 space-y-2">
                                        {child.children?.map((grandchild) => {
                                          const GrandchildIcon =
                                            grandchild.icon;
                                          const isGrandchildActive =
                                            location.pathname ===
                                            grandchild.href;
                                          return (
                                            <Link
                                              key={grandchild.name}
                                              to={grandchild.href}
                                              onClick={handleLinkClick}
                                              className={`group flex items-center gap-x-3 rounded-md p-2.5 text-sm transition-all duration-200 ${
                                                isGrandchildActive
                                                  ? getItemClasses(
                                                      isGrandchildActive
                                                    )
                                                  : getItemClasses(false)
                                              }`}
                                            >
                                              <GrandchildIcon
                                                className={`h-4 w-4 shrink-0 ${getIconClasses(
                                                  isGrandchildActive
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
                                  className={`group flex items-center gap-x-3 rounded-md p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                    isChildActive
                                  )}`}
                                >
                                  <ChildIcon
                                    className={`h-4 w-4 shrink-0 ${getIconClasses(
                                      isChildActive
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
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={handleLinkClick}
                      className={`group flex items-center gap-x-3 rounded-md p-3 text-sm transition-all duration-300 ease-out ${
                        !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                      } ${getItemClasses(isActive)}`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${getIconClasses(
                          isActive
                        )}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 space-y-2">
                {secondaryNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={handleLinkClick}
                      className={`group flex items-center gap-x-3 rounded-md p-3 text-sm transition-all duration-300 ease-out ${
                        !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                      } ${getItemClasses(isActive)}`}
                    >
                      <Icon
                        className={`h-5 w-5 shrink-0 ${getIconClasses(
                          isActive
                        )}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-x-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {userDisplayName}
                  </p>
                  <p className="text-xs tracking-wide text-white/70 truncate">
                    {currentUserRole}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSidebarLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-x-2 rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Minimized on md/lg, Full on xl */}
      <div className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:w-32 xl:w-80 md:flex-col">
        <div
          className="flex flex-col h-screen md:px-3 xl:px-6 md:pt-2 xl:pt-4 pb-6"
          style={{
            background: `linear-gradient(to bottom, ${color.gradients.sidebar.top} 0%, ${color.gradients.sidebar.middle} 70%, ${color.gradients.sidebar.bottom} 100%)`,
          }}
        >
          <div className="md:h-0 xl:h-16 md:hidden xl:flex items-center flex-shrink-0 xl:justify-start xl:pt-0">
            <Link
              to="/landingpage"
              onClick={handleLinkClick}
              className="w-32 h-32 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
            >
              <img
                src={logo}
                alt="Sentra Logo"
                className="w-full h-full object-contain"
              />
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto md:py-2 xl:py-4 hide-scrollbar">
            <ul className="md:space-y-6 xl:space-y-3">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                const isActive = isItemActive(item);
                const isExpanded = expandedItems.includes(
                  item.name.toLowerCase()
                );

                if (item.type === "parent") {
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
                            item.name.toLowerCase(),
                            parentItemNames
                          )
                        }
                        className={`group w-full flex items-center md:justify-center xl:justify-between rounded-md md:p-3 xl:p-3 text-sm transition-all duration-300 ease-out ${
                          !isActive ? "hover:scale-105 hover:shadow-lg" : ""
                        } ${getItemClasses(isActive)}`}
                        title={item.name}
                      >
                        <div className="flex items-center gap-x-3">
                          <Icon
                            className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                              isActive
                            )}`}
                          />
                          <span className="hidden xl:block">{item.name}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-400 hidden xl:block" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400 hidden xl:block" />
                        )}
                      </button>

                      {/* Tooltip for minimized sidebar */}
                      <div
                        className="md:block xl:hidden absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none shadow-xl"
                        style={{
                          top: "50%",
                          transform: "translateY(-50%)",
                          zIndex: 99999,
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
                        <ul className="mt-2 md:ml-0 xl:ml-6 md:space-y-4 xl:space-y-2">
                          {item.children?.map((child) => {
                            const ChildIcon = child.icon;
                            const isChildActive =
                              location.pathname === child.href;
                            // Check if child has its own children (nested dropdown)
                            if (child.type === "parent" && child.children) {
                              const isChildExpanded = expandedItems.includes(
                                child.name.toLowerCase()
                              );
                              return (
                                <li key={child.name} className="relative group">
                                  <button
                                    onClick={() =>
                                      toggleExpanded(child.name.toLowerCase())
                                    }
                                    className={`group w-full flex items-center md:justify-center xl:justify-between rounded-md md:p-2.5 xl:p-2.5 text-sm transition-all duration-200 ${
                                      isChildActive
                                        ? getItemClasses(isChildActive)
                                        : getItemClasses(false)
                                    }`}
                                    title={child.name}
                                  >
                                    <div className="flex items-center gap-x-3">
                                      <ChildIcon
                                        className={`md:h-5 md:w-5 xl:h-4 xl:w-4 shrink-0 ${getIconClasses(
                                          isChildActive
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
                                    className="md:block xl:hidden absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none shadow-xl"
                                    style={{
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      zIndex: 99999,
                                    }}
                                  >
                                    {child.name}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                                  </div>

                                  {isChildExpanded && (
                                    <ul className="mt-2 md:ml-0 xl:ml-6 md:space-y-4 xl:space-y-2">
                                      {child.children?.map((grandchild) => {
                                        const GrandchildIcon = grandchild.icon;
                                        const isGrandchildActive =
                                          location.pathname === grandchild.href;
                                        return (
                                          <li
                                            key={grandchild.name}
                                            className="relative group"
                                          >
                                            <Link
                                              to={grandchild.href}
                                              onClick={handleLinkClick}
                                              className={`group flex items-center md:justify-center xl:justify-start gap-x-3 rounded-md md:p-2.5 xl:p-2.5 text-sm transition-all duration-200 ${getItemClasses(
                                                isGrandchildActive
                                              )}`}
                                              title={grandchild.name}
                                            >
                                              <GrandchildIcon
                                                className={`md:h-5 md:w-5 xl:h-4 xl:w-4 shrink-0 ${getIconClasses(
                                                  isGrandchildActive
                                                )}`}
                                              />
                                              <span className="hidden xl:block">
                                                {grandchild.name}
                                              </span>
                                            </Link>

                                            {/* Tooltip for grandchild */}
                                            <div
                                              className="md:block xl:hidden absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none shadow-xl"
                                              style={{
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                zIndex: 99999,
                                              }}
                                            >
                                              {grandchild.name}
                                              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[6px] border-r-gray-900"></div>
                                            </div>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                </li>
                              );
                            }

                            // Regular child item (no nested children)
                            return (
                              <li key={child.name} className="relative group">
                                <Link
                                  to={child.href}
                                  onClick={handleLinkClick}
                                  className={`group flex items-center md:justify-center xl:justify-start gap-x-3 rounded-md md:p-2.5 xl:p-2.5 text-sm transition-all duration-200 ${
                                    isChildActive
                                      ? getItemClasses(isChildActive)
                                      : getItemClasses(false)
                                  }`}
                                  title={child.name}
                                >
                                  <ChildIcon
                                    className={`md:h-5 md:w-5 xl:h-4 xl:w-4 shrink-0 ${getIconClasses(
                                      isChildActive
                                    )}`}
                                  />
                                  <span className="hidden xl:block">
                                    {child.name}
                                  </span>
                                </Link>

                                {/* Tooltip for child */}
                                <div
                                  className="md:block xl:hidden absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl"
                                  style={{
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    zIndex: 99999,
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
                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 rounded-md md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                        isActive
                      )}`}
                      title={item.name}
                    >
                      <Icon
                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                          isActive
                        )}`}
                      />
                      <span className="hidden xl:block">{item.name}</span>
                    </Link>

                    {/* Tooltip for minimized sidebar */}
                    <div
                      className="md:block xl:hidden absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl"
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
                      className={`group flex items-center md:justify-center xl:justify-start gap-x-3 rounded-md md:p-3 xl:p-3 text-sm transition-all duration-200 ${getItemClasses(
                        isActive
                      )}`}
                      title={item.name}
                      onClick={() => onClose()}
                    >
                      <Icon
                        className={`md:h-6 md:w-6 xl:h-5 xl:w-5 shrink-0 ${getIconClasses(
                          isActive
                        )}`}
                      />
                      <span className="hidden xl:block">{item.name}</span>
                    </Link>

                    {/* Tooltip for minimized sidebar */}
                    <div
                      className="md:block xl:hidden absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl"
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
