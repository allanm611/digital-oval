import { formatCurrency } from "../../../shared/services/currencyService";
import type {
  CampaignReportsResponse,
  CustomerProfileReportsResponse,
  DeliveryEmailReportsResponse,
  DeliverySMSReportsResponse,
  OfferReportsResponse,
  OverallChannelPerformance,
  OverallDashboardPerformanceResponse,
  OverallDeliveryPoint,
  OverallDomainSnapshot,
  OverallReportDomain,
  ReportGrain,
  SegmentReportsResponse,
} from "../types/ReportsAPI";
import {
  convertedFrom,
  deliveryRateFrom,
  formatCount,
  formatRate,
  ratePercent,
  romiFrom,
} from "./campaignCvmMetrics";
import { emailCvmSnapshot } from "./emailCvmMetrics";
import { smsCvmSnapshot } from "./smsCvmMetrics";
import { offerCvmSnapshot, OFFER_FUNNEL_STAGES } from "./offerCvmMetrics";
import { asFiniteNumber, CAMPAIGN_CHANNEL_CATALOG } from "./normalizeCampaignReport";
import { segmentCvmSnapshot } from "./segmentCvmMetrics";
import { aggregateValueBands, subscriberCvmSnapshot } from "./subscriberCvmMetrics";

export const OVERALL_CVM_LABELS = {
  subscribersReached: "Subscribers Reached",
  dispatched: "Messages Dispatched",
  delivered: "Delivered",
  deliveryRate: "Delivery Rate",
  takenUp: "Taken Up",
  takeUpRate: "Take-up Rate",
  valueGenerated: "Value Generated",
  romi: "ROMI",
  activeSubscribers: "Active Subscribers",
  segmentPortfolio: "Segment Portfolio",
  subscriberBase: "Subscriber Base",
  campaigns: "Campaigns",
  offers: "Offers",
  emailDelivery: "Delivery & Email",
  smsDelivery: "Delivery & SMS",
  segments: "Segments",
  customerProfiles: "Customer Profiles",
  channelPerformance: "Channel Performance",
  offerLifecycle: "Offer Lifecycle",
  deliveryTrend: "Delivery Trend",
  optOutRate: "Opt-out Rate",
  arpu: "ARPU",
  churnRate: "Churn Rate",
} as const;

export const OVERALL_DOMAIN_ROUTES: Record<OverallReportDomain, string> = {
  campaigns: "/reports/campaigns",
  offers: "/reports/offers",
  email: "/reports/email-delivery",
  sms: "/reports/delivery",
  segments: "/reports/segments",
  profiles: "/reports/customer-profiles",
};

export type OverallSource<T> = {
  id: OverallReportDomain;
  ok: boolean;
  data: T | null;
  error: string | null;
};

export type OverallLiveSources = {
  campaigns: OverallSource<Partial<CampaignReportsResponse>>;
  offers: OverallSource<Partial<OfferReportsResponse>>;
  email: OverallSource<DeliveryEmailReportsResponse>;
  sms: OverallSource<DeliverySMSReportsResponse>;
  segments: OverallSource<SegmentReportsResponse>;
  profiles: OverallSource<CustomerProfileReportsResponse>;
};

const DOMAIN_ORDER: OverallReportDomain[] = [
  "campaigns",
  "offers",
  "email",
  "sms",
  "segments",
  "profiles",
];

function scaleCount(value: number, factor: number): number {
  return Math.round(value * factor);
}

function periodsFor(grain: ReportGrain): string[] {
  if (grain === "monthly") return ["Month 1", "Month 2", "Month 3"];
  if (grain === "weekly") return ["Week 1", "Week 2", "Week 3", "Week 4"];
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
}

function metric(label: string, value: string): { label: string; value: string } {
  return { label, value };
}

function unavailableDomain(id: OverallReportDomain): OverallDomainSnapshot {
  return { id, available: false, metrics: [] };
}

