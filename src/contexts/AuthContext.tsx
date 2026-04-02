import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { authService } from "../features/auth/services/authService";
import { userService } from "../features/users/services/userService";
import { roleService } from "../features/roles/services/roleService";
import { User, LoginResponse } from "../features/auth/types/auth";
import { registerAuthLogoutCallback } from "../shared/services/fetchInterceptor";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  permissions: string[];
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (
    token: string,
    email: string,
    newPassword: string,
  ) => Promise<void>;
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
  clearPermissionsCache: () => void;
  updatePermissions: (permissions: string[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const savedToken = localStorage.getItem("auth_token");
    const savedUser = localStorage.getItem("auth_user");
    const savedPermissions = localStorage.getItem("auth_permissions");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setPermissions(savedPermissions ? JSON.parse(savedPermissions) : []);
      setIsAuthenticated(true);
    }
    setLoading(false);

    // Register logout callback for global auth error handling
    // This allows the fetch interceptor to log out the user if API returns 401/403
    registerAuthLogoutCallback(async () => {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setPermissions([]);
      // Redirect to login
      window.location.href = "/login";
    });
  }, []);

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResponse> => {
    const response = await authService.login({ email, password });

    if (!response.success || !response.session) {
      throw new Error(response.error?.message || "Login failed");
    }

    // Store auth data
    localStorage.setItem("auth_token", response.session.token);
    localStorage.setItem("session_id", response.session.id);

    setToken(response.session.token);
    setIsAuthenticated(true);

    // Extract permissions directly from login response
    const userPermissions: string[] = response.session.permissions || [];
    setPermissions(userPermissions);
    localStorage.setItem("auth_permissions", JSON.stringify(userPermissions));

    // Default role for immediate display
    let userRole = "User";

    if (response.user) {
      // Create user object with default role for immediate display
      const user: User = {
        user_id: response.user.id,
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        private_email_address: response.user.email,
        email: response.user.email,
        role: userRole,
        is_activated: true,
        is_deleted: false,
        force_password_reset: false,
        created_on: new Date().toISOString(),
        updated_on: new Date().toISOString(),
      };

      setUser(user);
      localStorage.setItem("auth_user", JSON.stringify(user));

      // Fetch actual role in background (non-blocking)
      userService.getUserById(response.user.id)
        .then((userResponse) => {
          if (userResponse.success && userResponse.data) {
            const fullUser = userResponse.data as { primary_role_id?: number; role_id?: number };
            const primaryRoleId = fullUser.primary_role_id ?? fullUser.role_id;

            if (primaryRoleId) {
              return roleService.getRoleById(primaryRoleId, { skipCache: true });
            }
          }
          return null;
        })
        .then((roleResponse) => {
          if (roleResponse) {
            // Update user with actual role
            const updatedUser = {
              ...user,
              role: roleResponse.name,
            };
            setUser(updatedUser);
            localStorage.setItem("auth_user", JSON.stringify(updatedUser));
          }
        })
        .catch((error) => {
          console.warn("Failed to fetch user role in background", error);
        });
    } else {
      // If no user data in response, login is incomplete
      throw new Error("Login successful but user data missing");
    }

    return response;
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call success
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setPermissions([]);

      // Clear localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      localStorage.removeItem("session_id");
      localStorage.removeItem("auth_permissions");
    }
  };

  const requestPasswordReset = async (email: string): Promise<void> => {
    await authService.requestPasswordReset({ email });
  };

  const resetPassword = async (
    token: string,
    email: string,
    newPassword: string,
  ): Promise<void> => {
    await authService.completePasswordReset({ token, email, newPassword });
  };

  // Permission checking methods
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.some((permission) =>
      permissions.includes(permission),
    );
  };

  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    return requiredPermissions.every((permission) =>
      permissions.includes(permission),
    );
  };

  const updatePermissions = (newPermissions: string[]): void => {
    setPermissions(newPermissions);
    localStorage.setItem("auth_permissions", JSON.stringify(newPermissions));
  };

  const refreshPermissions = async (): Promise<void> => {
    const response = await authService.getPermissions();
    if (response.success && response.permissions) {
      setPermissions(response.permissions);
      localStorage.setItem(
        "auth_permissions",
        JSON.stringify(response.permissions),
      );
    } else {
      if (
        response.error?.code === "INVALID_TOKEN" ||
        response.error?.code === "GET_PERMISSIONS_FAILED"
      ) {
        throw new Error(
          response.error.message || "Failed to refresh permissions",
        );
      }
    }
  };

  const clearPermissionsCache = (): void => {
    setPermissions([]);
    localStorage.removeItem("auth_permissions");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        permissions,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
        loading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        refreshPermissions,
        clearPermissionsCache,
        updatePermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
