import React, { useState, useEffect, useCallback } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { AlertTriangle, Users, UserCheck, UserPlus, UserX, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../../shared/components/ui/BackButton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { userService } from "../services/userService";
import { userOnboardingService } from "../services/userOnboardingService";
import { roleService } from "../../roles/services/roleService";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";;;
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import {
  UserType,
  ChartTooltipPayload,
  AccountRequestListItem,
  RoleType,
  RoleListResponse,
} from "../types/user";

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipPayload[];
};

const CustomTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
}: ChartTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={`${tw.rounded} bg-white p-3 shadow-lg`}>
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className={`p-0 icon-edit ${tw.rounded} flex items-center justify-between gap-4 text-sm `}
        >
          <span>{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function UserAnalyticsPage() {
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Users and requests data for stat cards
  const [users, setUsers] = useState<UserType[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequestListItem[]>([]);
  const [userSummary, setUserSummary] = useState<{
    total: number;
    cached: boolean;
  }>({
    total: 0,
    cached: false,
  });

  // Chart data
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
  const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});

  // Reporting data
  const [mfaEnabledCount, setMfaEnabledCount] = useState(0);
  const [mfaDisabledCount, setMfaDisabledCount] = useState(0);
  const [mfaDisabledUsers, setMfaDisabledUsers] = useState<UserType[]>([]);
  const [expiringPasswordsCount, setExpiringPasswordsCount] = useState(0);
  const [expiringPasswordsUsers, setExpiringPasswordsUsers] = useState<UserType[]>([]);
  const [expiredAccessCount, setExpiredAccessCount] = useState(0);
  const [expiredAccessUsers, setExpiredAccessUsers] = useState<UserType[]>([]);
  const [recentUsersCount, setRecentUsersCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<UserType[]>([]);
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
  const [inactiveUsers, setInactiveUsers] = useState<UserType[]>([]);
  const [requestCountByStatus, setRequestCountByStatus] = useState<Array<{ status: string; count: number }>>([]);
  const [roleLookup, setRoleLookup] = useState<Record<number, { id: number; name: string }>>({});

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel: users, requests, and analytics endpoints
      const [
        usersRes,
        submittedRes,
        underReviewRes,
        statusRes,
        deptRes,
        roleRes,
        rolesListRes,
        mfaEnabledRes,
        mfaDisabledRes,
        expiringRes,
        expiredRes,
        recentRes,
        inactiveRes,
        requestCountByStatusRes,
      ] = await Promise.all([
        userService.getUsers({ skipCache: true }).catch(() => null),
        userOnboardingService.getSubmittedRequests(true, 100, 0).catch(() => null),
        userOnboardingService.getUnderReviewRequests(true, 100, 0).catch(() => null),
        userService.getStatusCounts({ skipCache: true }).catch(() => ({ success: false, data: {} })),
        userService.getDepartmentCounts({ skipCache: true }).catch(() => ({ success: false, data: {} })),
        userService.getRoleCounts({ skipCache: true }).catch(() => ({ success: false, data: {} })),
        roleService.listRoles({ limit: 100, skipCache: true }).catch(() => null),
        userService.getMFAEnabledUsers({ limit: 100, skipCache: true }).catch(() => null),
        userService.getMFADisabledUsers({ limit: 100, skipCache: true }).catch(() => null),
        userService.getExpiringPasswords(30, { limit: 100, skipCache: true }).catch(() => null),
        userService.getExpiredAccess({ limit: 100, skipCache: true }).catch(() => null),
        userService.getRecentUsers(7, { limit: 100, skipCache: true }).catch(() => null),
        userService.getInactiveUsers(30, { limit: 100, skipCache: true }).catch(() => null),
        userOnboardingService.getCountByStatus(true).catch(() => ({ success: false, data: [] })),
      ]);

      // Transform array format to object format if needed
      const transformToObject = (
        data:
          | Record<string, number>
          | Array<{ [key: string]: unknown; count: number }>,
      ): Record<string, number> => {
        if (Array.isArray(data)) {
          const result: Record<string, number> = {};
          data.forEach((item) => {
            if (item.count === undefined) return;
            const key = Object.keys(item).find(
              (k) =>
                k !== "count" &&
                (typeof item[k] === "string" || typeof item[k] === "number"),
            );
            if (key) {
              const value = item[key];
              const displayKey =
                typeof value === "string" ? value : String(value);
              result[displayKey] = item.count;
            }
          });
          return result;
        }
        return data;
      };

      // Set users data
      if (usersRes?.success && usersRes?.data) {
        setUsers(usersRes.data);
        const totalFromResponse = (usersRes.meta?.total ?? usersRes.data.length);
        setUserSummary({
          total: totalFromResponse,
          cached: Boolean(usersRes.meta?.isCachedResponse),
        });
      }

      // Set account requests data
      const allRequests: AccountRequestListItem[] = [];
      const statusResponses = [submittedRes, underReviewRes];
      statusResponses.forEach((response) => {
        if (response?.success && response?.data) {
          response.data.forEach((req) => {
            const reqTyped = req as { id: number; first_name: string; last_name: string; email_address?: string; department?: string; created_at?: string; status?: string };
            allRequests.push({
              requestId: reqTyped.id,
              first_name: reqTyped.first_name,
              last_name: reqTyped.last_name,
              email_address: reqTyped.email_address,
              department: reqTyped.department,
              created_at: reqTyped.created_at,
              status: reqTyped.status || "submitted",
            });
          });
        }
      });
      setAccountRequests(allRequests);

      // Build role lookup from roles list
      const rolesMap: Record<number | string, string> = {};
      const rolesListTyped = rolesListRes as RoleListResponse | null | undefined;
      if (rolesListTyped?.success && rolesListTyped?.data && Array.isArray(rolesListTyped.data)) {
        rolesListTyped.data.forEach((role) => {
          if ((role.id || role.id === 0) && role.name) {
            // Store both numeric and string versions for flexible lookup
            rolesMap[role.id] = role.name;
            rolesMap[String(role.id)] = role.name;
          }
        });
      }

      // If we have role counts, extract unique role IDs and fetch their details
      const uniqueRoleIds = new Set<number>();
      if (roleRes?.data && Array.isArray(roleRes.data)) {
        roleRes.data.forEach((item) => {
          const itemTyped = item as { role_id?: number };
          if (itemTyped.role_id !== undefined) {
            uniqueRoleIds.add(itemTyped.role_id);
          }
        });
      }

      // Fetch individual roles for IDs not found in the list
      const fetchedRoles: RoleType[] = [];
      if (uniqueRoleIds.size > 0) {
        const roleDetailsPromises = Array.from(uniqueRoleIds).map((roleId) => {
          // Only fetch if we don't already have this role's name
          if (!rolesMap[roleId] && !rolesMap[String(roleId)]) {
            return roleService.getRoleById(roleId).catch(() => null);
          }
          return Promise.resolve(null);
        });

        const roleDetails = await Promise.all(roleDetailsPromises);
        roleDetails.forEach((role) => {
          if (role && role.id && role.name) {
            rolesMap[role.id] = role.name;
            rolesMap[String(role.id)] = role.name;
            fetchedRoles.push(role);
          }
        });
      }

      // Build roleLookup from both initial roles and fetched roles
      const initialRoles = rolesListTyped?.success && rolesListTyped?.data ? rolesListTyped.data : [];
      const allRoles = [...initialRoles, ...fetchedRoles];
      const roleLookupData: Record<number, { id: number; name: string }> = {};
      allRoles.forEach((role) => {
        if (role && role.id && role.name) {
          roleLookupData[role.id] = { id: role.id, name: role.name };
        }
      });
      setRoleLookup(roleLookupData);

      // Set chart data with transformation
      if (statusRes?.data) setStatusCounts(transformToObject(statusRes.data));
      if (deptRes?.data) setDepartmentCounts(transformToObject(deptRes.data));

      // Handle role counts - map IDs to role names
      if (roleRes?.data) {
        const mappedRoleCounts: Record<string, number> = {};

        if (Array.isArray(roleRes.data)) {
          // For each role count, extract the ID and look up the name
          roleRes.data.forEach((item) => {
            const itemTyped = item as { role_id?: number; count?: number | string };
            // Extract role ID from role_id field
            const roleId = itemTyped.role_id;
            // Convert count from string to number
            const count = parseInt(String(itemTyped.count), 10);

            if (!isNaN(count) && count > 0 && roleId !== undefined) {
              // Try to get role name from lookup map using both numeric and string keys
              let displayName = rolesMap[roleId] || rolesMap[String(roleId)];

              // Fallback to role ID if name not found
              if (!displayName) {
                displayName = `Role #${roleId}`;
              }

              mappedRoleCounts[displayName] = count;
            }
          });

          // Use mapped data (will show role names or fallback IDs)
          setRoleCounts(mappedRoleCounts);
        } else {
          setRoleCounts(transformToObject(roleRes.data));
        }
      }

      // Set reporting counts and data (from pagination.total or meta.total)
      if (mfaEnabledRes?.success && mfaEnabledRes?.data) {
        const mfaEnabledTyped = mfaEnabledRes as { success: true; data: UserType[]; pagination?: { total: number }; meta?: { total: number } };
        const total = mfaEnabledTyped.pagination?.total ?? mfaEnabledTyped.meta?.total ?? 0;
        setMfaEnabledCount(total);
      }

      if (mfaDisabledRes?.success && mfaDisabledRes?.data) {
        const mfaDisabledTyped = mfaDisabledRes as { success: true; data: UserType[]; pagination?: { total: number }; meta?: { total: number } };
        const total = mfaDisabledTyped.pagination?.total ?? mfaDisabledTyped.meta?.total ?? 0;
        setMfaDisabledCount(total);
        setMfaDisabledUsers(mfaDisabledRes.data);
      }

      if (expiringRes?.success && expiringRes?.data) {
        const expiringTyped = expiringRes as { success: true; data: UserType[]; pagination?: { total: number }; meta?: { total: number } };
        const total = expiringTyped.pagination?.total ?? expiringTyped.meta?.total ?? 0;
        setExpiringPasswordsCount(total);
        setExpiringPasswordsUsers(expiringRes.data);
      }

      if (expiredRes?.success && expiredRes?.data) {
        const expiredTyped = expiredRes as { success: true; data: UserType[]; pagination?: { total: number }; meta?: { total: number } };
        const total = expiredTyped.pagination?.total ?? expiredTyped.meta?.total ?? 0;
        setExpiredAccessCount(total);
        setExpiredAccessUsers(expiredRes.data);
      }

      if (recentRes?.success && recentRes?.data) {
        const recentTyped = recentRes as { success: true; data: UserType[]; pagination?: { total: number }; meta?: { total: number } };
        const total = recentTyped.pagination?.total ?? recentTyped.meta?.total ?? 0;
        setRecentUsersCount(total);
        setRecentUsers(recentRes.data);
      }

      if (inactiveRes?.success && inactiveRes?.data) {
        const inactiveTyped = inactiveRes as { success: true; data: UserType[]; pagination?: { total: number }; meta?: { total: number } };
        const total = inactiveTyped.pagination?.total ?? inactiveTyped.meta?.total ?? 0;
        setInactiveUsersCount(total);
        setInactiveUsers(inactiveRes.data);
      }

      // Set request count by status
      if (requestCountByStatusRes?.success && requestCountByStatusRes?.data) {
        setRequestCountByStatus(requestCountByStatusRes.data);
      }

      // Extract unique role IDs from all user tables and fetch missing roles
      const allTableUsers = [
        ...(mfaDisabledRes?.data || []),
        ...(expiringRes?.data || []),
        ...(expiredRes?.data || []),
        ...(recentRes?.data || []),
        ...(inactiveRes?.data || []),
      ];

      const tableRoleIds = new Set<number>();
      allTableUsers.forEach((user) => {
        if (user.primary_role_id !== undefined && user.primary_role_id !== null) {
          tableRoleIds.add(user.primary_role_id);
        }
      });

      // Fetch individual roles for IDs not in roleLookup
      if (tableRoleIds.size > 0) {
        const roleDetailsPromises = Array.from(tableRoleIds).map((roleId) => {
          // Only fetch if we don't already have this role's name
          if (!rolesMap[roleId] && !rolesMap[String(roleId)]) {
            return roleService.getRoleById(roleId).catch(() => null);
          }
          return Promise.resolve(null);
        });

        const roleDetails = await Promise.all(roleDetailsPromises);
        roleDetails.forEach((role) => {
          if (role && role.id && role.name) {
            rolesMap[role.id] = role.name;
            rolesMap[String(role.id)] = role.name;
          }
        });

        // Update roleLookup with all fetched roles
        const updatedRoleLookup = { ...roleLookupData };
        roleDetails.forEach((role) => {
          if (role && role.id && role.name) {
            updatedRoleLookup[role.id] = { id: role.id, name: role.name };
          }
        });
        setRoleLookup(updatedRoleLookup);
      }
    } catch {
      showError("Failed to load analytics", "Please try again later");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Calculate stat cards data
  const normalizeStatus = (user: UserType): string => {
    if (user.status === "locked") return "locked";
    if (!user.is_active) return "inactive";
    return "active";
  };

  const aggregateCounts = users.reduce(
    (acc, user) => {
      const status = normalizeStatus(user);
      if (status === "active") {
        acc.active += 1;
      } else if (status === "inactive") {
        acc.inactive += 1;
      } else if (status === "locked") {
        acc.locked += 1;
      }
      return acc;
    },
    { active: 0, inactive: 0, locked: 0 },
  );

  const totalUsersValue =
    userSummary.total > 0 ? userSummary.total : aggregateCounts.active + aggregateCounts.inactive;
  const activeUsersValue = aggregateCounts.active;
  const pendingActivationValue = accountRequests.length;
  const highRiskUsersValue = aggregateCounts.locked;

  const statsLoadingIndicator = isLoading;

  const userStatsCards = [
    {
      name: "Total Users",
      value: statsLoadingIndicator ? "..." : totalUsersValue.toLocaleString(),
      icon: Users,
      color: color.tertiary.tag1,
      badge: userSummary.cached ? "Cached" : undefined,
    },
    {
      name: "Active Users",
      value: statsLoadingIndicator ? "..." : activeUsersValue.toLocaleString(),
      icon: UserCheck,
      color: color.tertiary.tag4,
    },
    {
      name: "Pending Activation",
      value: statsLoadingIndicator ? "..." : pendingActivationValue.toLocaleString(),
      icon: UserPlus,
      color: color.tertiary.tag2,
    },
    {
      name: "Locked Users",
      value: statsLoadingIndicator ? "..." : highRiskUsersValue.toLocaleString(),
      icon: UserX,
      color: color.tertiary.tag3,
    },
  ];

  const renderPieChart = (
    title: string,
    data: Record<string, number>,
    colorMap?: Record<string, string>,
    usePalette?: boolean,
  ) => {
    // Color palette for multiple colors
    const colorPalette = [
      color.tertiary.tag1,
      color.tertiary.tag2,
      color.tertiary.tag3,
      color.tertiary.tag4,
      color.status.success,
      color.status.warning,
      color.status.danger,
      color.primary.accent,
    ];

    const chartData = Object.entries(data)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .map(([name, value], index) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: Number(value) || 0,
        color: colorMap?.[name.toLowerCase()] ||
               (usePalette ? colorPalette[index % colorPalette.length] : color.primary.accent),
      }));

    if (chartData.length === 0) {
      return (
        <div className={`${tw.rounded} border p-6`} style={{ borderColor: 'var(--c-border-default)' }}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
            {title}
          </h3>
          <p className={`text-sm ${tw.textSecondary}`}>No data available</p>
        </div>
      );
    }

    return (
      <div className={`${tw.rounded} border p-6 w-full`} style={{ borderColor: 'var(--c-border-default)' }}>
        <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
          {title}
        </h3>
        <div className="h-80 w-full mb-4 flex justify-start">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => {
                  const percent = props.percent as number | undefined;
                  return percent && percent > 0.05
                    ? `${(percent * 100).toFixed(0)}%`
                    : "";
                }}
                outerRadius="70%"
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--c-border-default)' }}>
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className={tw.textSecondary}>{item.name}</span>
              </div>
              <span className={`font-semibold ${tw.textPrimary}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <BackButton showBreadcrumb={true} currentLabel="User Analytics" />

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner
            variant="modern"
            size="lg"
            color="primary"
            className="mr-3"
          />
          <span className={tw.textSecondary}>Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {userStatsCards.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.name}
                  className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                        style={{ color: color.primary.accent }}
                      />
                      <p className="text-sm font-medium text-sm truncate">
                        {stat.name}
                      </p>
                    </div>
                    {stat.badge && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-yellow-100 text-yellow-800 flex-shrink-0">
                        {stat.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Reporting Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div
              className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  ✓
                </span>
                <p className="text-sm font-medium text-sm">
                  MFA Enabled
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {mfaEnabledCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  !
                </span>
                <p className="text-sm font-medium text-sm">
                  MFA Disabled
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {mfaDisabledCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className="w-6 h-6"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-sm">
                  Expiring Passwords
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {expiringPasswordsCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className="w-6 h-6"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-sm">
                  Expired Access
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {expiredAccessCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  +
                </span>
                <p className="text-sm font-medium text-sm">
                  Recent Users
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {recentUsersCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border bg-white"
                style={{ borderColor: 'var(--c-border-default)' }} p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  -
                </span>
                <p className="text-sm font-medium text-sm">
                  Inactive Users
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {inactiveUsersCount}
              </p>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="space-y-6">
            {/* Users by Status - Full Width */}
            <div className="grid grid-cols-1 gap-6 justify-items-start">
              {renderPieChart("Users by Status", statusCounts, {
                active: color.status.success,
                inactive: color.status.danger,
                pending_activation: color.status.warning,
                suspended: color.text.muted,
              })}
            </div>

            {/* Department and Role - Same Line */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderPieChart("Users by Department", departmentCounts, undefined, true)}
              {renderPieChart("Users by Role", roleCounts, undefined, true)}
            </div>
          </div>

          {/* User Data Tables */}
          <div className="space-y-6">
            {/* MFA Disabled Users */}
            {mfaDisabledUsers.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  MFA Disabled Users ({mfaDisabledCount})
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className="w-full min-w-[600px]"
                    style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Username
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Role
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Email
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mfaDisabledUsers.map((user) => (
                        <tr key={user.id} className="transition-colors">
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.username}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.primary_role_id !== null && user.primary_role_id !== undefined ? (roleLookup[user.primary_role_id]?.name || `Role #${user.primary_role_id}`) : "No Role"}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.email_address || user.email}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-center"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            <button
                              onClick={() => navigate(`/dashboard/user-management/${user.id}`)}
                              className={`p-2 ${tw.rounded} transition-colors`}
                              style={{
                                color: color.primary.action,
                                backgroundColor: "transparent",
                              }}
                              title="View user details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expiring Passwords Users */}
            {expiringPasswordsUsers.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  Expiring Passwords ({expiringPasswordsCount})
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className="w-full min-w-[600px]"
                    style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Username
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Role
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Email
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringPasswordsUsers.map((user) => (
                        <tr key={user.id} className="transition-colors">
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.username}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.primary_role_id !== null && user.primary_role_id !== undefined ? (roleLookup[user.primary_role_id]?.name || `Role #${user.primary_role_id}`) : "No Role"}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.email_address || user.email}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-center"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            <button
                              onClick={() => navigate(`/dashboard/user-management/${user.id}`)}
                              className="p-2 transition-colors"
                              style={{
                                color: color.primary.action,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${color.primary.action}15`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                              title="View user details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expired Access Users */}
            {expiredAccessUsers.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  Expired Access ({expiredAccessCount})
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className="w-full min-w-[600px]"
                    style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Username
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Role
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Email
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiredAccessUsers.map((user) => (
                        <tr key={user.id} className="transition-colors">
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.username}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.primary_role_id !== null && user.primary_role_id !== undefined ? (roleLookup[user.primary_role_id]?.name || `Role #${user.primary_role_id}`) : "No Role"}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.email_address || user.email}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-center"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            <button
                              onClick={() => navigate(`/dashboard/user-management/${user.id}`)}
                              className="p-2 transition-colors"
                              style={{
                                color: color.primary.accent,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = `${color.primary.accent}15`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                              }}
                              title="View user details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Users */}
            {recentUsers.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  Recent Users ({recentUsersCount})
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className="w-full min-w-[600px]"
                    style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Username
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Role
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Email
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="transition-colors">
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.username}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.primary_role_id !== null && user.primary_role_id !== undefined ? (roleLookup[user.primary_role_id]?.name || `Role #${user.primary_role_id}`) : "No Role"}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.email_address || user.email}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-center"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            <button
                              onClick={() => navigate(`/dashboard/user-management/${user.id}`)}
                              className={`p-2 ${tw.rounded} transition-colors`}
                              style={{
                                color: color.primary.action,
                                backgroundColor: "transparent",
                              }}
                              title="View user details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Inactive Users */}
            {inactiveUsers.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
                  Inactive Users ({inactiveUsersCount})
                </h3>
                <div className="overflow-x-auto">
                  <table
                    className="w-full min-w-[600px]"
                    style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
                  >
                    <thead style={{ background: color.surface.tableHeader }}>
                      <tr>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Username
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Role
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Email
                        </th>
                        <th
                          className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                          style={{ color: color.surface.tableHeaderText }}
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {inactiveUsers.map((user) => (
                        <tr key={user.id} className="transition-colors">
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.username}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.primary_role_id !== null && user.primary_role_id !== undefined ? (roleLookup[user.primary_role_id]?.name || `Role #${user.primary_role_id}`) : "No Role"}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-sm"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            {user.email_address || user.email}
                          </td>
                          <td
                            className="px-4 sm:px-6 py-3 sm:py-4 text-center"
                            style={{ backgroundColor: color.surface.tablebodybg }}
                          >
                            <button
                              onClick={() => navigate(`/dashboard/user-management/${user.id}`)}
                              className={`p-2 ${tw.rounded} transition-colors`}
                              style={{
                                color: color.primary.action,
                                backgroundColor: "transparent",
                              }}
                              title="View user details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
