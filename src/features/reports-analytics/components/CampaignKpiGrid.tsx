import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CheckCircle2,
  Send,
  ShieldCheck,
  Users2,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { resolveHeroTrend } from "../utils/campaignReportQuery";
import { formatAudienceShare } from "../utils/normalizeCampaignReport";
import {
  audienceSplit,
  formatCount,
  formatRate,
  sentByChannel,
  CVM_METRIC_LABELS,
} from "../utils/campaignCvmMetrics";
import type { CampaignReportsResponse } from "../types/ReportsAPI";

type HeroTrend = {
  value: string;
  direction: "up" | "down";
};

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
  trend: HeroTrend;
  children?: ReactNode;
}) {
  const trendColor =
    trend.direction === "up"
      ? "text-emerald-600"
      : trend.direction === "down"
        ? "text-red-600"
        : "text-gray-500";

  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: colors.primary.accent }} />
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        <span className={`text-xs font-semibold ${trendColor}`}>
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "•"}{" "}
          {trend.value}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtext}</p>
      {children}
    </div>
  );
}

const dummyTrends: Record<string, HeroTrend> = {
  audience: { value: "+8.4%", direction: "up" },
  sent: { value: "+6.1%", direction: "up" },
  delivered: { value: "+5.8%", direction: "up" },
  deliveryRate: { value: "+0.4 pts", direction: "up" },
  converted: { value: "+3.2%", direction: "up" },
  conversionRate: { value: "-0.4 pts", direction: "down" },
};

export default function CampaignKpiGrid({
  summary,
  channelReach = [],
  heroTrends,
  useDummyData = false,
}: CampaignKpiGridProps) {
  const split = audienceSplit(summary);
  const channelSent = sentByChannel(channelReach);
  const converted = summary.converted || summary.conversions;
  const deliveryTrend = useDummyData
    ? dummyTrends.deliveryRate
    : resolveHeroTrend(heroTrends?.deliveryRate || heroTrends?.delivered);
  const audienceTrend = useDummyData
    ? dummyTrends.audience
    : resolveHeroTrend(heroTrends?.uniqueAudience || heroTrends?.reach);
  const sentTrend = useDummyData
    ? dummyTrends.sent
    : resolveHeroTrend(heroTrends?.sent);
  const deliveredTrend = useDummyData
    ? dummyTrends.delivered
    : resolveHeroTrend(heroTrends?.delivered);
  const convertedTrend = useDummyData
    ? dummyTrends.converted
    : resolveHeroTrend(heroTrends?.converted || heroTrends?.conversions);
  const conversionTrend = useDummyData
    ? dummyTrends.conversionRate
    : resolveHeroTrend(heroTrends?.conversionRate);

  const sentShareLabel = channelSent.length
    ? channelSent
        .slice(0, 3)
        .map((row) => `${row.channel} ${Math.round(row.share * 100)}%`)
        .join(" · ")
    : "No channel volume in this window";

  return (
    <section className="space-y-3">
      <p className="text-xs text-gray-500">
        Audience metrics are de-duplicated by unique customer identifier. Unique
        customers reached is not the same as total messages sent.
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
