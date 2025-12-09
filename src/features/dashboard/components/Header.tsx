import { User, LogOut, Menu } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import logo from "../../../assets/Effortel_logo.svg";
import { User as UserType } from "../../../features/auth/types/auth";
import { color } from "../../../shared/utils/utils";
import { userService } from "../../users/services/userService";
import { roleService } from "../../roles/services/roleService";
import { Role } from "../../roles/types/role";
import { UserType as FullUserType } from "../../users/types/user";
import GlobalSearch from "../../../shared/components/GlobalSearch";
import NotificationDropdown from "../../../shared/components/NotificationDropdown";

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
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
        // fallback to auth context role below
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

  return (
    <header
      className="sticky top-0 z-[100] m-0 p-0"
      style={{
        backgroundColor: color.gradients.sidebar.top,
      }}
    >
      <div className="flex h-16 items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-x-3 flex-1">
          <button
            onClick={onMenuClick}
            className="md:hidden rounded-md p-2 text-white/90 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            <GlobalSearch />
          </div>
        </div>

        <div className="flex items-center gap-x-4">
          <NotificationDropdown />

          <div className="hidden md:flex items-center gap-x-3">
            <div className="flex items-center gap-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">
                  {user?.email || "User"}
                </div>
                <div className="text-xs font-medium leading-[140%] tracking-[0.05em] text-white/70">
                  {currentUserRole}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

interface GuestHeaderProps {
  isLoaded?: boolean;
  className?: string;
  onLogout?: () => void;
  showLogo?: boolean;
  showUserInfo?: boolean;
  variant?: "default" | "transparent" | "solid";
}

export function GuestHeader({
  isLoaded = true,
  className = "",
  onLogout,
  showLogo = true,
  showUserInfo = true,
  variant = "default",
}: GuestHeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      try {
        await logout();
      } catch {
        // Silently handle logout error
      }
    }
  };

  const getHeaderStyles = () => {
    const baseStyles = "relative z-10 transition-all duration-1000 ease-out";
    const loadedStyles = isLoaded
      ? "translate-y-0 opacity-100"
      : "-translate-y-4 opacity-0";

    switch (variant) {
      case "transparent":
        return `${baseStyles} ${loadedStyles} bg-transparent border-b border-white/10`;
      case "solid":
        return `${baseStyles} ${loadedStyles} bg-[#0a192f] border-b border-white/20`;
      case "default":
      default:
        return `${baseStyles} ${loadedStyles} bg-[#0a192f]/90 backdrop-blur-sm border-b border-white/10`;
    }
  };

  return (
    <header className={`${getHeaderStyles()} ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 lg:h-24">
          {showLogo && (
            <div className="flex items-center">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-36 lg:h-36 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate("/dashboard")}
              >
                <img
                  src={logo}
                  alt="Sentra Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {showUserInfo && (
            <div className="flex items-center space-x-4">
              <div className="text-sm text-white/80">
                {(user as UserType & { email?: string })?.email || "User"}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-white/80 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