const DUMMY_CHANNEL_SEEDS: Array<{
  channel: (typeof CAMPAIGN_CHANNEL_CATALOG)[number];
  share: number;
  deliveryRate: number;
  reachShare: number;
  takeUpRate: number;
  optOutRate: number;
}> = [
  { channel: "Email", share: 0.28, deliveryRate: 0.961, reachShare: 0.82, takeUpRate: 0.071, optOutRate: 0.8 },
  { channel: "SMS Normal", share: 0.26, deliveryRate: 0.942, reachShare: 0.88, takeUpRate: 0.064, optOutRate: 1.4 },
  { channel: "SMS Flash", share: 0.12, deliveryRate: 0.914, reachShare: 0.9, takeUpRate: 0.052, optOutRate: 1.1 },
  { channel: "Whatsapp Messenger", share: 0.14, deliveryRate: 0.978, reachShare: 0.86, takeUpRate: 0.081, optOutRate: 0.6 },
  { channel: "Push Notification", share: 0.1, deliveryRate: 0.842, reachShare: 0.74, takeUpRate: 0.038, optOutRate: 0.4 },
  { channel: "USSD", share: 0.06, deliveryRate: 0.889, reachShare: 0.93, takeUpRate: 0.047, optOutRate: 0.2 },
  { channel: "Digital channels", share: 0.04, deliveryRate: 0.905, reachShare: 0.71, takeUpRate: 0.044, optOutRate: 0.3 },
];

