import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
} from "lucide-react";
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
import { campaignService } from "../services/campaignService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import CurrencyFormatter from "../../../shared/components/CurrencyFormatter";
import { getCurrencySymbol } from "../../../shared/services/currencyService";
import { color, tw } from "../../../shared/utils/utils";
import {
  CampaignStatsSummary,
  TopPerformers,
  TopPerformerCampaign,
} from "../types/campaign";

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

type TopPerformerTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload: {
      fullName: string;
      participants?: number;
      budget?: number;
      id: number;
    };
  }>;
  label?: string | number;
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
    <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
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
                  entry.color ||
                  color.charts.campaigns?.primary ||
                  color.charts.campaigns.active,
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

export default function CampaignsAnalyticsPage(): JSX.Element {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<CampaignStatsSummary | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<
    Array<{ status: string; count: number }>
  >([]);
  const [approvalStatusBreakdown, setApprovalStatusBreakdown] = useState<
    Array<{ status: string; count: number }>
  >([]);
  const [activityStatusBreakdown, setActivityStatusBreakdown] = useState<
    Array<{ status: string; count: number }>
  >([]);
  const [budgetDistributionBreakdown, setBudgetDistributionBreakdown] =
    useState<Array<{ range: string; count: number }>>([]);
  const [controlGroupsBreakdown, setControlGroupsBreakdown] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [organizationBreakdown, setOrganizationBreakdown] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [participantMetrics, setParticipantMetrics] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [recentActivityBreakdown, setRecentActivityBreakdown] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [targetsBreakdown, setTargetsBreakdown] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [timelineBreakdown, setTimelineBreakdown] = useState<
    Array<{ name: string; count: number }>
  >([]);
  const [topPerformersData, setTopPerformersData] =
    useState<TopPerformers | null>(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const statsResponse = await campaignService.getCampaignStats(true);

      if (statsResponse.success && statsResponse.data) {
        // Use the data as-is from API response
        const data = statsResponse.data as CampaignStatsSummary;
        setStats(data);

        // Process status breakdown
        if (data.status_breakdown) {
          const statusData = Object.entries(data.status_breakdown).map(
            ([status, count]) => ({
              status:
                status.charAt(0).toUpperCase() +
                status.slice(1).replace(/_/g, " "),
              count:
                typeof count === "string"
                  ? parseInt(count, 10) || 0
                  : typeof count === "number"
                  ? count
                  : 0,
            })
          );
          setStatusBreakdown(statusData);
        }

        // Process approval status breakdown
        if (data.approval_status_breakdown) {
          const approvalData = Object.entries(
            data.approval_status_breakdown
          ).map(([status, count]) => ({
            status:
              status.charAt(0).toUpperCase() +
              status.slice(1).replace(/_/g, " "),
            count:
              typeof count === "string"
                ? parseInt(count, 10) || 0
                : typeof count === "number"
                ? count
                : 0,
          }));
          setApprovalStatusBreakdown(
            approvalData.filter((item) => item.count > 0)
          );
        }

        // Process activity status breakdown
        if (data.activity_status) {
          const activityData = Object.entries(data.activity_status).map(
            ([status, count]) => ({
              status:
                status.charAt(0).toUpperCase() +
                status.slice(1).replace(/_/g, " "),
              count:
                typeof count === "string"
                  ? parseInt(count, 10) || 0
                  : typeof count === "number"
                  ? count
                  : 0,
            })
          );
          setActivityStatusBreakdown(activityData);
        }

        // Process budget distribution breakdown
        if (data.budget_distribution) {
          const currencySymbol = getCurrencySymbol();
          const rangeLabels: Record<string, string> = {
            under_10k: `Under ${currencySymbol}10k`,
            from_10k_to_50k: `${currencySymbol}10k - ${currencySymbol}50k`,
            from_50k_to_100k: `${currencySymbol}50k - ${currencySymbol}100k`,
            over_100k: `Over ${currencySymbol}100k`,
          };

          const budgetData = Object.entries(data.budget_distribution).map(
            ([range, count]) => ({
              range: rangeLabels[range] || range.replace(/_/g, " "),
              count:
                typeof count === "string"
                  ? parseInt(count, 10) || 0
                  : typeof count === "number"
                  ? count
                  : 0,
            })
          );
          setBudgetDistributionBreakdown(budgetData);
        }

        // Process control groups breakdown
        if (data.control_groups) {
          const withControlGroups = parseValue(
            data.control_groups.campaigns_with_control_groups
          );
          const withoutControlGroups = parseValue(
            data.control_groups.campaigns_without_control_groups
          );

          const controlGroupsData = [
            {
              label: "With Control Groups",
              value: withControlGroups,
            },
            {
              label: "Without Control Groups",
              value: withoutControlGroups,
            },
          ];
          setControlGroupsBreakdown(controlGroupsData);
        }

        // Process organization breakdown
        if (data.organization) {
          const orgData = [
            {
              name: "Unique Categories",
              count: parseValue(data.organization.unique_categories_used),
            },
            {
              name: "Unique Programs",
              count: parseValue(data.organization.unique_programs_used),
            },
            {
              name: "Unique Managers",
              count: parseValue(data.organization.unique_managers),
            },
            {
              name: "Without Category",
              count: parseValue(data.organization.campaigns_without_category),
            },
            {
              name: "Without Manager",
              count: parseValue(data.organization.campaigns_without_manager),
            },
            {
              name: "Without Program",
              count: parseValue(data.organization.campaigns_without_program),
            },
          ];
          setOrganizationBreakdown(orgData);
        }

        // Process participant metrics
        if (data.participant_metrics) {
          const participantData = [
            {
              name: "Total Participants",
              count: parseValue(data.participant_metrics.total_participants),
            },
            {
              name: "Total Max Participants",
              count: parseValue(
                data.participant_metrics.total_max_participants
              ),
            },
            {
              name: "Average per Campaign",
              count: parseValue(data.participant_metrics.average_per_campaign),
            },
          ];
          setParticipantMetrics(participantData);
        }

        // Process recent activity breakdown
        if (data.recent_activity) {
          const activityData = [
            {
              name: "Created Last 7 Days",
              count: parseValue(data.recent_activity.created_last_7_days),
            },
            {
              name: "Created Last 30 Days",
              count: parseValue(data.recent_activity.created_last_30_days),
            },
            {
              name: "Updated Last 7 Days",
              count: parseValue(data.recent_activity.updated_last_7_days),
            },
            {
              name: "Updated Last 30 Days",
              count: parseValue(data.recent_activity.updated_last_30_days),
            },
          ];
          setRecentActivityBreakdown(activityData);
        }

        // Process targets breakdown
        if (data.targets) {
          const targetsData = [
            {
              label: "With Target Reach",
              value: parseValue(data.targets.campaigns_with_target_reach),
            },
            {
              label: "With Target Conversion",
              value: parseValue(data.targets.campaigns_with_target_conversion),
            },
            {
              label: "With Target Revenue",
              value: parseValue(data.targets.campaigns_with_target_revenue),
            },
          ];
          setTargetsBreakdown(targetsData);
        }

        // Process timeline breakdown
        if (data.timeline) {
          const timelineData = [
            {
              name: "Starting Next 7 Days",
              count: parseValue(data.timeline.starting_next_7_days),
            },
            {
              name: "Starting Next 30 Days",
              count: parseValue(data.timeline.starting_next_30_days),
            },
            {
              name: "Ending Next 7 Days",
              count: parseValue(data.timeline.ending_next_7_days),
            },
            {
              name: "Ending Next 30 Days",
              count: parseValue(data.timeline.ending_next_30_days),
            },
          ];
          setTimelineBreakdown(timelineData);
        }
      }
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

  // Process Top Performing Campaigns data from the stats response
  useEffect(() => {
    const processTopPerformersData = async () => {
      try {
        const statsResponse = await campaignService.getCampaignStats(true);

        if (statsResponse.success && statsResponse.data) {
          const statsData = statsResponse.data as CampaignStatsSummary;
          const topPerformers = statsData.top_performers || {
            by_participants: [],
            by_spend: [],
          };

          // Store the data directly from API - no need to fetch campaigns separately
          setTopPerformersData({
            by_participants: topPerformers.by_participants || [],
            by_spend: topPerformers.by_spend || [],
          });
        } else {
          setTopPerformersData(null);
        }
      } catch (error) {
        console.error("Failed to fetch top campaigns:", error);
        setTopPerformersData(null);
      }
    };

    processTopPerformersData();
  }, []);

  const parseValue = (value: number | string | undefined | null): number => {
    if (value == null) return 0;
    if (typeof value === "string") {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    if (typeof value === "number") {
      return isNaN(value) ? 0 : value;
    }
    return 0;
  };

  // Helper to get total campaigns from stats (checks overview first, then direct)
  const getTotalCampaigns = (stats: CampaignStatsSummary | null): number => {
    if (!stats) return 0;
    // API structure: data.overview.total_campaigns = 5
    if (stats.overview?.total_campaigns) {
      return typeof stats.overview.total_campaigns === "number"
        ? stats.overview.total_campaigns
        : parseValue(stats.overview.total_campaigns);
    }
    return parseValue(stats.total_campaigns) || 0;
  };

  // Helper to get active campaigns from stats
  const getActiveCampaigns = (stats: CampaignStatsSummary | null): number => {
    if (!stats) return 0;
    // API structure: data.activity_status.is_active_flag_true = 5
    if (stats.activity_status?.is_active_flag_true) {
      return typeof stats.activity_status.is_active_flag_true === "number"
        ? stats.activity_status.is_active_flag_true
        : parseValue(stats.activity_status.is_active_flag_true);
    }
    if (stats.activity_status?.currently_running) {
      return typeof stats.activity_status.currently_running === "number"
        ? stats.activity_status.currently_running
        : parseValue(stats.activity_status.currently_running);
    }
    if (stats.status_breakdown?.active) {
      return typeof stats.status_breakdown.active === "number"
        ? stats.status_breakdown.active
        : parseValue(stats.status_breakdown.active);
    }
    return (
      parseValue(stats.active_campaigns) ||
      parseValue(stats.currently_active) ||
      0
    );
  };

  // Chart colors from tokens
  const pieColors = color.charts.campaigns.pieColors || [];
  const chartPrimary =
    color.charts.campaigns.primary || color.charts.campaigns.active;
  const chartSecondary =
    color.charts.campaigns.secondary || color.charts.campaigns.pending;
  const chartAccent =
    color.charts.campaigns.accent || color.charts.campaigns.completed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate("/dashboard/campaigns")}
          className={`${tw.rounded} p-2 text-gray-600 hover:text-gray-800 transition-colors self-start`}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="sm:ml-2">
          <h1 className={`text-xl sm:text-2xl font-bold ${tw.textPrimary}`}>
            Campaign Analytics
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            Insights and metrics for campaign performance
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
          {stats && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <Target
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total Campaigns
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {getTotalCampaigns(stats).toLocaleString()}
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Active Campaigns
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {getActiveCampaigns(stats).toLocaleString()}
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total Budget Allocated
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  <CurrencyFormatter
                    amount={
                      stats.budget_metrics?.total_allocated ||
                      parseValue(stats.total_budget_allocated) ||
                      0
                    }
                  />
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-5 w-5"
                    style={{ color: color.primary.accent }}
                  />
                  <p className="text-sm font-medium text-gray-600">
                    Total Budget Spent
                  </p>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  <CurrencyFormatter
                    amount={
                      stats.budget_metrics?.total_spent ||
                      parseValue(stats.total_budget_spent) ||
                      0
                    }
                  />
                </p>
              </div>
            </div>
          )}

          {/* Additional Stats Row */}
          {stats && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <p className="text-sm font-medium text-gray-600">In Draft</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {(stats.status_breakdown?.draft || 0).toLocaleString()}
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <p className="text-sm font-medium text-gray-600">
                  Pending Approval
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {(
                    stats.status_breakdown?.pending_approval || 0
                  ).toLocaleString()}
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {(stats.status_breakdown?.completed || 0).toLocaleString()}
                </p>
              </div>
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <p className="text-sm font-medium text-gray-600">
                  Avg Campaign Budget
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  <CurrencyFormatter
                    amount={stats.budget_metrics?.average_allocated || 0}
                  />
                </p>
              </div>
            </div>
          )}

          {/* Charts Section */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            {approvalStatusBreakdown.length > 0 && (
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Approval Status Distribution
                </h3>
                <div className="h-64 w-full min-h-[256px]">
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={approvalStatusBreakdown.map((item) => ({
                          name: item.status,
                          value: item.count,
                        }))}
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
                        {approvalStatusBreakdown.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
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
                </div>
              </div>
            )}

            {controlGroupsBreakdown.length > 0 && (
              <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Control Groups Distribution
                </h3>
                <div className="h-64 w-full min-h-[256px]">
                  <ResponsiveContainer width="100%" height={256}>
                    <PieChart>
                      <Pie
                        data={controlGroupsBreakdown.map((item) => ({
                          name: item.label,
                          value: item.value,
                        }))}
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
                        {controlGroupsBreakdown.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
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
                </div>
              </div>
            )}
          </div>

          {/* Bar Charts */}
          {targetsBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Targets Distribution
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={targetsBreakdown.map((item) => ({
                      name: item.label,
                      count: item.value,
                    }))}
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
                      dataKey="reach"
                      fill={color.tertiary.tag4}
                      radius={[4, 4, 0, 0]}
                      name="With Target Reach"
                    />
                    <Bar
                      dataKey="conversion"
                      fill="#3b8169"
                      radius={[4, 4, 0, 0]}
                      name="With Target Conversion"
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      name="With Target Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {statusBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Campaign Status Distribution
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={statusBreakdown.map((item) => ({
                      name: item.status,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartPrimary}
                      radius={[4, 4, 0, 0]}
                      name="Campaigns"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {activityStatusBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Activity Status Overview
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={activityStatusBreakdown.map((item) => ({
                      name: item.status,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartAccent}
                      radius={[4, 4, 0, 0]}
                      name="Campaigns"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {budgetDistributionBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Budget Distribution
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={budgetDistributionBreakdown.map((item) => ({
                      name: item.range,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartPrimary}
                      radius={[4, 4, 0, 0]}
                      name="Campaigns"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {organizationBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Organization Overview
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={organizationBreakdown.map((item) => ({
                      name: item.name,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartSecondary}
                      radius={[4, 4, 0, 0]}
                      name="Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {participantMetrics.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Participant Metrics
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={participantMetrics.map((item) => ({
                      name: item.name,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartAccent}
                      radius={[4, 4, 0, 0]}
                      name="Count"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {recentActivityBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recent Activity
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={recentActivityBreakdown.map((item) => ({
                      name: item.name,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartPrimary}
                      radius={[4, 4, 0, 0]}
                      name="Campaigns"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {timelineBreakdown.length > 0 && (
            <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Campaign Timeline
              </h3>
              <div className="h-96 w-full min-h-[384px]">
                <ResponsiveContainer width="100%" height={384}>
                  <BarChart
                    data={timelineBreakdown.map((item) => ({
                      name: item.name,
                      count: item.count,
                    }))}
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
                      dataKey="count"
                      fill={chartAccent}
                      radius={[4, 4, 0, 0]}
                      name="Campaigns"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Performing Campaigns */}
          {topPerformersData && (
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              {topPerformersData.by_participants &&
                topPerformersData.by_participants.length > 0 && (
                  <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Top Campaigns by Participants
                    </h3>
                    <div className="h-96 w-full min-h-[384px]">
                      <ResponsiveContainer width="100%" height={384}>
                        <BarChart
                          data={topPerformersData.by_participants
                            .slice(0, 5)
                            .map((campaign: TopPerformerCampaign) => ({
                              name:
                                campaign.name?.length > 20
                                  ? campaign.name.substring(0, 20) + "..."
                                  : campaign.name || campaign.code || "Unknown",
                              participants: campaign.current_participants || 0,
                              fullName:
                                campaign.name || campaign.code || "Unknown",
                              id: campaign.id,
                            }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                            content={(props: TopPerformerTooltipProps) => {
                              if (!props.active || !props.payload?.length) {
                                return null;
                              }
                              const data = props.payload[0].payload;
                              return (
                                <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
                                  <p className="mb-2 text-sm font-semibold text-gray-900">
                                    {data.fullName}
                                  </p>
                                  <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                                    <span>Participants:</span>
                                    <span className="font-semibold text-gray-900">
                                      {(
                                        data.participants || 0
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              );
                            }}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="participants"
                            fill={chartPrimary}
                            radius={[4, 4, 0, 0]}
                            name="Participants"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

              {topPerformersData.by_spend &&
                topPerformersData.by_spend.length > 0 && (
                  <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Top Campaigns by Spend
                    </h3>
                    <div className="h-96 w-full min-h-[384px]">
                      <ResponsiveContainer width="100%" height={384}>
                        <BarChart
                          data={topPerformersData.by_spend
                            .slice(0, 5)
                            .map((campaign: TopPerformerCampaign) => ({
                              name:
                                campaign.name?.length > 20
                                  ? campaign.name.substring(0, 20) + "..."
                                  : campaign.name || campaign.code || "Unknown",
                              budget: campaign.budget_allocated || 0,
                              fullName:
                                campaign.name || campaign.code || "Unknown",
                              id: campaign.id,
                            }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
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
                            content={(props: TopPerformerTooltipProps) => {
                              if (!props.active || !props.payload?.length) {
                                return null;
                              }
                              const data = props.payload[0].payload;
                              return (
                                <div className={`${tw.rounded} border border-gray-200 bg-white p-3 shadow-lg`}>
                                  <p className="mb-2 text-sm font-semibold text-gray-900">
                                    {data.fullName}
                                  </p>
                                  <div className="flex items-center justify-between gap-4 text-sm text-gray-600">
                                    <span>Budget:</span>
                                    <span className="font-semibold text-gray-900">
                                      <CurrencyFormatter
                                        amount={data.budget || 0}
                                      />
                                    </span>
                                  </div>
                                </div>
                              );
                            }}
                            cursor={{ fill: "transparent" }}
                          />
                          <Bar
                            dataKey="budget"
                            fill={chartSecondary}
                            radius={[4, 4, 0, 0]}
                            name="Budget"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
