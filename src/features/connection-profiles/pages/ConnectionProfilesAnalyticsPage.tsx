import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Activity, Shield, AlertTriangle } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { connectionProfileService } from "../services/connectionProfileService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { color, tw } from "../../../shared/utils/utils";
import {
  ConnectionProfileType,
  ConnectionProfileTypeStatsItem,
  ConnectionProfileEnvironmentStatsItem,
  ConnectionProfileDataGovernanceStats,
} from "../types/connectionProfile";

type ChartTooltipEntry = {
  color?: string;
  name?: string;
  value?: number | string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: ChartTooltipEntry[];
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
    <div
      className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}
    >
      <p className="mb-2 text-sm font-semibold text-gray-900">{label}</p>
      {payload.map((entry, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 text-sm text-gray-600"
        >
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{
                backgroundColor:
                  entry.color || color.charts.scheduledJobs.primary,
              }}
            />
            {entry.name || "Count"}
          </span>
          <span className="font-semibold text-gray-900">
            {typeof entry.value === "number"
              ? entry.value.toLocaleString()
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff8042",
  "#8884d8",
];

export default function ConnectionProfilesAnalyticsPage(): JSX.Element {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionTypeStats, setConnectionTypeStats] = useState<
    ConnectionProfileTypeStatsItem[]
  >([]);
  const [environmentStats, setEnvironmentStats] = useState<
    ConnectionProfileEnvironmentStatsItem[]
  >([]);
  const [dataGovernanceStats, setDataGovernanceStats] =
    useState<ConnectionProfileDataGovernanceStats | null>(null);
  const [mostUsedProfiles, setMostUsedProfiles] = useState<
    ConnectionProfileType[]
  >([]);
  const [expiredProfiles, setExpiredProfiles] = useState<
    ConnectionProfileType[]
  >([]);
  const [activeProfiles, setActiveProfiles] = useState<ConnectionProfileType[]>(
    []
  );
  const [piiProfiles, setPiiProfiles] = useState<ConnectionProfileType[]>([]);
  const [healthEnabledProfiles, setHealthEnabledProfiles] = useState<
    ConnectionProfileType[]
  >([]);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        connectionTypes,
        environments,
        governance,
        mostUsed,
        expired,
        active,
        pii,
        healthEnabled,
      ] = await Promise.all([
        connectionProfileService.getConnectionTypeStats(true).catch(() => []),
        connectionProfileService.getEnvironmentStats(true).catch(() => []),
        connectionProfileService.getDataGovernanceStats(true).catch(() => null),
        connectionProfileService.getMostUsedProfiles(true).catch(() => []),
        connectionProfileService.getExpiredProfiles(true).catch(() => []),
        connectionProfileService.getActiveProfiles(true).catch(() => []),
        connectionProfileService.getProfilesWithPii(true).catch(() => []),
        connectionProfileService
          .getHealthCheckEnabledProfiles(true)
          .catch(() => []),
      ]);

      setConnectionTypeStats(connectionTypes || []);
      setEnvironmentStats(environments || []);
      setDataGovernanceStats(governance);
      setMostUsedProfiles(mostUsed || []);
      setExpiredProfiles(expired || []);
      setActiveProfiles(active || []);
      setPiiProfiles(pii || []);
      setHealthEnabledProfiles(healthEnabled || []);
    } catch (err) {
      console.error("Failed to load analytics:", err);
      showError("Failed to load analytics", "Unable to fetch analytics data");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const connectionTypeChartData = connectionTypeStats.map((item) => ({
    name: item.connection_type || "Unknown",
    value: Number(item.count) || 0,
  }));

  const environmentChartData = environmentStats.map((item) => ({
    name: item.environment || "Unknown",
    value: Number(item.count) || 0,
  }));

  const healthStatusData = [
    {
      name: "Health Enabled",
      value: healthEnabledProfiles.length,
    },
    {
      name: "Health Disabled",
      value: (dataGovernanceStats?.total || 0) - healthEnabledProfiles.length,
    },
  ];

  const statusData = [
    {
      name: "Active",
      value: activeProfiles.length,
    },
    {
      name: "Inactive",
      value: (dataGovernanceStats?.total || 0) - activeProfiles.length,
    },
  ];

  const classificationData = dataGovernanceStats?.classificationCounts
    ? Object.entries(dataGovernanceStats.classificationCounts).map(
        ([key, value]) => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          value: Number(value) || 0,
        })
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 sm:space-x-4">
        <BackButton fallbackTo="/dashboard/connection-profiles" />
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Connection Profiles Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Insights and metrics for connection profiles
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          {dataGovernanceStats && (
            <div className="grid gap-4 md:grid-cols-4">
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Database
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-black">
                    Total Profiles
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-black">
                  {dataGovernanceStats.total || 0}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Activity
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-black">Active</p>
                </div>
                <p className="mt-2 text-3xl font-bold text-black">
                  {activeProfiles.length}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <Shield
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-black">With PII</p>
                </div>
                <p className="mt-2 text-3xl font-bold text-black">
                  {piiProfiles.length}
                </p>
              </div>
              <div
                className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-black">Expired</p>
                </div>
                <p className="mt-2 text-3xl font-bold text-black">
                  {expiredProfiles.length}
                </p>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-black mb-4">
                Connection Type Distribution
              </h3>
              <div className="h-64 w-full min-h-[256px]">
                {connectionTypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={connectionTypeChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name || ""}: ${(
                            (props.percent || 0) * 100
                          ).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={300}
                      >
                        {connectionTypeChartData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span style={{ fontSize: "12px", color: "#000000" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-black mb-4">
                Environment Distribution
              </h3>
              <div className="h-64 w-full min-h-[256px]">
                {environmentChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={environmentChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name || ""}: ${(
                            (props.percent || 0) * 100
                          ).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={300}
                      >
                        {environmentChartData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span style={{ fontSize: "12px", color: "#000000" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-black mb-4">
                Status Distribution
              </h3>
              <div className="h-64 w-full min-h-[256px]">
                {statusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name || ""}: ${(
                            (props.percent || 0) * 100
                          ).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={300}
                      >
                        {statusData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span style={{ fontSize: "12px", color: "#000000" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            <div
              className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
            >
              <h3 className="text-lg font-semibold text-black mb-4">
                Health Check Status
              </h3>
              <div className="h-64 w-full min-h-[256px]">
                {healthStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={healthStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(props: { name?: string; percent?: number }) =>
                          `${props.name || ""}: ${(
                            (props.percent || 0) * 100
                          ).toFixed(0)}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        isAnimationActive={true}
                        animationDuration={300}
                      >
                        {healthStatusData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "transparent" }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span style={{ fontSize: "12px", color: "#000000" }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bar Charts */}
          <div
            className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}
          >
            <h3 className="text-lg font-semibold text-black mb-4">
              Classification Distribution
            </h3>
            <div className="h-96 w-full min-h-[384px]">
              {classificationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={classificationData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "transparent" }}
                    />
                    <Bar
                      dataKey="value"
                      fill={color.charts.scheduledJobs.primary}
                      radius={[4, 4, 0, 0]}
                      name="Profiles"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Tables */}
          {mostUsedProfiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                Most Used Profiles
              </h3>
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Profile Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Connection Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Environment
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Last Used
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostUsedProfiles.slice(0, 10).map((profile) => (
                      <tr
                        key={profile.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                        }}
                      >
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.profile_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.connection_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.environment}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.last_used_at
                            ? new Date(profile.last_used_at).toLocaleString()
                            : "Never"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {expiredProfiles.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                Expired Profiles
              </h3>
              <div className="overflow-x-auto">
                <table
                  className="w-full"
                  style={{
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopLeftRadius: "0.375rem",
                        }}
                      >
                        Profile Name
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Connection Type
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                        }}
                      >
                        Environment
                      </th>
                      <th
                        className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider"
                        style={{
                          color: color.surface.tableHeaderText,
                          backgroundColor: color.surface.tableHeader,
                          borderTopRightRadius: "0.375rem",
                        }}
                      >
                        Expired On
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiredProfiles.slice(0, 10).map((profile) => (
                      <tr
                        key={profile.id}
                        className="hover:bg-gray-50 transition-colors"
                        style={{
                          backgroundColor: color.surface.tablebodybg,
                        }}
                      >
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.profile_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.connection_type}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.environment}
                        </td>
                        <td className="px-6 py-4 text-sm text-black">
                          {profile.valid_to
                            ? new Date(profile.valid_to).toLocaleDateString()
                            : "Unknown"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
