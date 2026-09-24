import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Layers3,
  Mail,
  MessageSquare,
  RefreshCw,
  Tag,
  Target,
  Users,
} from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { formatCurrency } from "../../../shared/services/currencyService";
import { formatNumber } from "../../../shared/services/numberService";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { useLanguage } from "../../../contexts/LanguageContext";
import ReportTrendsToolbar from "../components/ReportTrendsToolbar";
import SwitchableReportChart from "../components/SwitchableReportChart";
import { useReportTimeWindow } from "../hooks/useReportTimeWindow";
import { fetchOverallPortfolio, loadOverallDashboard } from "../services/overallDashboardService";
import {
  computeDeltaTrend,
  formatCount,
  formatRate,
  type KpiTrend,
} from "../utils/campaignCvmMetrics";
import {
  buildOverallDummy,
  composeOverallPortfolio,
  domainDescription,
  domainLabel,
  OVERALL_CVM_LABELS,
  OVERALL_DOMAIN_ROUTES,
  sourceFailures,
} from "../utils/overallCvmMetrics";
import type { OverallDashboardPerformanceResponse } from "../types/ReportsAPI";
import { toChartAudit } from "../utils/reportTimeWindow";

const DOMAIN_ICONS = {
  campaigns: Target,
  offers: Tag,
  email: Mail,
  sms: MessageSquare,
  segments: Layers3,
  profiles: Users,
} as const;

function trendFor(
  current: number,
  previous: number | null,
  format: "percent" | "compact" | "points" | "multiplier",
): KpiTrend {
  if (previous == null) return { value: "—", direction: "flat" };
  return computeDeltaTrend(current, previous, format);
}

