import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CircleDollarSign,
  HandCoins,
  Target,
  TrendingUp,
  Users2,
} from "lucide-react";
import { formatCurrency } from "../../../shared/services/currencyService";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { resolveHeroTrend } from "../utils/campaignReportQuery";
import type { SegmentReportTrend, SegmentReportsResponse } from "../types/ReportsAPI";
import type { KpiTrendFormat } from "../utils/campaignCvmMetrics";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  previousSegmentSnapshot,
  SEGMENT_CVM_LABELS,
  segmentCvmSnapshot,
  type KpiTrend,
} from "../utils/segmentCvmMetrics";

type SegmentKpiGridProps = {
  summary?: SegmentReportsResponse["summary"] | Record<string, unknown> | null;
  heroTrends?: SegmentReportsResponse["heroTrends"];
  useDummyData?: boolean;
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
  children,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  trend: KpiTrend;
  children?: ReactNode;
}) {
  const trendColor =
    trend.direction === "up"
      ? "text-emerald-600"
      : trend.direction === "down"
        ? "text-red-600"
        : "text-gray-500";
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
  apiTrend: SegmentReportTrend | undefined,
  useDummyData: boolean,
): KpiTrend {
  if (!useDummyData) {
    const resolved = resolveHeroTrend(apiTrend);
    if (resolved.value !== "—") return resolved;
  }
  return computeDeltaTrend(current, previous, format);
}

export default function SegmentKpiGrid({
  summary,
  heroTrends,
  useDummyData = false,
}: SegmentKpiGridProps) {
  const current = segmentCvmSnapshot(
    (summary ?? null) as Record<string, unknown> | null,
  );
  const previous = useDummyData ? previousSegmentSnapshot(current) : undefined;

  const portfolioTrend = kpiTrend(
    current.segmentPortfolio,
    previous?.segmentPortfolio,
    "compact",
    heroTrends?.totalSegments,
    useDummyData,
  );
  const baseTrend = kpiTrend(
    current.subscriberBase,
    previous?.subscriberBase,
    "percent",
    heroTrends?.totalMembers,
    useDummyData,
  );
  const growthTrend = kpiTrend(
    current.baseGrowth,
    previous?.baseGrowth,
    "points",
    heroTrends?.avgMemberGrowth,
    useDummyData,
  );
  const targetedTrend = kpiTrend(
    current.targetedSegments,
    previous?.targetedSegments,
    "compact",
    heroTrends?.activeInCampaigns,
    useDummyData,
  );
  const activityTrend = kpiTrend(
    current.activityScore,
    previous?.activityScore,
    "points",
    heroTrends?.activityScore || heroTrends?.engagementRate,
    useDummyData,
  );
  const takeUpTrend = kpiTrend(
    current.takeUpRate,
    previous?.takeUpRate,
    "points",
    heroTrends?.takeUpRate || heroTrends?.conversionRate,
    useDummyData,
  );
  const arpuTrend = kpiTrend(
    current.arpu,
    previous?.arpu,
    "percent",
    heroTrends?.arpu,
    useDummyData,
  );

  const showBaseSplit = current.activeSubscribers + current.dormantSubscribers > 0;

  return (
    <section className="space-y-3">
      <p className="text-xs text-gray-500">
        Segment health uses CVM base measures: subscriber base, base growth,
        campaign targeting, activity score, take-up rate, and ARPU. Corner
        figures are versus the previous window of the same length.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={SEGMENT_CVM_LABELS.segmentPortfolio}
          value={formatCount(current.segmentPortfolio)}
          subtext="Segments in the portfolio"
          icon={Users2}
          trend={portfolioTrend}
        />
        <KpiCard
          label={SEGMENT_CVM_LABELS.subscriberBase}
          value={formatCount(current.subscriberBase)}
          subtext="Subscribers across the portfolio"
          icon={Users2}
          trend={baseTrend}
        >
          {showBaseSplit && (
            <SplitBar
              parts={[
                {
                  label: SEGMENT_CVM_LABELS.activeSubscribers,
                  value: current.activeSubscribers,
                  color: colors.reportCharts.palette.color1,
                },
                {
                  label: SEGMENT_CVM_LABELS.dormantSubscribers,
                  value: current.dormantSubscribers,
                  color: colors.reportCharts.palette.color6,
                },
              ]}
            />
          )}
        </KpiCard>
        <KpiCard
          label={SEGMENT_CVM_LABELS.baseGrowth}
          value={formatRate(current.baseGrowth)}
          subtext="Change in subscriber base"
          icon={TrendingUp}
          trend={growthTrend}
        />
        <KpiCard
          label={SEGMENT_CVM_LABELS.targetedSegments}
          value={formatCount(current.targetedSegments)}
          subtext="Segments used as campaign target groups"
          icon={Target}
          trend={targetedTrend}
        />
        <KpiCard
          label={SEGMENT_CVM_LABELS.activityScore}
          value={`${Math.round(current.activityScore)} / 100`}
          subtext="Usage and recharge composite"
          icon={Activity}
          trend={activityTrend}
        />
        <KpiCard
          label={SEGMENT_CVM_LABELS.takeUpRate}
          value={formatRate(current.takeUpRate)}
          subtext="Share of targeted subscribers who accepted an offer"
          icon={HandCoins}
          trend={takeUpTrend}
        />
        <KpiCard
          label={SEGMENT_CVM_LABELS.arpu}
          value={formatCurrency(current.arpu)}
          subtext="Average revenue per subscriber in the portfolio"
          icon={CircleDollarSign}
          trend={arpuTrend}
        />
      </div>
    </section>
  );
}
