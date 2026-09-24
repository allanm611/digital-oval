import { asFiniteNumber } from "../../reports-analytics/utils/normalizeCampaignReport";
import { asRecord } from "./customerSegmentHelpers";
import type {
  AnalyticsChannelEngagement,
  AnalyticsConsentRow,
  AnalyticsDeviceRow,
  AnalyticsFunnelStage,
  AnalyticsNamedCount,
  AnalyticsSegmentRow,
  AnalyticsSeriesPoint,
  SubscriberAnalyticsKpis,
  SubscriberAnalyticsResult,
} from "../types/customerAnalytics";
import { EMPTY_ANALYTICS_KPIS } from "../types/customerAnalytics";

export const SUBSCRIBER_CVM_LABELS = {
  engagementScore: "Engagement Score",
  conversions: "Conversions",
  conversionRate: "Conversion Rate",
  touchpoints: "Touchpoints",
  lifecycle: "Lifecycle Stage",
  audience: "Audience Segments",
  consent: "Channel Consent",
  devices: "Registered Devices",
  clv: "Customer Lifetime Value",
} as const;

export function unwrapReportData(payload: unknown): unknown {
  const record = asRecord(payload);
  if (!record) return payload;
  if (record.data !== undefined) return record.data;
  return record;
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  if (!record) return [];
  for (const key of [
    "items",
    "rows",
    "results",
    "data",
    "series",
    "history",
    "channels",
    "segments",
    "devices",
    "touchpoints",
    "events",
    "funnel",
    "stages",
    "memberships",
    "consents",
  ]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function humanize(value: string | null): string {
  if (!value) return "—";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function namedCount(item: unknown, index: number): AnalyticsNamedCount | null {
  const row = asRecord(item);
  if (!row) return null;
  const name =
    stringOrNull(
      row.name ??
        row.channel ??
        row.status ??
        row.event_type ??
        row.eventType ??
        row.label,
    ) || `Item ${index + 1}`;
  const value = asFiniteNumber(
    row.value ?? row.count ?? row.total ?? row.events ?? row.touchpoints,
  );
  return { name: humanize(name), value };
}

function seriesPoint(item: unknown, index: number): AnalyticsSeriesPoint | null {
  const row = asRecord(item);
  if (!row) return null;
  const period =
    stringOrNull(
      row.period ?? row.date ?? row.month ?? row.day ?? row.label ?? row.bucket,
    ) || `P${index + 1}`;
  return {
    period,
    value: asFiniteNumber(
      row.value ??
        row.count ??
        row.events ??
        row.touchpoints ??
        row.score ??
        row.engagement ??
        row.conversions,
    ),
    secondary: asFiniteNumber(
      row.secondary ?? row.converted ?? row.revenue ?? row.engaged,
      Number.NaN,
    ),
  };
}

function channelEngagement(item: unknown): AnalyticsChannelEngagement | null {
  const row = asRecord(item);
  if (!row) return null;
  const channel = stringOrNull(row.channel ?? row.name ?? row.medium);
  if (!channel) return null;
  const sent = asFiniteNumber(row.sent ?? row.messages);
  const delivered = asFiniteNumber(row.delivered ?? row.delivery);
  const engaged = asFiniteNumber(
    row.engaged ?? row.opened ?? row.clicked ?? row.reads,
  );
  const converted = asFiniteNumber(row.converted ?? row.conversions);
  const engagementRate =
    row.engagementRate != null || row.engagement_rate != null
      ? asFiniteNumber(row.engagementRate ?? row.engagement_rate)
      : sent || delivered
        ? Number(((engaged / (delivered || sent)) * 100).toFixed(1))
        : 0;
  return {
    channel: humanize(channel),
    sent,
    delivered,
    engaged,
    converted,
    engagementRate,
  };
}

function funnelStage(item: unknown, index: number): AnalyticsFunnelStage | null {
  const row = asRecord(item);
  if (!row) return null;
  const stage =
    stringOrNull(row.stage ?? row.name ?? row.step ?? row.label) ||
    `Stage ${index + 1}`;
  return {
    stage: humanize(stage),
    count: asFiniteNumber(row.count ?? row.value ?? row.customers ?? row.total),
  };
}

function consentRow(item: unknown, index: number): AnalyticsConsentRow | null {
  const row = asRecord(item);
  if (!row) return null;
  const channel =
    stringOrNull(row.channel ?? row.name ?? row.medium) || `Channel ${index + 1}`;
  const status = stringOrNull(row.status ?? row.consent_status ?? row.state) || "—";
  const opted =
    row.opted_in ?? row.optedIn ?? row.is_opted_in ?? row.opt_in ?? row.consent;
  return {
    channel: humanize(channel),
    status: humanize(status),
    optedIn: typeof opted === "boolean" ? opted : null,
  };
}

function segmentRow(item: unknown, index: number): AnalyticsSegmentRow | null {
  const row = asRecord(item);
  if (!row) return null;
  const id = stringOrNull(row.id ?? row.segment_id ?? row.segmentId) || `seg-${index}`;
  const name = stringOrNull(row.name ?? row.segment_name ?? row.segmentName);
  if (!name) return null;
  return {
    id,
    name,
    type: humanize(stringOrNull(row.type ?? row.segment_type) || "audience"),
    addedAt: stringOrNull(row.added_at ?? row.addedAt ?? row.joined_at),
  };
}

function deviceRow(item: unknown, index: number): AnalyticsDeviceRow | null {
  const row = asRecord(item);
  if (!row) return null;
  const id = stringOrNull(row.id ?? row.device_id ?? row.imei) || `dev-${index}`;
  const name =
    stringOrNull(row.name ?? row.device_name ?? row.model) || "Device";
  return {
    id,
    name,
    type: humanize(stringOrNull(row.type ?? row.device_type) || "handset"),
    status: humanize(stringOrNull(row.status) || "unknown"),
    lastSeen: stringOrNull(row.last_seen ?? row.lastSeen ?? row.updated_at),
  };
}

function pickNumber(record: Record<string, unknown> | null, keys: string[]): number | null {
  if (!record) return null;
  for (const key of keys) {
    if (record[key] == null || record[key] === "") continue;
    const value = asFiniteNumber(record[key], Number.NaN);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

function pickString(record: Record<string, unknown> | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = stringOrNull(record[key]);
    if (value) return value;
  }
  return null;
}

function mapList<T>(
  source: unknown,
  mapper: (item: unknown, index: number) => T | null,
): T[] {
  return asList(source)
    .map((item, index) => mapper(item, index))
    .filter((item): item is T => Boolean(item));
}

function seriesFrom(
  source: unknown,
  extraKeys: string[] = [],
): AnalyticsSeriesPoint[] {
  const record = asRecord(unwrapReportData(source));
  const list =
    extraKeys.length && record
      ? extraKeys.reduce<unknown[]>((found, key) => {
          if (found.length) return found;
          return Array.isArray(record[key]) ? (record[key] as unknown[]) : found;
        }, [])
      : asList(unwrapReportData(source));
  return list
    .map((item, index) => seriesPoint(item, index))
    .filter((item): item is AnalyticsSeriesPoint => Boolean(item))
    .map((item) => ({
      ...item,
      secondary: Number.isFinite(item.secondary) ? item.secondary : undefined,
    }));
}

export function buildSubscriberAnalytics(input: {
  activity?: unknown;
  profile?: unknown;
  engagement?: unknown;
  consent?: unknown;
  segments?: unknown;
  devices?: unknown;
  conversions?: unknown;
  lifecycle?: unknown;
  touchpoints?: unknown;
  legacy?: unknown;
  loadedResources: string[];
  failedResources: string[];
  usedLegacy: boolean;
}): SubscriberAnalyticsResult {
  const legacy = asRecord(unwrapReportData(input.legacy));
  const activity = asRecord(unwrapReportData(input.activity ?? legacy?.activity));
  const profile = asRecord(unwrapReportData(input.profile ?? legacy?.profile));
  const engagement = asRecord(
    unwrapReportData(input.engagement ?? legacy?.engagement),
  );
  const consent = unwrapReportData(input.consent ?? legacy?.consent);
  const segments = unwrapReportData(input.segments ?? legacy?.segments);
  const devices = unwrapReportData(input.devices ?? legacy?.devices);
  const conversions = asRecord(
    unwrapReportData(input.conversions ?? legacy?.conversions),
  );
  const lifecycle = asRecord(
    unwrapReportData(input.lifecycle ?? legacy?.lifecycle),
  );
  const touchpoints = unwrapReportData(
    input.touchpoints ?? legacy?.touchpoints,
  );

  const activitySeriesRaw = seriesFrom(activity, [
    "series",
    "timeline",
    "history",
  ]);
  const engagementSeries = seriesFrom(engagement, [
    "series",
    "history",
    "trend",
  ]);
  const conversionSeriesRaw = seriesFrom(conversions, [
    "series",
    "history",
    "trend",
  ]);
  const lifecycleSeries = seriesFrom(lifecycle, ["series", "history", "trend"]);
  const touchpointSeries = seriesFrom(touchpoints, [
    "series",
    "timeline",
    "history",
  ]);

  const activityByChannelRaw = mapList(
    activity?.by_channel ?? activity?.byChannel ?? activity?.channels,
    namedCount,
  );
  const touchpointsByChannel = mapList(
    asRecord(touchpoints)?.by_channel ??
      asRecord(touchpoints)?.byChannel ??
      asRecord(touchpoints)?.channels ??
      touchpoints,
    namedCount,
  );
  const engagementByChannel = mapList(
    engagement?.by_channel ?? engagement?.byChannel ?? engagement?.channels,
    channelEngagement,
  );
  const conversionFunnelRaw = mapList(
    conversions?.funnel ?? conversions?.stages,
    funnelStage,
  );

  const activitySeries = activitySeriesRaw.length
    ? activitySeriesRaw
    : touchpointSeries;
  const activityByChannel = activityByChannelRaw.length
    ? activityByChannelRaw
    : touchpointsByChannel;
  const conversionFunnel =
    conversionFunnelRaw.length > 0
      ? conversionFunnelRaw
      : engagementByChannel.length > 0
        ? [
            {
              stage: "Sent",
              count: engagementByChannel.reduce((sum, row) => sum + row.sent, 0),
            },
            {
              stage: "Delivered",
              count: engagementByChannel.reduce(
                (sum, row) => sum + row.delivered,
                0,
              ),
            },
            {
              stage: "Engaged",
              count: engagementByChannel.reduce(
                (sum, row) => sum + row.engaged,
                0,
              ),
            },
            {
              stage: "Converted",
              count: engagementByChannel.reduce(
                (sum, row) => sum + row.converted,
                0,
              ),
            },
          ].filter((stage) => stage.count > 0)
        : [];
  const conversionSeries = conversionSeriesRaw.length
    ? conversionSeriesRaw
    : engagementSeries;
  const consentRows = mapList(consent, consentRow);
  const segmentRows = mapList(segments, segmentRow);
  const deviceRows = mapList(devices, deviceRow);

  const kpis: SubscriberAnalyticsKpis = {
    ...EMPTY_ANALYTICS_KPIS,
    engagementScore: pickNumber(engagement, [
      "score",
      "engagement_score",
      "engagementScore",
    ]) ?? pickNumber(profile, ["engagement_score", "engagementScore", "score"]),
    conversions: asFiniteNumber(
      conversions?.count ??
        conversions?.conversions ??
        conversions?.converted ??
        conversions?.total ??
        conversionFunnel.find((stage) =>
          stage.stage.toLowerCase().includes("convert"),
        )?.count ??
        engagementByChannel.reduce((sum, row) => sum + row.converted, 0),
    ),
    conversionRate: pickNumber(conversions, [
      "rate",
      "conversion_rate",
      "conversionRate",
    ]),
    touchpoints: asFiniteNumber(
      asRecord(touchpoints)?.count ??
        asRecord(touchpoints)?.total ??
        asRecord(touchpoints)?.touchpoints ??
        activity?.count ??
        activity?.total,
      touchpointsByChannel.reduce((sum, row) => sum + row.value, 0) ||
        activitySeries.reduce((sum, row) => sum + row.value, 0),
    ),
    lifecycleStage: humanize(
      pickString(lifecycle, ["stage", "lifecycle", "lifecycle_stage", "status"]),
    ),
    segmentCount:
      segmentRows.length || asFiniteNumber(asRecord(segments)?.count),
    optedInChannels: consentRows.filter((row) => row.optedIn === true).length,
    deviceCount: deviceRows.length || asFiniteNumber(asRecord(devices)?.count),
    clv: pickNumber(profile, ["clv", "lifetime_value", "lifetimeValue"]),
    churnRisk: pickNumber(profile, ["churn_risk", "churnRisk"]),
    preferredChannel: humanize(
      pickString(profile, [
        "preferred_channel",
        "preferredChannel",
        "channel",
      ]),
    ),
  };

  if (kpis.lifecycleStage === "—") kpis.lifecycleStage = null;
  if (kpis.preferredChannel === "—") kpis.preferredChannel = null;

  const warnings: string[] = [];
  if (input.failedResources.length) {
    warnings.push(
      `Some CVM widgets could not be loaded: ${input.failedResources.join(", ")}.`,
    );
  }

  return {
    kpis,
    activitySeries,
    activityByChannel,
    engagementByChannel,
    engagementSeries,
    conversionSeries,
    conversionFunnel,
    lifecycleSeries,
    touchpointsByChannel,
    consent: consentRows,
    segments: segmentRows,
    devices: deviceRows,
    loadedResources: input.loadedResources,
    failedResources: input.failedResources,
    warnings,
    usedLegacy: input.usedLegacy,
  };
}

export function hasAnalyticsWidgets(result: SubscriberAnalyticsResult): boolean {
  return (
    result.loadedResources.length > 0 ||
    result.activitySeries.length > 0 ||
    result.engagementByChannel.length > 0 ||
    result.conversionFunnel.length > 0 ||
    result.segments.length > 0 ||
    result.devices.length > 0 ||
    result.consent.length > 0 ||
    result.kpis.engagementScore != null ||
    result.kpis.conversions > 0
  );
}
