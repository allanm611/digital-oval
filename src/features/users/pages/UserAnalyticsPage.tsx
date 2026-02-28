import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
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
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";

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

export default function UserAnalyticsPage() {
  const { error: showError } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Load chart data
      const [statusRes, deptRes, roleRes, mfaEnabledRes, mfaDisabledRes, expiringRes, expiredRes, recentRes, inactiveRes] = await Promise.all([
        userService.getStatusCounts().catch(() => null),
        userService.getDepartmentCounts().catch(() => null),
        userService.getRoleCounts().catch(() => null),
        userService.getMFAEnabledUsers({ limit: 1 }).catch(() => null),
        userService.getMFADisabledUsers({ limit: 1 }).catch(() => null),
        userService.getExpiringPasswords({ limit: 1 }).catch(() => null),
        userService.getExpiredAccess({ limit: 1 }).catch(() => null),
        userService.getRecentUsers({ limit: 1 }).catch(() => null),
        userService.getInactiveUsers({ limit: 1 }).catch(() => null),
      ]);

      // Set chart data
      if (statusRes?.data) setStatusCounts(statusRes.data);
      if (deptRes?.data) setDepartmentCounts(deptRes.data);
      if (roleRes?.data) setRoleCounts(roleRes.data);

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
  };

  const renderPieChart = (
    title: string,
    data: Record<string, number>,
    colorMap?: Record<string, string>,
  ) => {
    const chartData = Object.entries(data)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .map(([name, value]) => ({
        name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        value: Number(value) || 0,
        color: colorMap?.[name.toLowerCase()] || color.primary.accent,
      }));

    if (chartData.length === 0) {
      return (
        <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
          <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
            {title}
          </h3>
          <p className={`text-sm ${tw.textSecondary}`}>No data available</p>
        </div>
      );
    }

    return (
      <div className={`bg-white ${tw.rounded} border border-gray-200 p-6`}>
        <h3 className={`text-sm font-semibold ${tw.textPrimary} mb-4`}>
          {title}
        </h3>
        <div className="h-64 w-full mb-4">
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
    <div className="space-y-6">
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
          {/* Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderPieChart("Users by Status", statusCounts, {
              active: color.status.success,
              inactive: color.status.danger,
              pending_activation: color.status.warning,
              suspended: color.text.muted,
            })}
            {renderPieChart("Users by Department", departmentCounts)}
            {renderPieChart("Users by Role", roleCounts)}
          </div>

          {/* Reporting Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${tw.textSecondary} mb-1`}>
                    MFA Enabled
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {mfaEnabledCount}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color.status.success + "20" }}
                >
                  <span style={{ color: color.status.success }}>✓</span>
                </div>
              </div>
            </div>

            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${tw.textSecondary} mb-1`}>
                    MFA Disabled
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {mfaDisabledCount}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color.status.warning + "20" }}
                >
                  <span style={{ color: color.status.warning }}>!</span>
                </div>
              </div>
            </div>

            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${tw.textSecondary} mb-1`}>
                    Expiring Passwords
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {expiringPasswordsCount}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color.status.warning + "20" }}
                >
                  <AlertTriangle
                    className="w-5 h-5"
                    style={{ color: color.status.warning }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${tw.textSecondary} mb-1`}>
                    Expired Access
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {expiredAccessCount}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color.status.danger + "20" }}
                >
                  <AlertTriangle
                    className="w-5 h-5"
                    style={{ color: color.status.danger }}
                  />
                </div>
              </div>
            </div>

            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${tw.textSecondary} mb-1`}>
                    Recent Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {recentUsersCount}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color.primary.accent + "20" }}
                >
                  <span style={{ color: color.primary.accent }}>+</span>
                </div>
              </div>
            </div>

            <div
              className={`bg-white ${tw.rounded} border border-gray-200 p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm ${tw.textSecondary} mb-1`}>
                    Inactive Users
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {inactiveUsersCount}
                  </p>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: color.text.muted + "20" }}
                >
                  <span style={{ color: color.text.muted }}>-</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
