import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  HandCoins,
  MessageCircle,
  TrendingUp,
  UserMinus,
  Users2,
} from "lucide-react";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { resolveHeroTrend } from "../utils/campaignReportQuery";
import type { KpiTrendFormat } from "../utils/campaignCvmMetrics";
import type { SmsDeliveryReportTrend } from "../types/ReportsAPI";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  previousSmsSnapshot,
  SMS_CVM_LABELS,
  smsCvmSnapshot,
  type KpiTrend,
  type SmsCvmSnapshot,
} from "../utils/smsCvmMetrics";

type SmsDeliveryKpiGridProps = {
  summary?: SmsCvmSnapshot | Record<string, unknown> | null;
  heroTrends?: {
    sent?: SmsDeliveryReportTrend;
    delivered?: SmsDeliveryReportTrend;
    deliveryRate?: SmsDeliveryReportTrend;
    failedRate?: SmsDeliveryReportTrend;
    subscribersReached?: SmsDeliveryReportTrend;
    takenUp?: SmsDeliveryReportTrend;
    takeUpRate?: SmsDeliveryReportTrend;
    optOutRate?: SmsDeliveryReportTrend;
  };
  useDummyData?: boolean;
};

function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  trend: KpiTrend;
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
    </div>
  );
}

function kpiTrend(
  current: number,
  previous: number | undefined,
  format: KpiTrendFormat,
  apiTrend: SmsDeliveryReportTrend | undefined,
  useDummyData: boolean,
): KpiTrend {
  if (!useDummyData) {
    const resolved = resolveHeroTrend(apiTrend);
    if (resolved.value !== "—") return resolved;
  }
  return computeDeltaTrend(current, previous, format);
}

export default function SmsDeliveryKpiGrid({
  summary,
  heroTrends,
  useDummyData = false,
}: SmsDeliveryKpiGridProps) {
  const current = smsCvmSnapshot(summary);
  const previous = useDummyData ? previousSmsSnapshot(current) : undefined;

  const cards: Array<{
    label: string;
    value: string;
    subtext: string;
    icon: LucideIcon;
    trend: KpiTrend;
  }> = [
    {
      label: SMS_CVM_LABELS.dispatched,
      value: formatCount(current.sent),
      subtext: "Messages handed to the SMS channel",
      icon: MessageCircle,
      trend: kpiTrend(current.sent, previous?.sent, "percent", heroTrends?.sent, useDummyData),
    },
    {
      label: SMS_CVM_LABELS.delivered,
      value: formatCount(current.delivered),
      subtext: "Confirmed on the subscriber handset",
      icon: CheckCircle2,
      trend: kpiTrend(
        current.delivered,
        previous?.delivered,
        "percent",
        heroTrends?.delivered,
        useDummyData,
      ),
    },
    {
      label: SMS_CVM_LABELS.deliveryRate,
      value: formatRate(current.deliveryRate),
      subtext: "Delivered as a share of dispatched",
      icon: TrendingUp,
      trend: kpiTrend(
        current.deliveryRate,
        previous?.deliveryRate,
        "points",
        heroTrends?.deliveryRate,
        useDummyData,
      ),
    },
    {
      label: SMS_CVM_LABELS.failedRate,
      value: formatRate(current.failedRate),
      subtext: "Undelivered, rejected, or expired",
      icon: AlertTriangle,
      trend: kpiTrend(
        current.failedRate,
        previous?.failedRate,
        "points",
        heroTrends?.failedRate,
        useDummyData,
      ),
    },
    {
      label: SMS_CVM_LABELS.subscribersReached,
      value: formatCount(current.subscribersReached),
      subtext: "Distinct subscribers who received the SMS",
      icon: Users2,
      trend: kpiTrend(
        current.subscribersReached,
        previous?.subscribersReached,
        "percent",
        heroTrends?.subscribersReached,
        useDummyData,
      ),
    },
    {
      label: SMS_CVM_LABELS.takenUp,
      value: formatCount(current.takenUp),
      subtext: "Offer take-up attributed to delivered SMS",
      icon: HandCoins,
      trend: kpiTrend(
        current.takenUp,
        previous?.takenUp,
        "percent",
        heroTrends?.takenUp,
        useDummyData,
      ),
    },
    {
      label: SMS_CVM_LABELS.takeUpRate,
      value: formatRate(current.takeUpRate),
      subtext: "Take-up as a share of delivered SMS",
      icon: TrendingUp,
      trend: kpiTrend(
        current.takeUpRate,
        previous?.takeUpRate,
        "points",
        heroTrends?.takeUpRate,
        useDummyData,
      ),
    },
    {
      label: SMS_CVM_LABELS.optOutRate,
      value: formatRate(current.optOutRate),
      subtext: "Subscribers who opted out of the SMS channel",
      icon: UserMinus,
      trend: kpiTrend(
        current.optOutRate,
        previous?.optOutRate,
        "points",
        heroTrends?.optOutRate,
        useDummyData,
      ),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