export default function OverallDashboardPerformancePage() {
  const { t } = useLanguage();
  const timeWindow = useReportTimeWindow({
    overviewPreset: "weekly",
    defaultTrendsPreset: "daily",
  });
  const {
    isTrendsView,
    scaleFactor,
    grain,
    queryParams,
    comparePreviousPeriod,
    previousQueryParams,
  } = timeWindow;
  const windowKey = [
    queryParams.startDate,
    queryParams.endDate,
    queryParams.grain,
    queryParams.preset,
    queryParams.range,
  ].join("|");
  const previousWindowKey = [
    previousQueryParams.startDate,
    previousQueryParams.endDate,
    previousQueryParams.grain,
    previousQueryParams.preset,
    previousQueryParams.range,
  ].join("|");
  const [useDummyData, setUseDummyData] = useState(true);
  const [livePortfolio, setLivePortfolio] = useState<OverallDashboardPerformanceResponse | null>(null);
  const [previousPortfolio, setPreviousPortfolio] = useState<OverallDashboardPerformanceResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (useDummyData) return;
    let cancelled = false;
    setIsLoading(true);
    const loadWindow = async (params: typeof queryParams) => {
      try {
        return await fetchOverallPortfolio(params);
      } catch {
        const sources = await loadOverallDashboard(params);
        return {
          ...composeOverallPortfolio(sources),
          sourceErrors: sourceFailures(sources),
        };
      }
    };
    const requests: Array<Promise<void>> = [
      loadWindow(queryParams).then((portfolio) => {
        if (!cancelled) setLivePortfolio(portfolio);
      }),
    ];
    if (comparePreviousPeriod) {
      requests.push(
        loadWindow(previousQueryParams).then((portfolio) => {
          if (!cancelled) setPreviousPortfolio(portfolio);
        }),
      );
    } else {
      setPreviousPortfolio(null);
    }
    Promise.all(requests).finally(() => {
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // windowKey / previousWindowKey are the stable identity of the query objects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDummyData, windowKey, previousWindowKey, comparePreviousPeriod, reloadKey]);

  const portfolio = useMemo(() => {
    if (useDummyData) return buildOverallDummy({ scale: scaleFactor, grain });
    return livePortfolio;
  }, [useDummyData, scaleFactor, grain, livePortfolio]);

  const previous = useMemo(() => {
    if (useDummyData) return buildOverallDummy({ scale: scaleFactor, grain, reference: true });
    if (!comparePreviousPeriod) return null;
    return previousPortfolio;
  }, [useDummyData, scaleFactor, grain, comparePreviousPeriod, previousPortfolio]);

  const failures = useDummyData ? [] : portfolio?.sourceErrors || [];
  const chartAudit = toChartAudit(timeWindow.activeWindow);
  const channelColors = colors.reportCharts.overallPerformance.channelPerformance;
  const channelPalette = [
    channelColors.dispatched,
    channelColors.takenUp,
    channelColors.takeUpRate,
    colors.reportCharts.overallPerformance.emailDelivery.sent,
    colors.reportCharts.overallPerformance.emailDelivery.delivered,
    colors.reportCharts.overallPerformance.smsDelivery.delivered,
    colors.reportCharts.overallPerformance.emailDelivery.takenUp,
  ];

  const heroCards: Array<{ label: string; value: string; subtext: string; trend: KpiTrend }> = !portfolio ? [] : [
    {
      label: OVERALL_CVM_LABELS.subscribersReached,
      value: formatCount(portfolio.subscribersReached),
      subtext: "Unique customers from campaigns, else SMS plus email",
      trend: trendFor(portfolio.subscribersReached, previous?.subscribersReached ?? null, "percent"),
    },
    {
      label: OVERALL_CVM_LABELS.dispatched,
      value: formatCount(portfolio.dispatched),
      subtext: "Messages sent on every communication channel",
      trend: trendFor(portfolio.dispatched, previous?.dispatched ?? null, "compact"),
    },
    {
      label: OVERALL_CVM_LABELS.delivered,
      value: formatCount(portfolio.delivered),
      subtext: "Messages that reached the subscriber",
      trend: trendFor(portfolio.delivered, previous?.delivered ?? null, "compact"),
    },
    {
      label: OVERALL_CVM_LABELS.deliveryRate,
      value: formatRate(portfolio.deliveryRate),
      subtext: "Delivered versus dispatched",
      trend: trendFor(portfolio.deliveryRate, previous?.deliveryRate ?? null, "points"),
    },
    {
      label: OVERALL_CVM_LABELS.takenUp,
      value: formatCount(portfolio.takenUp),
      subtext: "Offers accepted in the window",
      trend: trendFor(portfolio.takenUp, previous?.takenUp ?? null, "compact"),
    },
    {
      label: OVERALL_CVM_LABELS.takeUpRate,
      value: formatRate(portfolio.takeUpRate),
      subtext: "Taken up versus offered",
      trend: trendFor(portfolio.takeUpRate, previous?.takeUpRate ?? null, "points"),
    },
    {
      label: OVERALL_CVM_LABELS.valueGenerated,
      value: formatCurrency(portfolio.valueGenerated),
      subtext: "Value from offers taken up",
      trend: trendFor(portfolio.valueGenerated, previous?.valueGenerated ?? null, "percent"),
    },
    {
      label: OVERALL_CVM_LABELS.romi,
      value: `${portfolio.romi.toFixed(1)}x`,
      subtext: "Value generated versus reward cost",
      trend: trendFor(portfolio.romi, previous?.romi ?? null, "multiplier"),
    },
  ];

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <BackButton
          showBreadcrumb
          currentLabel={t.sidebar.navigation.overallDashboardPerformance}
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t.sidebar.navigation.overallDashboardPerformance}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Campaigns, offers, every communication channel, segments, and subscriber value for the selected window
          </p>
        </div>
        <ReportTrendsToolbar
          timeWindow={timeWindow}
          extraActions={
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5`}
              >
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Data Mode:</span>
                <button
                  type="button"
                  onClick={() => setUseDummyData((current) => !current)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    useDummyData ? "bg-[#252829]" : "bg-gray-300"
                  }`}
                  aria-pressed={useDummyData}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      useDummyData ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-xs text-gray-600 whitespace-nowrap">
                  {useDummyData ? "Dummy Data" : isLoading ? "Real Data (loading…)" : "Real Data"}
                </span>
              </div>
              {!useDummyData && (
                <button
                  type="button"
                  onClick={() => setReloadKey((value) => value + 1)}
                  disabled={isLoading}
                  className={`inline-flex items-center gap-2 ${tw.rounded} border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-60`}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  Reload
                </button>
              )}
            </div>
          }
        />
      </header>

      {failures.length > 0 && (
        <div className={`${tw.rounded} border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900`}>
          <p className="font-medium">Some report sources did not load. The rest of the portfolio is still shown.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {failures.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {portfolio && !isTrendsView && (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {heroCards.map((card) => {
              const trendColor =
                card.trend.direction === "up"
                  ? "text-emerald-600"
                  : card.trend.direction === "down"
                    ? "text-red-600"
                    : "text-gray-500";
              const mark =
                card.trend.direction === "up" ? "↑" : card.trend.direction === "down" ? "↓" : "•";
              return (
                <article key={card.label} className={`${tw.rounded} border border-gray-200 bg-white p-5 shadow-sm`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-gray-600">{card.label}</p>
                    <span className={`text-xs font-semibold ${trendColor}`}>
                      {mark} {card.trend.value}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{card.subtext}</p>
                </article>
              );
            })}
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {portfolio.domains.map((domain) => {
              const Icon = DOMAIN_ICONS[domain.id];
              return (
                <Link
                  key={domain.id}
                  to={OVERALL_DOMAIN_ROUTES[domain.id]}
                  className={`${tw.rounded} border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5" style={{ color: colors.primary.accent }} />
                      <h2 className="text-base font-semibold text-gray-900">{domainLabel(domain.id)}</h2>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{domainDescription(domain.id)}</p>
                  {domain.available ? (
                    <dl className="mt-4 grid grid-cols-3 gap-3">
                      {domain.metrics.map((item) => (
                        <div key={item.label}>
                          <dt className="text-xs text-gray-500">{item.label}</dt>
                          <dd className="mt-1 text-sm font-semibold text-gray-900">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-4 text-sm text-amber-700">Unavailable for this window</p>
                  )}
                </Link>
              );
            })}
          </section>

          <section className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
            <h2 className="text-lg font-semibold text-gray-900">Subscriber base</h2>
            <p className="mt-1 text-sm text-gray-600">
              {formatCount(portfolio.activeSubscribers)} active subscribers · {formatCount(portfolio.segmentPortfolio)} segments · ARPU {formatCurrency(portfolio.arpu)} · churn {formatRate(portfolio.churnRate)}
            </p>
            <div className="mt-4 space-y-2">
              {portfolio.valueBands.map((band) => {
                const total = portfolio.valueBands.reduce((sum, item) => sum + item.subscribers, 0);
                const width = total ? (band.subscribers / total) * 100 : 0;
                return (
                  <div key={band.segment} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-sm">
                    <span className="text-gray-700">{band.segment}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${width}%`, backgroundColor: colors.primary.accent }}
                      />
                    </span>
                    <span className="text-right font-medium text-gray-900">{formatNumber(band.subscribers)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {portfolio && isTrendsView && (
        <section className="space-y-6">
          <SwitchableReportChart
            title={OVERALL_CVM_LABELS.channelPerformance}
            subtitle="Dispatch, delivery, and take-up for each communication channel"
            filename="overall-channel-performance"
            audit={chartAudit}
            xKey="channel"
            yLabel="Messages"
            rightYLabel="Rate (%)"
            yTickFormatter={(value) => formatNumber(value)}
            rightTickFormatter={(value) => `${value}%`}
            columns={[
              { key: "channel", label: "Channel" },
              { key: "dispatched", label: OVERALL_CVM_LABELS.dispatched },
              { key: "delivered", label: OVERALL_CVM_LABELS.delivered },
              { key: "subscribersReached", label: OVERALL_CVM_LABELS.subscribersReached },
              { key: "takenUp", label: OVERALL_CVM_LABELS.takenUp },
              { key: "deliveryRate", label: OVERALL_CVM_LABELS.deliveryRate },
              { key: "takeUpRate", label: OVERALL_CVM_LABELS.takeUpRate },
              { key: "optOutRate", label: OVERALL_CVM_LABELS.optOutRate },
            ]}
            rows={portfolio.channels}
            series={[
              { dataKey: "dispatched", name: "Dispatched", color: channelColors.dispatched },
              { dataKey: "delivered", name: "Delivered", color: channelColors.delivered },
              { dataKey: "takenUp", name: "Taken Up", color: channelColors.takenUp },
              {
                dataKey: "deliveryRate",
                name: "Delivery Rate",
                color: channelColors.deliveryRate,
                axis: "right",
              },
              {
                dataKey: "takeUpRate",
                name: "Take-up Rate",
                color: channelColors.takeUpRate,
                axis: "right",
              },
            ]}
          />
          <SwitchableReportChart
            title={OVERALL_CVM_LABELS.offerLifecycle}
            subtitle="Eligible, offered, taken up, and fulfilled"
            filename="overall-offer-lifecycle"
            audit={chartAudit}
            xKey="stage"
            yLabel="Subscribers"
            yTickFormatter={(value) => formatNumber(value)}
            columns={[
              { key: "stage", label: "Stage" },
              { key: "value", label: "Subscribers" },
            ]}
            rows={portfolio.offerLifecycle}
            series={[{ dataKey: "value", name: "Subscribers", color: channelColors.takenUp }]}
          />
          <SwitchableReportChart
            title={OVERALL_CVM_LABELS.deliveryTrend}
            subtitle="Messages dispatched on each communication channel"
            filename="overall-delivery-trend"
            audit={chartAudit}
            xKey="period"
            yLabel="Messages"
            yTickFormatter={(value) => formatNumber(value)}
            columns={[
              { key: "period", label: "Period" },
              ...portfolio.channels.map((row) => ({ key: row.channel, label: row.channel })),
            ]}
            rows={portfolio.deliveryTimeline.map((point) => {
              const row: Record<string, string | number> = { period: point.period };
              for (const channel of portfolio.channels) {
                const match = point.channels.find((item) => item.channel === channel.channel);
                row[channel.channel] = match?.dispatched ?? 0;
              }
              return row;
            })}
            series={portfolio.channels.map((row, index) => ({
              dataKey: row.channel,
              name: row.channel,
              color: channelPalette[index % channelPalette.length],
            }))}
          />
        </section>
      )}

      {!portfolio && isLoading && (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
