import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CircleDollarSign,
  RefreshCw,
  TrendingDown,
  Users2,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "../../../shared/services/currencyService";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { resolveHeroTrend } from "../utils/campaignReportQuery";
import type { CustomerProfileReportsResponse, CustomerProfileTrend } from "../types/ReportsAPI";
import {
  aggregateValueBands,
  computeDeltaTrend,
  dummySubscriberHero,
  formatCount,
  previousSubscriberSnapshot,
  SUBSCRIBER_CVM_LABELS,
  subscriberCvmSnapshot,
  type KpiTrend,
  type ValueBandPoint,
} from "../utils/subscriberCvmMetrics";
import type { KpiTrendFormat } from "../utils/campaignCvmMetrics";
import type { RangeOption } from "../types/ReportsAPI";

type CustomerProfileKpiGridProps = {
  hero?: CustomerProfileReportsResponse["heroMetrics"] | null;
  heroTrends?: CustomerProfileReportsResponse["heroTrends"];
  valueMatrix?: ValueBandPoint[];
  useDummyData?: boolean;
  rangeKey?: RangeOption;
  multiplier?: number;
  churnInactivityDays?: number;
};

function SplitBar({
  parts,
}: {
  parts: Array<{ label: string; value: number; color: string }>;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) {
    return <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100" />;
  }
  return (
    <div className="mt-3">
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-100">
        {parts.map((part) => (
          <span
            key={part.label}
            className="h-full"
            style={{
              width: `${(part.value / total) * 100}%`,
              backgroundColor: part.color,
            }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {parts.map((part) => (
          <span key={part.label} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: part.color }}
            />
            {part.label} {formatCount(part.value)}
          </span>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
  favorable = "up",
  children,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  trend: KpiTrend;
  favorable?: "up" | "down";
  children?: ReactNode;
}) {
  const improved =
    trend.direction === "flat" ? false : trend.direction === favorable;
  const trendColor =
    trend.direction === "flat"
      ? "text-gray-500"
      : improved
        ? "text-emerald-600"
        : "text-red-600";
  const trendMark =
    trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "•";

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: colors.primary.accent }} />
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        <span className={`text-xs font-semibold ${trendColor}`}>
          {trendMark} {trend.value}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtext}</p>
      {children}
    </div>
  );
}

function kpiTrend(
  current: number,
  previous: number | undefined,
  format: KpiTrendFormat,
  apiTrend: CustomerProfileTrend | undefined,
  useDummyData: boolean,
): KpiTrend {
  if (!useDummyData) {
    const resolved = resolveHeroTrend(apiTrend);
    if (resolved.value !== "—") return resolved;
  }
  return computeDeltaTrend(current, previous, format);
}

export default function CustomerProfileKpiGrid({
  hero,
  heroTrends,
  valueMatrix = [],
  useDummyData = false,
  rangeKey = "90d",
  multiplier = 1,
  churnInactivityDays = 120,
}: CustomerProfileKpiGridProps) {
  const current = useDummyData
    ? dummySubscriberHero(rangeKey, multiplier)
    : subscriberCvmSnapshot(hero as unknown as Record<string, unknown>);
  const previous = useDummyData ? previousSubscriberSnapshot(current) : undefined;
  const bands = aggregateValueBands(valueMatrix);
  const bandValue = (label: string) =>
    bands.find((band) => band.segment === label)?.customers ?? 0;

  const activeTrend = kpiTrend(
    current.activeSubscribers,
    previous?.activeSubscribers,
    "percent",
    heroTrends?.activeCustomers,
    useDummyData,
  );
  const clvTrend = kpiTrend(
    current.subscriberLifetimeValue,
    previous?.subscriberLifetimeValue,
    "percent",
    heroTrends?.avgClv,
    useDummyData,
  );
  const arpuTrend = kpiTrend(
    current.arpu,
    previous?.arpu,
    "percent",
    heroTrends?.avgOrderValue,
    useDummyData,
  );
  const rechargeTrend = kpiTrend(
    current.rechargeFrequency,
    previous?.rechargeFrequency,
    "points",
    heroTrends?.purchaseFrequency,
    useDummyData,
  );
  const activityTrend = kpiTrend(
    current.activityScore,
    previous?.activityScore,
    "points",
    heroTrends?.engagementScore,
    useDummyData,
  );
  const churnTrend = kpiTrend(
    current.churnRate,
    previous?.churnRate,
    "points",
    heroTrends?.churnRate,
    useDummyData,
  );

  const inactivityDays = churnInactivityDays > 0 ? churnInactivityDays : 120;

  return (
    <section className="space-y-3">
      <p className="text-xs text-gray-500">
        Portfolio health uses CVM base measures: active subscribers, lifetime
        value, ARPU, recharge frequency, activity score, and churn. Corner
        figures are versus the previous window of the same length. A lower
        churn rate is an improvement.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          label={SUBSCRIBER_CVM_LABELS.activeSubscribers}
          value={formatCount(current.activeSubscribers)}
          subtext="Subscribers with activity in the window"
          icon={Users2}
          trend={activeTrend}
        >
          <SplitBar
            parts={[
              {
                label: SUBSCRIBER_CVM_LABELS.highValue,
                value: bandValue(SUBSCRIBER_CVM_LABELS.highValue),
                color: colors.reportCharts.palette.color1,
              },
              {
                label: SUBSCRIBER_CVM_LABELS.core,
                value: bandValue(SUBSCRIBER_CVM_LABELS.core),
                color: colors.reportCharts.palette.color4,
              },
              {
                label: SUBSCRIBER_CVM_LABELS.atRisk,
                value: bandValue(SUBSCRIBER_CVM_LABELS.atRisk),
                color: colors.reportCharts.palette.color6,
              },
            ]}
          />
        </KpiCard>
        <KpiCard
          label={SUBSCRIBER_CVM_LABELS.subscriberLifetimeValue}
          value={formatCurrency(current.subscriberLifetimeValue)}
          subtext="Mean realized and predicted lifetime value"
          icon={Wallet}
          trend={clvTrend}
        />
        <KpiCard
          label={SUBSCRIBER_CVM_LABELS.arpu}
          value={formatCurrency(current.arpu)}
          subtext="Average revenue per subscriber"
          icon={CircleDollarSign}
          trend={arpuTrend}
        />
        <KpiCard
          label={SUBSCRIBER_CVM_LABELS.rechargeFrequency}
          value={`${current.rechargeFrequency.toFixed(1)} / yr`}
          subtext="Recharges per subscriber per year"
          icon={RefreshCw}
          trend={rechargeTrend}
        />
        <KpiCard
          label={SUBSCRIBER_CVM_LABELS.activityScore}
          value={`${Math.round(current.activityScore)} / 100`}
          subtext="Usage and recharge composite"
          icon={Activity}
          trend={activityTrend}
        />
        <KpiCard
          label={SUBSCRIBER_CVM_LABELS.churnRate}
          value={`${current.churnRate.toFixed(1)}%`}
          subtext={`No activity in ${inactivityDays} days`}
          icon={TrendingDown}
          trend={churnTrend}
          favorable="down"
        />
      </div>
    </section>
  );
}