export function buildOverallDummy(options: {
  scale?: number;
  grain?: ReportGrain;
  reference?: boolean;
}): OverallDashboardPerformanceResponse {
  const scale = options.reference ? (options.scale ?? 1) * 0.92 : options.scale ?? 1;
  const rateNudge = options.reference ? 0.96 : 1;
  const periods = periodsFor(options.grain ?? "daily");
  const dispatchedBase = scaleCount(210_000, scale);
  const channels = DUMMY_CHANNEL_SEEDS.map((seed) => {
    const dispatched = Math.round(dispatchedBase * seed.share);
    const delivered = Math.round(dispatched * seed.deliveryRate);
    const takenUp = Math.round(delivered * seed.takeUpRate * rateNudge);
    return {
      channel: seed.channel,
      dispatched,
      delivered,
      subscribersReached: Math.round(delivered * seed.reachShare),
      takenUp,
      deliveryRate: Number((ratePercent(delivered, dispatched) * rateNudge).toFixed(1)),
      takeUpRate: Number((ratePercent(takenUp, delivered) * rateNudge).toFixed(1)),
      optOutRate: Number((seed.optOutRate * rateNudge).toFixed(1)),
    };
  });
  const dispatched = channels.reduce((sum, row) => sum + row.dispatched, 0);
  const delivered = channels.reduce((sum, row) => sum + row.delivered, 0);
  const offerTakenUp = scaleCount(8_420, scale);
  const takenUp = offerTakenUp;
  const deliveryRate = Number((ratePercent(delivered, dispatched) * rateNudge).toFixed(1));
  const takeUpRate = Number((ratePercent(takenUp, scaleCount(96_000, scale)) * rateNudge).toFixed(1));
  const emailChannel = channels.find((row) => row.channel === "Email");
  const smsChannels = channels.filter((row) => row.channel.startsWith("SMS"));
  const smsDispatched = smsChannels.reduce((sum, row) => sum + row.dispatched, 0);
  const smsDelivered = smsChannels.reduce((sum, row) => sum + row.delivered, 0);
  const smsTakeUpRate = ratePercent(
    smsChannels.reduce((sum, row) => sum + row.takenUp, 0),
    smsDelivered,
  );

  const deliveryTimeline: OverallDeliveryPoint[] = periods.map((period, index) => {
    const wave = 0.86 + (index % 3) * 0.07;
    return {
      period,
      channels: channels.map((row) => ({
        channel: row.channel,
        dispatched: Math.round((row.dispatched / Math.max(periods.length, 1)) * wave),
        delivered: Math.round((row.delivered / Math.max(periods.length, 1)) * wave),
        takenUp: Math.round((row.takenUp / Math.max(periods.length, 1)) * wave),
      })),
    };
  });

  const eligible = scaleCount(142_000, scale);
  const offered = scaleCount(96_000, scale);
  const fulfilled = scaleCount(7_150, scale);

  return {
    subscribersReached: scaleCount(118_400, scale),
    dispatched,
    delivered,
    deliveryRate,
    takenUp,
    takeUpRate,
    valueGenerated: scaleCount(4_860_000, scale),
    romi: Number((3.4 * rateNudge).toFixed(1)),
    activeSubscribers: scaleCount(1_284_200, 1),
    arpu: Number((128 * (options.reference ? 0.97 : 1)).toFixed(0)),
    churnRate: Number((8.3 * (options.reference ? 1.04 : 1)).toFixed(1)),
    segmentPortfolio: options.reference ? 46 : 48,
    subscriberBase: scaleCount(1_284_200, 1),
    campaignCount: options.reference ? 17 : 18,
    offerCount: options.reference ? 24 : 26,
    channels,
    deliveryTimeline,
    offerLifecycle: [
      { stage: "Eligible", value: eligible },
      { stage: "Offered", value: offered },
      { stage: "Taken Up", value: takenUp },
      { stage: "Fulfilled", value: fulfilled },
    ],
    valueBands: [
      { segment: "High Value", subscribers: scaleCount(86_400, 1) },
      { segment: "Core", subscribers: scaleCount(412_000, 1) },
      { segment: "Growth", subscribers: scaleCount(268_500, 1) },
      { segment: "At Risk", subscribers: scaleCount(142_200, 1) },
      { segment: "Dormant", subscribers: scaleCount(221_800, 1) },
      { segment: "New", subscribers: scaleCount(153_300, 1) },
    ],
    domains: [
      {
        id: "campaigns",
        available: true,
        metrics: [
          metric(OVERALL_CVM_LABELS.subscribersReached, formatCount(scaleCount(118_400, scale))),
          metric(OVERALL_CVM_LABELS.delivered, formatCount(delivered)),
          metric("Converted", formatCount(scaleCount(9_640, scale))),
        ],
      },
      {
        id: "offers",
        available: true,
        metrics: [
          metric("Eligible", formatCount(eligible)),
          metric(OVERALL_CVM_LABELS.takenUp, formatCount(takenUp)),
          metric(OVERALL_CVM_LABELS.valueGenerated, formatCurrency(scaleCount(4_860_000, scale))),
        ],
      },
      {
        id: "email",
        available: true,
        metrics: [
          metric("Emails Dispatched", formatCount(emailChannel?.dispatched ?? 0)),
          metric(OVERALL_CVM_LABELS.delivered, formatCount(emailChannel?.delivered ?? 0)),
          metric(OVERALL_CVM_LABELS.takeUpRate, formatRate(emailChannel?.takeUpRate ?? 0)),
        ],
      },
      {
        id: "sms",
        available: true,
        metrics: [
          metric("SMS Dispatched", formatCount(smsDispatched)),
          metric(OVERALL_CVM_LABELS.delivered, formatCount(smsDelivered)),
          metric(OVERALL_CVM_LABELS.takeUpRate, formatRate(smsTakeUpRate)),
        ],
      },
      {
        id: "segments",
        available: true,
        metrics: [
          metric(OVERALL_CVM_LABELS.segmentPortfolio, formatCount(options.reference ? 46 : 48)),
          metric(OVERALL_CVM_LABELS.subscriberBase, formatCount(scaleCount(1_284_200, 1))),
          metric(OVERALL_CVM_LABELS.takeUpRate, formatRate(Number((6.8 * rateNudge).toFixed(1)))),
        ],
      },
      {
        id: "profiles",
        available: true,
        metrics: [
          metric(OVERALL_CVM_LABELS.activeSubscribers, formatCount(scaleCount(1_284_200, 1))),
          metric(
            OVERALL_CVM_LABELS.arpu,
            formatCurrency(Number((128 * (options.reference ? 0.97 : 1)).toFixed(0))),
          ),
          metric(OVERALL_CVM_LABELS.churnRate, formatRate(Number((8.3 * (options.reference ? 1.04 : 1)).toFixed(1)))),
        ],
      },
    ],
  };
}

function firstPositive(...values: number[]): number {
  for (const value of values) {
    if (value > 0) return value;
  }
  return 0;
}

function channelFromReach(
  point: CampaignReportsResponse["channelReach"][number],
): OverallChannelPerformance {
  const dispatched = asFiniteNumber(point.sent ?? point.impressions);
  const delivered = asFiniteNumber(point.delivered);
  const takenUp = asFiniteNumber(point.converted ?? point.conversions);
  return {
    channel: point.channel || point.channelCode || "Channel",
    channelCode: point.channelCode,
    dispatched,
    delivered,
    subscribersReached: asFiniteNumber(point.uniqueAudience ?? point.reach),
    takenUp,
    deliveryRate: asFiniteNumber(point.deliveryRate, ratePercent(delivered, dispatched)),
    takeUpRate: asFiniteNumber(point.conversionRate, ratePercent(takenUp, delivered || dispatched)),
    optOutRate: 0,
  };
}

