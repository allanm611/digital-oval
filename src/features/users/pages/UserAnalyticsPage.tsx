import React, { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Users, UserCheck, UserPlus, UserX } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { userService } from "../services/userService";
import { userOnboardingService } from "../services/userOnboardingService";
import { roleService } from "../../roles/services/roleService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import { UserType } from "../types/user";

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number | string;
  }>;
};

const CustomTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className={`${tw.rounded} bg-white p-3 shadow-lg`}>
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span>{entry.name}:</span>
          <span className="font-semibold">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface AccountRequestListItem {
  requestId: number;
  first_name: string;
  last_name: string;
  email_address?: string;
  email?: string;
  department?: string;
  created_at?: string;
  status?: string;
  rejection_reason?: string;
}

export default function UserAnalyticsPage() {
  const { error: showError } = useToast();
  const { t } = useLanguage();
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
  const [expiringPasswordsCount, setExpiringPasswordsCount] = useState(0);
  const [expiredAccessCount, setExpiredAccessCount] = useState(0);
  const [recentUsersCount, setRecentUsersCount] = useState(0);
  const [inactiveUsersCount, setInactiveUsersCount] = useState(0);
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
        return data as Record<string, number>;
      };

      // Set users data
      if (usersRes?.success && usersRes?.data) {
        setUsers(usersRes.data);
        const totalFromResponse = (usersRes.meta?.total as number | undefined) ?? usersRes.data.length;
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
          response.data.forEach((req: any) => {
            allRequests.push({
              requestId: req.id,
              first_name: req.first_name,
              last_name: req.last_name,
              email_address: req.email_address,
              department: req.department,
              created_at: req.created_at,
              status: req.status || "submitted",
            });
          });
        }
      });
      setAccountRequests(allRequests);

      // Build role lookup from roles list
      const rolesMap: Record<number | string, string> = {};
      if (rolesListRes?.success && rolesListRes?.data && Array.isArray(rolesListRes.data)) {
        rolesListRes.data.forEach((role: any) => {
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
        roleRes.data.forEach((item: any) => {
          if (item.role_id !== undefined) {
            uniqueRoleIds.add(item.role_id);
          }
        });
      }

      // Fetch individual roles for IDs not found in the list
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
          }
        });
      }

      setRoleLookup(rolesListRes?.success && rolesListRes?.data ?
        rolesListRes.data.reduce((acc: any, role: any) => {
          acc[role.id] = { id: role.id, name: role.name };
          return acc;
        }, {}) : {}
      );

      // Set chart data with transformation
      if (statusRes?.data) setStatusCounts(transformToObject(statusRes.data));
      if (deptRes?.data) setDepartmentCounts(transformToObject(deptRes.data));

      // Handle role counts - map IDs to role names
      if (roleRes?.data) {
        const mappedRoleCounts: Record<string, number> = {};

        if (Array.isArray(roleRes.data)) {
          // For each role count, extract the ID and look up the name
          roleRes.data.forEach((item: any) => {
            // Extract role ID from role_id field
            const roleId = item.role_id;
            // Convert count from string to number
            const count = parseInt(String(item.count), 10);

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

      // Set reporting counts (from meta.total if available)
      if (mfaEnabledRes?.meta?.total) setMfaEnabledCount(mfaEnabledRes.meta.total);
      if (mfaDisabledRes?.meta?.total) setMfaDisabledCount(mfaDisabledRes.meta.total);
      if (expiringRes?.meta?.total) setExpiringPasswordsCount(expiringRes.meta.total);
      if (expiredRes?.meta?.total) setExpiredAccessCount(expiredRes.meta.total);
      if (recentRes?.meta?.total) setRecentUsersCount(recentRes.meta.total);
      if (inactiveRes?.meta?.total) setInactiveUsersCount(inactiveRes.meta.total);
    } catch (err) {
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
        <div className={`${tw.rounded} border border-gray-200 p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
            {title}
          </h3>
          <p className={`text-sm ${tw.textSecondary}`}>No data available</p>
        </div>
      );
    }

    return (
      <div className={`${tw.rounded} border border-gray-200 p-6 w-full`}>
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
        <div className="space-y-2 pt-4 border-t border-gray-200">
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
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            User Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-1 text-sm`}>
            Overview of user distribution and status reports
          </p>
        </div>
      </div>

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
                  className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
                >
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon
                        className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"
                        style={{ color: color.primary.accent }}
                      />
                      <p className="text-sm font-medium text-gray-600 truncate">
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
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  ✓
                </span>
                <p className="text-sm font-medium text-gray-600">
                  MFA Enabled
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {mfaEnabledCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  !
                </span>
                <p className="text-sm font-medium text-gray-600">
                  MFA Disabled
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {mfaDisabledCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className="w-6 h-6"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">
                  Expiring Passwords
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {expiringPasswordsCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className="w-6 h-6"
                  style={{ color: color.primary.accent }}
                />
                <p className="text-sm font-medium text-gray-600">
                  Expired Access
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {expiredAccessCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  +
                </span>
                <p className="text-sm font-medium text-gray-600">
                  Recent Users
                </p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                {recentUsersCount}
              </p>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-4 sm:p-6 shadow-sm`}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-2xl font-bold"
                  style={{ color: color.primary.accent }}
                >
                  -
                </span>
                <p className="text-sm font-medium text-gray-600">
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
        </>
      )}
    </div>
  );
}
