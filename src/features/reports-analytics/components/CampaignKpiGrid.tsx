import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CheckCircle2,
  CircleDollarSign,
  Send,
  ShieldCheck,
  TrendingUp,
  Users2,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "../../../shared/services/currencyService";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { resolveHeroTrend } from "../utils/campaignReportQuery";
import { previousPeriodSummary } from "../utils/campaignReportDummy";
import { formatAudienceShare } from "../utils/normalizeCampaignReport";
import {
  audienceSplit,
  computeDeltaTrend,
  convertedFrom,
  costPerConversion,
  CVM_METRIC_LABELS,
  formatCount,
  formatRate,
  romiFrom,
  sentByChannel,
  valuePerConversion,
  type KpiTrend,
  type KpiTrendFormat,
} from "../utils/campaignCvmMetrics";
import type {
  CampaignReportTrend,
  CampaignReportsResponse,
} from "../types/ReportsAPI";

type CampaignKpiGridProps = {
  summary: CampaignReportsResponse["summary"];
  channelReach?: CampaignReportsResponse["channelReach"];
  heroTrends?: CampaignReportsResponse["heroTrends"];
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
  apiTrend: CampaignReportTrend | undefined,
  useDummyData: boolean,
): KpiTrend {
  if (!useDummyData) {
    const resolved = resolveHeroTrend(apiTrend);
    if (resolved.value !== "—") return resolved;
  }
  return computeDeltaTrend(current, previous, format);
}

export default function CampaignKpiGrid({
  summary,
  channelReach = [],
  heroTrends,
  useDummyData = false,
}: CampaignKpiGridProps) {
  const split = audienceSplit(summary);
  const channelSent = sentByChannel(channelReach);
  const converted = convertedFrom(summary);
  const romi = romiFrom(summary);
  const previous = useDummyData ? previousPeriodSummary(summary) : undefined;
  const previousConverted = previous ? convertedFrom(previous) : undefined;
  const previousRomi = previous ? romiFrom(previous) : undefined;

  const audienceTrend = kpiTrend(
    split.uniqueAudience,
    previous?.uniqueAudience,
    "percent",
    heroTrends?.uniqueAudience || heroTrends?.reach,
    useDummyData,
  );
  const sentTrend = kpiTrend(
    summary.sent,
    previous?.sent,
    "percent",
    heroTrends?.sent,
    useDummyData,
  );
  const deliveredTrend = kpiTrend(
    summary.delivered,
    previous?.delivered,
    "percent",
    heroTrends?.delivered,
    useDummyData,
  );
  const deliveryTrend = kpiTrend(
    summary.deliveryRate,
    previous?.deliveryRate,
    "points",
    heroTrends?.deliveryRate,
    useDummyData,
  );
  const convertedTrend = kpiTrend(
    converted,
    previousConverted,
    "percent",
    heroTrends?.converted || heroTrends?.conversions,
    useDummyData,
  );
  const conversionTrend = kpiTrend(
    summary.conversionRate,
    previous?.conversionRate,
    "points",
    heroTrends?.conversionRate,
    useDummyData,
  );
  const valueTrend = kpiTrend(
    summary.revenue,
    previous?.revenue,
    "compact",
    heroTrends?.revenue,
    useDummyData,
  );
  const romiTrend = kpiTrend(
    romi,
    previousRomi,
    "multiplier",
    heroTrends?.romi || heroTrends?.roas,
    useDummyData,
  );
  const costTrend = kpiTrend(
    summary.campaignCost,
    previous?.campaignCost,
    "compact",
    heroTrends?.campaignCost,
    useDummyData,
  );

  const sentShareLabel = channelSent.length
    ? channelSent
        .slice(0, 3)
        .map((row) => `${row.channel} ${Math.round(row.share * 100)}%`)
        .join(" · ")
    : "No channel volume in this window";

  return (
    <section className="space-y-3">
      <p className="text-xs text-gray-500">
        Overview pairs commercial CVM outcomes (value generated, ROMI, campaign
        cost) with unique-customer delivery. Corner figures are vs the previous
        window of the same length.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label={CVM_METRIC_LABELS.valueGenerated}
          value={formatCurrency(summary.revenue)}
          subtext={`Avg ${formatCurrency(valuePerConversion(summary), { decimals: 0 })} per conversion`}
          icon={CircleDollarSign}
          trend={valueTrend}
        />
        <KpiCard
          label={CVM_METRIC_LABELS.romi}
          value={`${(Number.isFinite(romi) ? romi : 0).toFixed(1)}x`}
          subtext={`Campaign cost ${formatCurrency(summary.campaignCost)}`}
          icon={TrendingUp}
          trend={romiTrend}
        />
        <KpiCard
          label={CVM_METRIC_LABELS.campaignCost}
          value={formatCurrency(summary.campaignCost)}
          subtext={`Cost per conversion ${formatCurrency(costPerConversion(summary), { decimals: 2 })}`}
          icon={Wallet}
          trend={costTrend}
        />

        <KpiCard
          label={CVM_METRIC_LABELS.audienceReached}
          value={formatCount(split.uniqueAudience)}
          subtext={`${formatAudienceShare(split.uniqueAudience, summary.eligibleAudience)} of ${formatCount(summary.eligibleAudience)} eligible · unique customers`}
          icon={Users2}
          trend={audienceTrend}
        >
          <SplitBar
            parts={[
              {
                label: "Target group",
                value: split.targetReached,
                color: colors.reportCharts.palette.color4,
              },
              {
                label: "Control group",
                value: split.controlReached,
                color: colors.reportCharts.palette.color3,
              },
            ]}
          />
        </KpiCard>

        <KpiCard
          label={CVM_METRIC_LABELS.sent}
          value={formatCount(summary.sent)}
          subtext={`Total messages dispatched · ${sentShareLabel}`}
          icon={Send}
          trend={sentTrend}
        >
          <SplitBar
            parts={channelSent.map((row, index) => ({
              label: row.channel,
              value: row.sent,
              color:
                [
                  colors.reportCharts.palette.color4,
                  colors.reportCharts.palette.color1,
                  colors.reportCharts.palette.color2,
                  colors.reportCharts.palette.color3,
                  colors.reportCharts.palette.color6,
                  colors.reportCharts.palette.color5,
                  "#64748b",
                ][index % 7],
            }))}
          />
        </KpiCard>

        <KpiCard
          label={CVM_METRIC_LABELS.delivered}
          value={formatCount(summary.delivered)}
          subtext="Customers the message was delivered to"
          icon={ShieldCheck}
          trend={deliveredTrend}
        />

        <KpiCard
          label={CVM_METRIC_LABELS.deliveryRate}
          value={formatRate(summary.deliveryRate)}
          subtext={`${formatCount(summary.delivered)} delivered of ${formatCount(summary.sent)} sent`}
          icon={CheckCircle2}
          trend={deliveryTrend}
        />

        <KpiCard
          label={CVM_METRIC_LABELS.converted}
          value={formatCount(converted)}
          subtext="Customers who completed the campaign outcome"
          icon={Activity}
          trend={convertedTrend}
        />

        <KpiCard
          label={CVM_METRIC_LABELS.conversionRate}
          value={formatRate(summary.conversionRate)}
          subtext={`${formatCount(converted)} converted of ${formatCount(summary.delivered)} delivered`}
          icon={Activity}
          trend={conversionTrend}
        />
      </div>
    </section>
  );
}