function channelsFromSources(
  reach: CampaignReportsResponse["channelReach"] | undefined,
  email: ReturnType<typeof emailCvmSnapshot>,
  sms: ReturnType<typeof smsCvmSnapshot>,
): OverallChannelPerformance[] {
  const fromCampaign = (reach || [])
    .map(channelFromReach)
    .filter((row) => row.channel.trim() !== "");
  if (fromCampaign.some((row) => row.dispatched > 0 || row.delivered > 0 || row.takenUp > 0)) {
    return fromCampaign;
  }
  const fallback: OverallChannelPerformance[] = [];
  if (sms.sent > 0 || sms.delivered > 0) {
    fallback.push({
      channel: "SMS",
      dispatched: sms.sent,
      delivered: sms.delivered,
      subscribersReached: sms.subscribersReached,
      takenUp: sms.takenUp,
      deliveryRate: sms.deliveryRate,
      takeUpRate: sms.takeUpRate,
      optOutRate: sms.optOutRate,
    });
  }
  if (email.sent > 0 || email.delivered > 0) {
    fallback.push({
      channel: "Email",
      dispatched: email.sent,
      delivered: email.delivered,
      subscribersReached: email.subscribersReached,
      takenUp: email.takenUp,
      deliveryRate: email.deliveryRate,
      takeUpRate: email.takeUpRate,
      optOutRate: email.optOutRate,
    });
  }
  return fallback.length ? fallback : fromCampaign;
}

function timelineFromTrend(
  trend: CampaignReportsResponse["performanceTrend"] | undefined,
  channels: OverallChannelPerformance[],
  sms: DeliverySMSReportsResponse["deliveryTimeline"] | undefined,
  email: DeliveryEmailReportsResponse["deliveryTimeline"] | undefined,
): OverallDeliveryPoint[] {
  const active = channels.filter((row) => row.dispatched > 0 || row.delivered > 0);
  const names = (active.length ? active : channels).map((row) => row.channel);
  const totalDispatched = active.reduce((sum, row) => sum + row.dispatched, 0);
  const shareOf = (channel: string) => {
    if (!totalDispatched) return names.length ? 1 / names.length : 0;
    const row = active.find((item) => item.channel === channel);
    return row ? row.dispatched / totalDispatched : 0;
  };

  if (trend && trend.length) {
    return trend.map((point) => {
      const sent = asFiniteNumber(point.sent);
      const delivered = asFiniteNumber(point.delivered);
      const takenUp = asFiniteNumber(point.converted ?? point.conversions);
      return {
        period: point.period,
        channels: names.map((channel) => {
          const share = shareOf(channel);
          return {
            channel,
            dispatched: Math.round(sent * share),
            delivered: Math.round(delivered * share),
            takenUp: Math.round(takenUp * share),
          };
        }),
      };
    });
  }

  const order: string[] = [];
  const rows = new Map<string, Map<string, { dispatched: number; delivered: number; takenUp: number }>>();
  const touch = (period: string, channel: string) => {
    const key = period || "Period";
    if (!rows.has(key)) {
      rows.set(key, new Map());
      order.push(key);
    }
    const bucket = rows.get(key)!;
    if (!bucket.has(channel)) {
      bucket.set(channel, { dispatched: 0, delivered: 0, takenUp: 0 });
    }
    return bucket.get(channel)!;
  };
  for (const point of sms || []) {
    const row = touch(point.period, "SMS");
    row.dispatched += asFiniteNumber(point.sent);
    row.delivered += asFiniteNumber(point.delivered);
    row.takenUp += asFiniteNumber(point.takenUp ?? point.converted);
  }
  for (const point of email || []) {
    const row = touch(point.period, "Email");
    row.dispatched += asFiniteNumber(point.sent);
    row.delivered += asFiniteNumber(point.delivered);
    row.takenUp += asFiniteNumber(point.takenUp ?? point.converted);
  }
  return order.map((period) => ({
    period,
    channels: [...(rows.get(period)?.entries() || [])].map(([channel, volume]) => ({
      channel,
      ...volume,
    })),
  }));
}

