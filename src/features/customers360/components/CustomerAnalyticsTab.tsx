import {
  Activity,
  Gauge,
  Radio,
  ShieldCheck,
  Smartphone,
  Target,
  Users2,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { colors } from "../../../shared/utils/tokens";
import { tw } from "../../../shared/utils/utils";
import { formatCurrency } from "../../../shared/services/currencyService";
import ReportTrendsToolbar from "../../reports-analytics/components/ReportTrendsToolbar";
import SwitchableReportChart from "../../reports-analytics/components/SwitchableReportChart";
import { toChartAudit } from "../../reports-analytics/utils/reportTimeWindow";
import { formatCount, formatRate } from "../../reports-analytics/utils/campaignCvmMetrics";
import { useCustomerAnalytics } from "../hooks/useCustomerAnalytics";
import {
  hasAnalyticsWidgets,
  SUBSCRIBER_CVM_LABELS,
} from "../utils/customerAnalyticsHelpers";

type CustomerAnalyticsTabProps = {
  subscriberId?: string | number | null;
};

function KpiCard({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
}) {
  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm`}>
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5" style={{ color: colors.primary.accent }} />
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{subtext}</p>
    </div>
  );
}

function SideList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: Array<{ title: string; detail: string }>;
}) {
  return (
    <div className={`${tw.rounded} border border-gray-200 bg-white p-5 shadow-sm`}>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={`${row.title}-${row.detail}`} className="py-2.5">
              <p className="text-sm font-medium text-gray-900">{row.title}</p>
              <p className="text-xs text-gray-500">{row.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CustomerAnalyticsTab({
  subscriberId,
}: CustomerAnalyticsTabProps) {
  const { result, isLoading, error, timeWindow } = useCustomerAnalytics(
    subscriberId ?? undefined,
    Boolean(subscriberId),
  );
  const audit = toChartAudit(timeWindow.activeWindow);
  const { kpis } = result;

  if (isLoading && !hasAnalyticsWidgets(result)) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
        <p className="mt-3 text-sm text-gray-500">
          Loading subscriber CVM analytics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Subscriber Analytics
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Live view of this subscriber: engagement, touchpoints,
            conversions, consent, audience membership, and lifecycle.
          </p>
        </div>
        <ReportTrendsToolbar timeWindow={timeWindow} />
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}
      {result.warnings.map((warning) => (
        <div
          key={warning}
          className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
        >
          {warning}
        </div>
      ))}

      {!timeWindow.isTrendsView && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={Gauge}
            label={SUBSCRIBER_CVM_LABELS.engagementScore}
            value={
              kpis.engagementScore == null
                ? "—"
                : `${Math.round(kpis.engagementScore)} / 100`
            }
            subtext="Composite response to campaigns and channels"
          />
          <KpiCard
            icon={Target}
            label={SUBSCRIBER_CVM_LABELS.conversions}
            value={formatCount(kpis.conversions)}
            subtext={
              kpis.conversionRate == null
                ? "Offer redemptions and attributed conversions"
                : `${formatRate(kpis.conversionRate)} conversion rate`
            }
          />
          <KpiCard
            icon={Activity}
            label={SUBSCRIBER_CVM_LABELS.touchpoints}
            value={formatCount(kpis.touchpoints)}
            subtext="Inbound and outbound interactions in this window"
          />
          <KpiCard
            icon={Radio}
            label={SUBSCRIBER_CVM_LABELS.lifecycle}
            value={kpis.lifecycleStage || "—"}
            subtext={
              kpis.churnRisk == null
                ? "Current CVM lifecycle state"
                : `Churn risk ${Math.round(kpis.churnRisk)} / 100`
            }
          />
          <KpiCard
            icon={Users2}
            label={SUBSCRIBER_CVM_LABELS.audience}
            value={formatCount(kpis.segmentCount)}
            subtext="Active segment memberships for targeting"
          />
          <KpiCard
            icon={ShieldCheck}
            label={SUBSCRIBER_CVM_LABELS.consent}
            value={formatCount(kpis.optedInChannels)}
            subtext="Opted-in communication channels"
          />
          <KpiCard
            icon={Smartphone}
            label={SUBSCRIBER_CVM_LABELS.devices}
            value={formatCount(kpis.deviceCount)}
            subtext="Handsets and sessions on this subscription"
          />
          <KpiCard
            icon={Wallet}
            label={SUBSCRIBER_CVM_LABELS.clv}
            value={
              kpis.clv == null ? "—" : formatCurrency(kpis.clv)
            }
            subtext={
              kpis.preferredChannel
                ? `Preferred channel: ${kpis.preferredChannel}`
                : "Expected lifetime value of this subscriber"
            }
          />
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <SwitchableReportChart
          title="Activity Timeline"
          subtitle="Subscriber activity and event volume across the selected window"
          filename="subscriber-activity.csv"
          columns={[
            { key: "period", label: "Period" },
            { key: "value", label: "Events" },
          ]}
          rows={result.activitySeries}
          xKey="period"
          series={[
            {
              dataKey: "value",
              name: "Events",
              color: colors.reportCharts.palette.color1,
            },
          ]}
          yLabel="Events"
          emptyMessage="No activity recorded in this window"
          audit={audit}
        />
        <SwitchableReportChart
          title="Engagement by Channel"
          subtitle="How this subscriber responds on SMS, email, push, and other channels"
          filename="subscriber-engagement-by-channel.csv"
          columns={[
            { key: "channel", label: "Channel" },
            { key: "sent", label: "Sent" },
            { key: "delivered", label: "Delivered" },
            { key: "engaged", label: "Engaged" },
            { key: "engagementRate", label: "Engagement rate" },
          ]}
          rows={result.engagementByChannel}
          xKey="channel"
          series={[
            {
              dataKey: "engagementRate",
              name: "Engagement rate",
              color: colors.reportCharts.palette.color4,
            },
          ]}
          yLabel="Engagement rate (%)"
          emptyMessage="No channel engagement in this window"
          audit={audit}
        />
        <SwitchableReportChart
          title="Conversion Funnel"
          subtitle="CVM path from reach to conversion for this subscriber"
          filename="subscriber-conversion-funnel.csv"
          columns={[
            { key: "stage", label: "Stage" },
            { key: "count", label: "Count" },
          ]}
          rows={result.conversionFunnel}
          xKey="stage"
          series={[
            {
              dataKey: "count",
              name: "Count",
              color: colors.reportCharts.palette.color2,
            },
          ]}
          yLabel="Count"
          emptyMessage="No conversion funnel for this subscriber"
          audit={audit}
          defaultView="bar"
        />
        <SwitchableReportChart
          title="Touchpoints by Channel"
          subtitle="Where this subscriber is reachable and actually touched"
          filename="subscriber-touchpoints.csv"
          columns={[
            { key: "name", label: "Channel" },
            { key: "value", label: "Touchpoints" },
          ]}
          rows={
            result.touchpointsByChannel.length
              ? result.touchpointsByChannel
              : result.activityByChannel
          }
          xKey="name"
          series={[
            {
              dataKey: "value",
              name: "Touchpoints",
              color: colors.reportCharts.palette.color3,
            },
          ]}
          yLabel="Touchpoints"
          emptyMessage="No touchpoints in this window"
          audit={audit}
        />
      </section>

      {(result.conversionSeries.length > 0 ||
        result.engagementSeries.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {result.engagementSeries.length > 0 && (
            <SwitchableReportChart
              title="Engagement Trend"
              subtitle="Engagement score or responses over time"
              filename="subscriber-engagement-trend.csv"
              columns={[
                { key: "period", label: "Period" },
                { key: "value", label: "Engagement" },
              ]}
              rows={result.engagementSeries}
              xKey="period"
              series={[
                {
                  dataKey: "value",
                  name: "Engagement",
                  color: colors.reportCharts.palette.color4,
                },
              ]}
              defaultView="line"
              views={["line", "bar", "area"]}
              audit={audit}
            />
          )}
          {result.conversionSeries.length > 0 && (
            <SwitchableReportChart
              title="Conversion Trend"
              subtitle="Attributed conversions and offer redemptions"
              filename="subscriber-conversion-trend.csv"
              columns={[
                { key: "period", label: "Period" },
                { key: "value", label: "Conversions" },
              ]}
              rows={result.conversionSeries}
              xKey="period"
              series={[
                {
                  dataKey: "value",
                  name: "Conversions",
                  color: colors.reportCharts.palette.color2,
                },
              ]}
              defaultView="line"
              views={["line", "bar", "area"]}
              audit={audit}
            />
          )}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <SideList
          title="Audience membership"
          empty="This subscriber is not in a reported segment for this window."
          rows={result.segments.map((item) => ({
            title: item.name,
            detail: [item.type, item.addedAt].filter(Boolean).join(" · "),
          }))}
        />
        <SideList
          title="Channel consent"
          empty="No consent records returned for this subscriber."
          rows={result.consent.map((item) => ({
            title: item.channel,
            detail:
              item.optedIn == null
                ? item.status
                : `${item.status} · ${item.optedIn ? "Opted in" : "Opted out"}`,
          }))}
        />
        <SideList
          title="Devices"
          empty="No devices reported on this subscription."
          rows={result.devices.map((item) => ({
            title: item.name,
            detail: [item.type, item.status, item.lastSeen]
              .filter(Boolean)
              .join(" · "),
          }))}
        />
      </section>
    </div>
  );
}
