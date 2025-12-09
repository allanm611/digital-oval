import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { userService } from "../services/userService";
import {
  UserType,
  UserPermissionsResponse,
  // Permission,
  UserPermissionsSummaryResponse,
} from "../types/user";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { navigateBackOrFallback } from "../../../shared/utils/navigation";
import { roleService } from "../../roles/services/roleService";
import { Role } from "../../roles/types/role";
import DateFormatter from "../../../shared/components/DateFormatter";
import { useLanguage } from "../../../contexts/LanguageContext";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { error: showError } = useToast();
  const { t } = useLanguage();

  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "overview" | "permissions" | "reports"
  >("overview");

  // Additional data
  const [directReports, setDirectReports] = useState<UserType[]>([]);
  const [allReports, setAllReports] = useState<UserType[]>([]);
  const [managerChain, setManagerChain] = useState<UserType[]>([]);
  const [permissions, setPermissions] =
    useState<UserPermissionsResponse | null>(null);
  const [permissionsSummary, setPermissionsSummary] =
    useState<UserPermissionsSummaryResponse | null>(null);
  const [canLogin, setCanLogin] = useState<{
    can_login: boolean;
    reason?: string;
  } | null>(null);
  const [roleLookup, setRoleLookup] = useState<Record<number, Role>>({});

  useEffect(() => {
    if (id) {
      loadUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const { roles } = await roleService.listRoles({
        limit: 100,
      });
      const lookup: Record<number, Role> = {};
      roles.forEach((role) => {
        if (role.id != null) {
          lookup[role.id] = role;
        }
      });
      setRoleLookup(lookup);
    } catch (err) {
      console.error("Error loading roles:", err);
    }
  };

  const loadUserData = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const userId = parseInt(id);

      // Load user details
      const userResponse = await userService.getUserById(userId);

      if (userResponse.success) {
        setUser(userResponse.data);
      }

      // Load additional data in parallel
      try {
        const [reports, allReportsData, chain, perms, permsSummary, login] =
          await Promise.all([
            userService
              .getDirectReports(userId)
              .catch(() => ({ success: false, data: [] })),
            userService
              .getAllReports(userId)
              .catch(() => ({ success: false, data: [] })),
            userService
              .getManagerChain(userId)
              .catch(() => ({ success: false, data: [] })),
            userService.getUserPermissions(userId).catch(() => null),
            userService.getUserPermissionsSummary(userId).catch(() => null),
            userService.canUserLogin(userId).catch(() => null),
          ]);

        if (reports.success) setDirectReports(reports.data || []);
        if (allReportsData.success) setAllReports(allReportsData.data || []);
        if (chain.success) setManagerChain(chain.data || []);
        if (perms) setPermissions(perms);
        if (permsSummary && permsSummary.success) {
          setPermissionsSummary(permsSummary);
        }
        if (login && login.success) {
          // Normalize canLogin response - handle both camelCase and snake_case
          const loginData = login.data as {
            canLogin?: boolean;
            can_login?: boolean;
            reason?: string;
          };
          setCanLogin({
            can_login: loginData.canLogin ?? loginData.can_login ?? false,
            reason: loginData.reason,
          });
        }
      } catch (err) {
        console.error("Error loading additional user data:", err);
      }
    } catch (err) {
      showError(
        "Error loading user",
        err instanceof Error ? err.message : "Failed to load user details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const returnTo = (
    location.state as { returnTo?: { pathname: string; state?: unknown } }
  )?.returnTo;

  const navigateBack = () => {
    if (returnTo) {
      navigate(returnTo.pathname, {
        replace: true,
        state: returnTo.state,
      });
      return;
    }

    navigateBackOrFallback(navigate, "/dashboard/user-management");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 text-center">
          <p className="text-red-600">{t.userManagement.userNotFound}</p>
          <button
            onClick={navigateBack}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            {t.userManagement.backToUserManagement}
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const normalizeStatus = (userRecord: UserType): string => {
    const accountStatus = (userRecord as unknown as { account_status?: string })
      ?.account_status;
    if (accountStatus && accountStatus.trim() !== "") {
      return accountStatus.toLowerCase();
    }
    if (userRecord.status && userRecord.status.trim() !== "") {
      return userRecord.status.toLowerCase();
    }
    const isSuspended = Boolean(
      (userRecord as unknown as { is_suspended?: boolean })?.is_suspended
    );
    if (isSuspended) return "suspended";
    const isActive = Boolean(
      (userRecord as unknown as { is_active?: boolean })?.is_active ??
        (userRecord as unknown as { is_activated?: boolean })?.is_activated
    );
    return isActive ? "active" : "inactive";
  };

  const formatStatusLabel = (status: string) =>
    status
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Unknown";

  const getStatusColors = (status: string) => {
    if (status === "active") {
      return {
        background: color.tertiary.active.background,
        text: color.tertiary.active.text,
      };
    }
    if (status === "suspended" || status === "locked") {
      return {
        background: `${color.status.warning}20`,
        text: color.status.warning,
      };
    }
    return {
      background: `${color.status.danger}20`,
      text: color.status.danger,
    };
  };

  const getUserRoleName = (user: UserType): string => {
    const primaryRoleId = user.primary_role_id ?? user.role_id;
    if (primaryRoleId != null) {
      const resolvedRole = roleLookup[primaryRoleId];
      if (resolvedRole?.name) {
        return resolvedRole.name;
      }
    }
    return user.role_name || "N/A";
  };

  const normalizedStatus = normalizeStatus(user);
  const statusLabel = formatStatusLabel(normalizedStatus);
  const statusColors = getStatusColors(normalizedStatus);
  const userIsActive = normalizedStatus === "active";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={navigateBack}
            className="p-2 text-gray-600 rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className={`${tw.mainHeading} ${tw.textPrimary} md:text-lg text-base`}
            >
              {user.display_name || `${user.first_name} ${user.last_name}`}
            </h1>
            <p className={`${tw.textSecondary} text-sm mt-1`}>
              {user.email_address || user.email}
            </p>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: statusColors.background,
            color: statusColors.text,
          }}
        >
          {userIsActive ? (
            <CheckCircle
              className="w-3.5 h-3.5"
              style={{ color: statusColors.text }}
            />
          ) : (
            <XCircle
              className="w-3.5 h-3.5"
              style={{ color: statusColors.text }}
            />
          )}
          {statusLabel}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: "overview", label: t.userManagement.overview, icon: User },
          {
            id: "permissions",
            label: t.userManagement.permissions,
            icon: Shield,
          },
          { id: "reports", label: t.userManagement.reports, icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveSection(tab.id as "overview" | "permissions" | "reports")
            }
            className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 relative ${
              activeSection === tab.id
                ? "text-black"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeSection === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: color.primary.accent }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === "overview" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    {t.userManagement.personalInformation}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.fullName}
                      </span>
                      <span className="text-sm font-medium text-gray-900 text-right">
                        {`${user.first_name} ${user.middle_name || ""} ${
                          user.last_name
                        }`.trim()}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.username}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.username || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between items-start py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.email}
                      </span>
                      <span className="text-sm font-medium text-gray-900 text-right">
                        {user.email_address || user.email || "N/A"}
                      </span>
                    </div>
                    {user.phone_number && (
                      <div className="flex justify-between items-start py-2 ">
                        <span className="text-sm text-gray-600">
                          {t.userManagement.phone}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {user.phone_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Information */}
                <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    {t.userManagement.workInformation}
                  </h3>
                  <div className="space-y-3">
                    {user.department && (
                      <div className="flex justify-between items-start py-2 ">
                        <span className="text-sm text-gray-600">
                          {t.userManagement.department}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {user.department}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-start py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.role}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {getUserRoleName(user)}
                      </span>
                    </div>
                    {user.job_title &&
                      user.job_title.toLowerCase() !==
                        getUserRoleName(user).toLowerCase() && (
                        <div className="flex justify-between items-start py-2 ">
                          <span className="text-sm text-gray-600">
                            {t.userManagement.jobTitle}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {user.job_title}
                          </span>
                        </div>
                      )}
                    {user.data_access_level && (
                      <div className="flex justify-between items-start py-2">
                        <span className="text-sm text-gray-600">
                          {t.userManagement.dataAccess}
                        </span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {user.data_access_level}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Security & Access */}
                <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    {t.userManagement.securityAccess}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.status}
                      </span>
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.mfa}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        {user.mfa_enabled
                          ? t.userManagement.enabled
                          : t.userManagement.disabled}
                      </span>
                    </div>
                    {canLogin && (
                      <div className="flex justify-between items-center py-2 ">
                        <span className="text-sm text-gray-600">
                          {t.userManagement.canLogin}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {canLogin.can_login
                            ? t.userManagement.yes
                            : t.userManagement.no}
                        </span>
                      </div>
                    )}
                    {user.can_access_pii !== undefined && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">
                          {t.userManagement.piiAccess}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {user.can_access_pii
                            ? t.userManagement.allowed
                            : t.userManagement.restricted}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="bg-gray-50 rounded-md p-4 border border-gray-100">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">
                    {t.userManagement.activityTimeline}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.created}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        <DateFormatter
                          date={user.created_at}
                          useLocale
                          year="numeric"
                          month="short"
                          day="numeric"
                        />
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 ">
                      <span className="text-sm text-gray-600">
                        {t.userManagement.updated}
                      </span>
                      <span className="text-sm font-medium text-gray-900">
                        <DateFormatter
                          date={user.updated_at}
                          useLocale
                          year="numeric"
                          month="short"
                          day="numeric"
                        />
                      </span>
                    </div>
                    {user.last_login && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">
                          {t.userManagement.lastLogin}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          <DateFormatter
                            date={user.last_login}
                            useLocale
                            year="numeric"
                            month="short"
                            day="numeric"
                          />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Section */}
      {activeSection === "permissions" && (
        <div className="space-y-6">
          <div className="bg-white rounded-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t.userManagement.permissions}
            </h3>
            {permissions ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {t.userManagement.directPermissions}
                  </h4>
                  <div className="space-y-2">
                    {permissions.direct_permissions &&
                    permissions.direct_permissions.length > 0 ? (
                      permissions.direct_permissions.map((perm, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <span className="text-sm text-gray-700">{perm}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        {t.userManagement.noDirectPermissions}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {t.userManagement.loadingPermissions}
              </p>
            )}
          </div>
        </div>
      )}

      {activeSection === "permissions" && (
        <div className="space-y-6">
          {permissions && permissions.data ? (
            (() => {
              const permissionsList = permissions.data.permissions || [];
              const rolesList = permissions.data.roles || [];
              const hasPermissions = permissionsList.length > 0;
              const hasRoles = rolesList.length > 0;

              // Group permissions by category (extract from code, e.g., "campaigns.create" -> "campaigns")
              const permissionsByCategory = permissionsList.reduce(
                (acc, perm) => {
                  const category = perm.code.split(".")[0] || "other";
                  acc[category] = (acc[category] || 0) + 1;
                  return acc;
                },
                {} as Record<string, number>
              );

              if (!hasPermissions && !hasRoles) {
                return (
                  <div className="text-center py-12">
                    <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-900 mb-1">
                      {t.userManagement.noPermissions}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t.userManagement.noPermissionsOrRoles}
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {/* Summary Stat Cards */}
                  {permissionsSummary?.data ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="group bg-white rounded-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: color.tertiary.tag1,
                                }}
                              >
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-3xl font-bold text-black">
                                  {permissionsSummary.data.totalPermissions.toLocaleString()}
                                </p>
                                <p
                                  className={`${tw.cardSubHeading} ${tw.textSecondary}`}
                                >
                                  {t.userManagement.totalPermissions}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group bg-white rounded-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: color.tertiary.tag3,
                                }}
                              >
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-3xl font-bold text-black">
                                  {permissionsSummary.data.sensitivePermissions.toLocaleString()}
                                </p>
                                <p
                                  className={`${tw.cardSubHeading} ${tw.textSecondary}`}
                                >
                                  {t.userManagement.sensitivePermissions}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group bg-white rounded-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: color.tertiary.tag2,
                                }}
                              >
                                <Shield className="h-5 w-5 text-white" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-3xl font-bold text-black">
                                  {permissionsSummary.data.mfaRequiredPermissions.toLocaleString()}
                                </p>
                                <p
                                  className={`${tw.cardSubHeading} ${tw.textSecondary}`}
                                >
                                  {t.userManagement.mfaRequired}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="group bg-white rounded-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2 rounded-full flex items-center justify-center"
                                style={{
                                  backgroundColor: color.tertiary.tag4,
                                }}
                              >
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div className="space-y-1">
                                <p className="text-3xl font-bold text-black">
                                  {permissionsSummary.data.roles.toLocaleString()}
                                </p>
                                <p
                                  className={`${tw.cardSubHeading} ${tw.textSecondary}`}
                                >
                                  {t.userManagement.totalRoles}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group bg-white rounded-md border border-gray-200 p-6 relative overflow-hidden hover:shadow-lg transition-all duration-300">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="p-2 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: color.tertiary.tag1 }}
                            >
                              <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-3xl font-bold text-black">
                                {permissionsList.length.toLocaleString()}
                              </p>
                              <p
                                className={`${tw.cardSubHeading} ${tw.textSecondary}`}
                              >
                                {t.userManagement.totalPermissions}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Permissions by Category */}
                  {Object.keys(permissionsByCategory).length > 0 && (
                    <div>
                      <h3 className="md:text-sm text-base font-semibold text-gray-900 mb-3">
                        {t.userManagement.permissionsByCategory}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {Object.entries(permissionsByCategory)
                          .sort(([, a], [, b]) => b - a)
                          .map(([category, count]) => (
                            <div
                              key={category}
                              className="bg-white rounded-md p-4 border border-gray-200 hover:shadow-sm transition-shadow"
                            >
                              <p className="text-xs text-gray-600 mb-2 capitalize font-medium">
                                {category.replace(/_/g, " ")}
                              </p>
                              <p className="text-2xl font-bold text-black">
                                {count}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* All Permissions List */}
                  {hasPermissions && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t.userManagement.allPermissions.replace(
                          "{count}",
                          permissionsList.length.toString()
                        )}
                      </h3>
                      <div
                        className={`rounded-md border border-[${color.border.default}] overflow-hidden`}
                      >
                        <div className="hidden lg:block overflow-x-auto">
                          <table
                            className="min-w-full"
                            style={{
                              borderCollapse: "separate",
                              borderSpacing: "0 8px",
                            }}
                          >
                            <thead
                              style={{
                                background: color.surface.tableHeader,
                              }}
                            >
                              <tr>
                                <th
                                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider"
                                  style={{
                                    color: color.surface.tableHeaderText,
                                  }}
                                >
                                  {t.userManagement.permission}
                                </th>
                                <th
                                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider hidden md:table-cell"
                                  style={{
                                    color: color.surface.tableHeaderText,
                                  }}
                                >
                                  {t.userManagement.code}
                                </th>
                                <th
                                  className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider hidden xl:table-cell"
                                  style={{
                                    color: color.surface.tableHeaderText,
                                  }}
                                >
                                  {t.userManagement.permissionDescription}
                                </th>
                                <th
                                  className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider w-16"
                                  style={{
                                    color: color.surface.tableHeaderText,
                                  }}
                                >
                                  {t.userManagement.status}
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {permissionsList.map((perm) => (
                                <tr key={perm.id}>
                                  <td
                                    className="px-6 py-4 text-sm font-medium text-gray-900"
                                    style={{
                                      backgroundColor:
                                        color.surface.tablebodybg,
                                    }}
                                  >
                                    {perm.name}
                                  </td>
                                  <td
                                    className="px-6 py-4 text-sm text-gray-700 font-mono hidden md:table-cell"
                                    style={{
                                      backgroundColor:
                                        color.surface.tablebodybg,
                                    }}
                                  >
                                    <span
                                      className="truncate block"
                                      title={perm.code}
                                    >
                                      {perm.code}
                                    </span>
                                  </td>
                                  <td
                                    className="px-6 py-4 text-sm text-gray-600 hidden xl:table-cell"
                                    style={{
                                      backgroundColor:
                                        color.surface.tablebodybg,
                                    }}
                                  >
                                    <span
                                      className="truncate block"
                                      title={perm.description || ""}
                                    >
                                      {perm.description || "—"}
                                    </span>
                                  </td>
                                  <td
                                    className="px-6 py-4 text-center"
                                    style={{
                                      backgroundColor:
                                        color.surface.tablebodybg,
                                    }}
                                  >
                                    <CheckCircle
                                      className="w-5 h-5 mx-auto"
                                      style={{ color: color.status.success }}
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {/* Mobile View */}
                        <div className="lg:hidden space-y-2 ">
                          {permissionsList.map((perm) => (
                            <div
                              key={perm.id}
                              className="bg-gray-50 rounded-md p-3 border border-gray-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {perm.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 font-mono">
                                    {perm.code}
                                  </p>
                                </div>
                                <CheckCircle
                                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                                  style={{ color: color.status.success }}
                                />
                              </div>
                              {perm.description && (
                                <p className="text-xs text-gray-600 mt-1">
                                  {perm.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assigned Roles */}
                  {hasRoles && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        {t.userManagement.assignedRoles.replace(
                          "{count}",
                          rolesList.length.toString()
                        )}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {rolesList.map((role) => (
                          <span
                            key={role.id}
                            className="px-3 py-1.5 rounded-md text-sm font-medium"
                            style={{
                              backgroundColor: `${color.primary.accent}15`,
                              color: color.primary.accent,
                            }}
                          >
                            {role.name || role.code || `Role ${role.id}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-base font-medium text-gray-900 mb-1">
                {t.userManagement.noPermissionsData}
              </p>
              <p className="text-sm text-gray-500">
                {t.userManagement.permissionInfoNotAvailable}
              </p>
            </div>
          )}
        </div>
      )}

      {activeSection === "reports" && (
        <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
          <div className="p-6">
            {directReports.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.userManagement.directReports.replace(
                    "{count}",
                    directReports.length.toString()
                  )}
                </h3>
                <div className="space-y-2">
                  {directReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/dashboard/user-management/${report.id}`, {
                          state: { returnTo },
                        })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: color.primary.accent }}
                        >
                          {getInitials(report.first_name, report.last_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {report.first_name} {report.last_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {report.email_address || report.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allReports.length > directReports.length && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.userManagement.allReports.replace(
                    "{count}",
                    allReports.length.toString()
                  )}
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  {t.userManagement.includesDirectAndIndirect}
                </p>
                <div className="space-y-2">
                  {allReports.map((report) => {
                    const isDirectReport = directReports.some(
                      (dr) => dr.id === report.id
                    );
                    return (
                      <div
                        key={report.id}
                        className={`flex items-center justify-between p-3 rounded-md border transition-colors cursor-pointer ${
                          isDirectReport
                            ? "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            : "bg-blue-50 border-blue-200 hover:bg-blue-100"
                        }`}
                        onClick={() =>
                          navigate(`/dashboard/user-management/${report.id}`, {
                            state: { returnTo },
                          })
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: color.primary.accent }}
                          >
                            {getInitials(report.first_name, report.last_name)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">
                                {report.first_name} {report.last_name}
                              </p>
                              {isDirectReport && (
                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                                  {t.userManagement.direct}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600">
                              {report.email_address || report.email}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {managerChain.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t.userManagement.managerChain.replace(
                    "{count}",
                    managerChain.length.toString()
                  )}
                </h3>
                <div className="space-y-2">
                  {managerChain.map((manager) => (
                    <div
                      key={manager.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() =>
                        navigate(`/dashboard/user-management/${manager.id}`, {
                          state: { returnTo },
                        })
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: color.primary.accent }}
                        >
                          {getInitials(manager.first_name, manager.last_name)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {manager.first_name} {manager.last_name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {manager.email_address || manager.email}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {directReports.length === 0 && managerChain.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-base font-medium text-gray-900 mb-1">
                  {t.userManagement.noReportsOrManagers}
                </p>
                <p className="text-sm text-gray-500">
                  {t.userManagement.noDirectReportsYet}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