export function composeOverallPortfolio(
  sources: OverallLiveSources,
): OverallDashboardPerformanceResponse {
  const campaign = sources.campaigns.ok ? sources.campaigns.data : null;
  const offer = sources.offers.ok ? sources.offers.data : null;
  const emailReport = sources.email.ok ? sources.email.data : null;
  const smsReport = sources.sms.ok ? sources.sms.data : null;
  const segmentReport = sources.segments.ok ? sources.segments.data : null;
  const profileReport = sources.profiles.ok ? sources.profiles.data : null;

  const campaignSummary = campaign?.summary;
  const emailSnapshot = emailCvmSnapshot(emailReport?.summary);
  const smsSnapshot = smsCvmSnapshot(smsReport?.summary);
  const offerSnapshot = offerCvmSnapshot(offer?.summary, offer?.redemptionFunnel || []);
  const segmentSnapshot = segmentCvmSnapshot(
    (segmentReport?.summary ?? null) as Record<string, unknown> | null,
  );
  const profileSnapshot = subscriberCvmSnapshot(
    (profileReport?.heroMetrics ?? null) as unknown as Record<string, unknown> | null,
  );

  const channels = channelsFromSources(campaign?.channelReach, emailSnapshot, smsSnapshot);
  const channelDispatched = channels.reduce((sum, row) => sum + row.dispatched, 0);
  const channelDelivered = channels.reduce((sum, row) => sum + row.delivered, 0);
  const channelTakenUp = channels.reduce((sum, row) => sum + row.takenUp, 0);
  const dispatched = firstPositive(channelDispatched, asFiniteNumber(campaignSummary?.sent));
  const delivered = firstPositive(channelDelivered, asFiniteNumber(campaignSummary?.delivered));
  const subscribersReached = firstPositive(
    asFiniteNumber(campaignSummary?.uniqueAudience ?? campaignSummary?.reach),
    channels.reduce((sum, row) => sum + row.subscribersReached, 0),
  );
  const takenUp = firstPositive(
    offerSnapshot.takenUp,
    channelTakenUp,
    convertedFrom(campaignSummary),
  );
  const takeUpBase = firstPositive(offerSnapshot.offered, delivered, dispatched);
  const valueGenerated = firstPositive(
    offerSnapshot.valueGenerated,
    asFiniteNumber(campaignSummary?.revenue),
  );
  const romi = firstPositive(offerSnapshot.romi, romiFrom(campaignSummary));

  const offerStageValue: Record<(typeof OFFER_FUNNEL_STAGES)[number], number> = {
    Eligible: offerSnapshot.eligible,
    Offered: offerSnapshot.offered,
    "Taken Up": offerSnapshot.takenUp,
    Fulfilled: offerSnapshot.fulfilled,
  };
  const offerLifecycle = OFFER_FUNNEL_STAGES.map((stage) => ({
    stage,
    value: offerStageValue[stage],
  }));

  const valueBands = aggregateValueBands(profileReport?.valueMatrix || [])
    .filter((band) => band.customers > 0)
    .map((band) => ({ segment: band.segment, subscribers: band.customers }));

  const domains: OverallDomainSnapshot[] = DOMAIN_ORDER.map((id) => {
    if (id === "campaigns") {
      if (!sources.campaigns.ok) return unavailableDomain(id);
      return {
        id,
        available: true,
        metrics: [
          metric(OVERALL_CVM_LABELS.subscribersReached, formatCount(subscribersReached)),
          metric(OVERALL_CVM_LABELS.delivered, formatCount(asFiniteNumber(campaignSummary?.delivered))),
          metric("Converted", formatCount(convertedFrom(campaignSummary))),
        ],
      };
    }
    if (id === "offers") {
      if (!sources.offers.ok) return unavailableDomain(id);
      return {
        id,
        available: true,
        metrics: [
          metric("Eligible", formatCount(offerSnapshot.eligible)),
          metric(OVERALL_CVM_LABELS.takenUp, formatCount(offerSnapshot.takenUp)),
          metric(OVERALL_CVM_LABELS.valueGenerated, formatCurrency(offerSnapshot.valueGenerated)),
        ],
      };
    }
    if (id === "email") {
      if (!sources.email.ok) return unavailableDomain(id);
      return {
        id,
        available: true,
        metrics: [
          metric("Emails Dispatched", formatCount(emailSnapshot.sent)),
          metric(OVERALL_CVM_LABELS.delivered, formatCount(emailSnapshot.delivered)),
          metric(OVERALL_CVM_LABELS.takeUpRate, formatRate(emailSnapshot.takeUpRate)),
        ],
      };
    }
    if (id === "sms") {
      if (!sources.sms.ok) return unavailableDomain(id);
      return {
        id,
        available: true,
        metrics: [
          metric("SMS Dispatched", formatCount(smsSnapshot.sent)),
          metric(OVERALL_CVM_LABELS.delivered, formatCount(smsSnapshot.delivered)),
          metric(OVERALL_CVM_LABELS.takeUpRate, formatRate(smsSnapshot.takeUpRate)),
        ],
      };
    }
    if (id === "segments") {
      if (!sources.segments.ok) return unavailableDomain(id);
      return {
        id,
        available: true,
        metrics: [
          metric(OVERALL_CVM_LABELS.segmentPortfolio, formatCount(segmentSnapshot.segmentPortfolio)),
          metric(OVERALL_CVM_LABELS.subscriberBase, formatCount(segmentSnapshot.subscriberBase)),
          metric(OVERALL_CVM_LABELS.takeUpRate, formatRate(segmentSnapshot.takeUpRate)),
        ],
      };
    }
    if (!sources.profiles.ok) return unavailableDomain(id);
    return {
      id,
      available: true,
      metrics: [
        metric(OVERALL_CVM_LABELS.activeSubscribers, formatCount(profileSnapshot.activeSubscribers)),
        metric(OVERALL_CVM_LABELS.arpu, formatCurrency(profileSnapshot.arpu)),
        metric(OVERALL_CVM_LABELS.churnRate, formatRate(profileSnapshot.churnRate)),
      ],
    };
  });

  return {
    subscribersReached,
    dispatched,
    delivered,
    deliveryRate: firstPositive(ratePercent(delivered, dispatched), deliveryRateFrom(campaignSummary)),
    takenUp,
    takeUpRate: firstPositive(offerSnapshot.takeUpRate, ratePercent(takenUp, takeUpBase)),
    valueGenerated,
    romi,
    activeSubscribers: profileSnapshot.activeSubscribers,
    arpu: profileSnapshot.arpu,
    churnRate: profileSnapshot.churnRate,
    segmentPortfolio: segmentSnapshot.segmentPortfolio,
    subscriberBase: segmentSnapshot.subscriberBase,
    campaignCount: asFiniteNumber(campaign?.totalCampaigns ?? campaign?.campaigns?.length),
    offerCount: asFiniteNumber(offer?.totalOffers ?? offer?.offers?.length),
    channels,
    deliveryTimeline: timelineFromTrend(
      campaign?.performanceTrend,
      channels,
      smsReport?.deliveryTimeline,
      emailReport?.deliveryTimeline,
    ),
    offerLifecycle,
    valueBands,
    domains,
  };
}

