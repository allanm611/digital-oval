import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  CircleDollarSign,
  Gift,
  HandCoins,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users2,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "../../../shared/services/currencyService";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { resolveHeroTrend } from "../utils/offerReportQuery";
import {
  computeDeltaTrend,
  costPerTakeUp,
  formatCount,
  formatRate,
  OFFER_CVM_LABELS,
  offerCvmSnapshot,
  previousOfferSnapshot,
  valuePerTakeUp,
  type OfferFunnelPoint,
} from "../utils/offerCvmMetrics";
import type { KpiTrend, KpiTrendFormat } from "../utils/campaignCvmMetrics";
import type { OfferKpiSummary, OfferReportTrend, OfferReportsResponse } from "../types/ReportsAPI";

type OfferKpiGridProps = {
  summary: Partial<OfferKpiSummary> | null | undefined;
  funnel?: OfferFunnelPoint[];
  heroTrends?: OfferReportsResponse["heroTrends"];
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
  apiTrend: OfferReportTrend | undefined,
  useDummyData: boolean,
): KpiTrend {
  if (!useDummyData) {
    const resolved = resolveHeroTrend(apiTrend);
    if (resolved.value !== "—") return resolved;
  }
  return computeDeltaTrend(current, previous, format);
}

export default function OfferKpiGrid({
  summary,
  funnel = [],
  heroTrends,
  useDummyData = false,
}: OfferKpiGridProps) {
  const current = offerCvmSnapshot(summary, funnel);
  const previous = useDummyData ? previousOfferSnapshot(current) : undefined;

  const targetGroup =
    current.targetGroup ||
    (useDummyData && current.eligible ? Math.round(current.eligible * 0.85) : 0);
  const controlGroup =
    current.controlGroup ||
    (useDummyData && current.eligible ? Math.max(0, current.eligible - targetGroup) : 0);

  const valueTrend = kpiTrend(
    current.valueGenerated,
    previous?.valueGenerated,
    "compact",
    heroTrends?.valueGenerated || heroTrends?.revenueGenerated,
    useDummyData,
  );
  const incrementalTrend = kpiTrend(
    current.incrementalValue,
    previous?.incrementalValue,
    "compact",
    heroTrends?.incrementalValue || heroTrends?.incrementalRevenue,
    useDummyData,
  );
  const romiTrend = kpiTrend(
    current.romi,
    previous?.romi,
    "multiplier",
    heroTrends?.romi || heroTrends?.roi,
    useDummyData,
  );
  const costTrend = kpiTrend(
    current.rewardCost,
    previous?.rewardCost,
    "compact",
    heroTrends?.rewardCost || heroTrends?.totalCost,
    useDummyData,
  );
  const eligibleTrend = kpiTrend(
    current.eligible,
    previous?.eligible,
    "percent",
    heroTrends?.eligible,
    useDummyData,
  );
  const offeredTrend = kpiTrend(
    current.offered,
    previous?.offered,
    "percent",
    heroTrends?.offered,
    useDummyData,
  );
  const takenUpTrend = kpiTrend(
    current.takenUp,
    previous?.takenUp,
    "percent",
    heroTrends?.takenUp || heroTrends?.totalRedemptions,
    useDummyData,
  );
  const takeUpTrend = kpiTrend(
    current.takeUpRate,
    previous?.takeUpRate,
    "points",
    heroTrends?.takeUpRate || heroTrends?.redemptionRate,
    useDummyData,
  );
  const fulfilledTrend = kpiTrend(
    current.fulfilled,
    previous?.fulfilled,
    "percent",
    heroTrends?.fulfilled,
    useDummyData,
  );

  return (
    <section className="space-y-3">
      <p className="text-xs text-gray-500">
        Overview pairs commercial CVM outcomes (value generated, incremental
        value versus control, ROMI, reward cost) with the offer lifecycle:
        eligible, offered, taken up, and fulfilled. Corner figures are vs the
        previous window of the same length.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={OFFER_CVM_LABELS.valueGenerated}
          value={formatCurrency(current.valueGenerated)}
          subtext={`Avg ${formatCurrency(valuePerTakeUp(current), { decimals: 0 })} per take-up`}
          icon={CircleDollarSign}
          trend={valueTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.incrementalValue}
          value={formatCurrency(current.incrementalValue)}
          subtext="Lift versus the control group"
          icon={Sparkles}
          trend={incrementalTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.romi}
          value={`${current.romi.toFixed(1)}x`}
          subtext={`Reward cost ${formatCurrency(current.rewardCost)}`}
          icon={TrendingUp}
          trend={romiTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.rewardCost}
          value={formatCurrency(current.rewardCost)}
          subtext={`Cost per take-up ${formatCurrency(costPerTakeUp(current), { decimals: 2 })}`}
          icon={Wallet}
          trend={costTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.eligible}
          value={formatCount(current.eligible)}
          subtext="Customers who qualified for an offer"
          icon={Users2}
          trend={eligibleTrend}
        >
          {targetGroup + controlGroup > 0 && (
            <SplitBar
              parts={[
                {
                  label: "Target group",
                  value: targetGroup,
                  color: colors.reportCharts.palette.color4,
                },
                {
                  label: "Control group",
                  value: controlGroup,
                  color: colors.reportCharts.palette.color3,
                },
              ]}
            />
          )}
        </KpiCard>
        <KpiCard
          label={OFFER_CVM_LABELS.offered}
          value={formatCount(current.offered)}
          subtext="Customers the offer was presented to"
          icon={Gift}
          trend={offeredTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.takenUp}
          value={formatCount(current.takenUp)}
          subtext="Customers who accepted the offer"
          icon={UserCheck}
          trend={takenUpTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.takeUpRate}
          value={formatRate(current.takeUpRate)}
          subtext="Share of offered customers who accepted"
          icon={HandCoins}
          trend={takeUpTrend}
        />
        <KpiCard
          label={OFFER_CVM_LABELS.fulfilled}
          value={formatCount(current.fulfilled)}
          subtext={`${formatRate(current.fulfilmentRate)} fulfilment of take-up`}
          icon={BadgeCheck}
          trend={fulfilledTrend}
        />
      </div>
    </section>
  );
}