export function sourceFailures(sources: OverallLiveSources | null): string[] {
  if (!sources) return [];
  return DOMAIN_ORDER.flatMap((id) => {
    const source = sources[id];
    if (source.ok || !source.error) return [];
    return [`${domainLabel(id)}: ${source.error}`];
  });
}

export function domainLabel(id: OverallReportDomain): string {
  const labels: Record<OverallReportDomain, string> = {
    campaigns: OVERALL_CVM_LABELS.campaigns,
    offers: OVERALL_CVM_LABELS.offers,
    email: OVERALL_CVM_LABELS.emailDelivery,
    sms: OVERALL_CVM_LABELS.smsDelivery,
    segments: OVERALL_CVM_LABELS.segments,
    profiles: OVERALL_CVM_LABELS.customerProfiles,
  };
  return labels[id];
}

export function domainDescription(id: OverallReportDomain): string {
  const copy: Record<OverallReportDomain, string> = {
    campaigns: "Audience reached, delivery, and conversion",
    offers: "Eligible, offered, taken up, and fulfilled",
    email: "Dispatch, delivery, take-up, and opt-out",
    sms: "Broadcast delivery, take-up, and opt-out",
    segments: "Subscriber base, targeting, and activity",
    profiles: "Value bands, ARPU, and churn",
  };
  return copy[id];
}
