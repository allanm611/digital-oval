import type {
  CustomerEvent,
  CustomerEventCatalogItem,
  CustomerEventChannel,
  CustomerEventCountBucket,
  CustomerEventCounts,
  CustomerEventFacets,
  CustomerEventOrigin,
  CustomerEventQuery,
  EventTimePreset,
} from "../types/customerEvent";

export const EVENT_COUNT_WINDOWS: Array<{
  key: Exclude<EventTimePreset, "custom" | "all">;
  label: string;
  hint: string;
  ms: number;
}> = [
  { key: "last_1h", label: "Last 1 hr", hint: "Rolling hour", ms: 60 * 60 * 1000 },
  {
    key: "last_24h",
    label: "Last 24 hrs",
    hint: "Rolling day",
    ms: 24 * 60 * 60 * 1000,
  },
  {
    key: "last_7d",
    label: "Last 7 days",
    hint: "Rolling week",
    ms: 7 * 24 * 60 * 60 * 1000,
  },
  {
    key: "last_30d",
    label: "Last 30 days",
    hint: "Rolling month",
    ms: 30 * 24 * 60 * 60 * 1000,
  },
  {
    key: "last_90d",
    label: "Last 90 days",
    hint: "Rolling quarter",
    ms: 90 * 24 * 60 * 60 * 1000,
  },
];

export const EVENT_TIME_PRESET_OPTIONS: Array<{
  value: EventTimePreset;
  label: string;
}> = [
  { value: "last_1h", label: "Last 1 hour" },
  { value: "last_24h", label: "Last 24 hours" },
  { value: "last_7d", label: "Last 7 days" },
  { value: "last_30d", label: "Last 30 days" },
  { value: "last_90d", label: "Last 90 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom range" },
];

export const EMPTY_COUNT_BUCKET: CustomerEventCountBucket = {
  total: 0,
  customer: 0,
  system: 0,
};

export const EMPTY_EVENT_COUNTS: CustomerEventCounts = {
  last_1h: { ...EMPTY_COUNT_BUCKET },
  last_24h: { ...EMPTY_COUNT_BUCKET },
  last_7d: { ...EMPTY_COUNT_BUCKET },
  last_30d: { ...EMPTY_COUNT_BUCKET },
  last_90d: { ...EMPTY_COUNT_BUCKET },
  all: { ...EMPTY_COUNT_BUCKET },
};

export const CUSTOMER_EVENT_CATALOG: CustomerEventCatalogItem[] = [
  {
    code: "recharge",
    label: "Airtime Recharge",
    description: "Customer topped up airtime",
    origin: "customer",
    channel: "ussd",
    tracking_source_id: "recharge",
    tracking_source_name: "Recharge",
    statuses: ["Completed", "Failed"],
  },
  {
    code: "bundle_purchase",
    label: "Bundle Purchase",
    description: "Customer purchased a data or voice bundle",
    origin: "customer",
    channel: "app",
    tracking_source_id: "bundle_purchase",
    tracking_source_name: "Bundle Purchase",
    statuses: ["Completed", "Failed"],
  },
  {
    code: "data_usage",
    label: "Data Usage",
    description: "Customer consumed mobile data",
    origin: "customer",
    channel: "app",
    tracking_source_id: "usage_data",
    tracking_source_name: "Data Usage",
    statuses: ["Recorded"],
  },
  {
    code: "voice_call",
    label: "Voice Call",
    description: "Customer completed a voice call",
    origin: "customer",
    channel: "voice",
    tracking_source_id: "usage_voice",
    tracking_source_name: "Voice Usage",
    statuses: ["Completed"],
  },
  {
    code: "customer_sms",
    label: "Outbound SMS",
    description: "Customer sent an SMS",
    origin: "customer",
    channel: "sms",
    tracking_source_id: "usage_sms",
    tracking_source_name: "SMS Usage",
    statuses: ["Sent", "Delivered"],
  },
  {
    code: "app_login",
    label: "App Login",
    description: "Customer opened the mobile app",
    origin: "customer",
    channel: "app",
    tracking_source_id: "app_event",
    tracking_source_name: "App Event",
    statuses: ["Completed"],
  },
  {
    code: "ussd_session",
    label: "USSD Session",
    description: "Customer started a USSD session",
    origin: "customer",
    channel: "ussd",
    tracking_source_id: "api_event",
    tracking_source_name: "API Event",
    statuses: ["Completed"],
  },
  {
    code: "offer_redeemed",
    label: "Offer Redeemed",
    description: "Customer redeemed an offer reward",
    origin: "customer",
    channel: "app",
    tracking_source_id: "revenue",
    tracking_source_name: "Revenue",
    statuses: ["Completed"],
  },
  {
    code: "offer_accepted",
    label: "Offer Accepted",
    description: "Customer accepted a campaign offer",
    origin: "customer",
    channel: "sms",
    tracking_source_id: "app_event",
    tracking_source_name: "App Event",
    statuses: ["Clicked", "Completed"],
  },
  {
    code: "welcome_email",
    label: "Welcome Email",
    description: "Welcome to our community",
    origin: "system",
    channel: "email",
    tracking_source_id: "api_event",
    tracking_source_name: "API Event",
    statuses: ["Sent", "Delivered", "Opened", "Clicked"],
  },
  {
    code: "promotional_sms",
    label: "Promotional SMS",
    description: "Flash sale - 24 hours only",
    origin: "system",
    channel: "sms",
    tracking_source_id: "usage_sms",
    tracking_source_name: "SMS Usage",
    statuses: ["Sent", "Delivered", "Read", "Clicked"],
  },
  {
    code: "price_drop_alert",
    label: "Price Drop Alert",
    description: "Price reduced on favorites",
    origin: "system",
    channel: "push",
    tracking_source_id: "app_event",
    tracking_source_name: "App Event",
    statuses: ["Sent", "Opened"],
  },
  {
    code: "order_confirmation",
    label: "Order Confirmation",
    description: "Your order has been confirmed",
    origin: "system",
    channel: "email",
    tracking_source_id: "api_event",
    tracking_source_name: "API Event",
    statuses: ["Sent", "Delivered", "Opened"],
  },
  {
    code: "delivery_notification",
    label: "Delivery Notification",
    description: "Package delivered",
    origin: "system",
    channel: "sms",
    tracking_source_id: "usage_sms",
    tracking_source_name: "SMS Usage",
    statuses: ["Sent", "Delivered", "Read"],
  },
  {
    code: "new_products",
    label: "New Products",
    description: "Check out our latest arrivals",
    origin: "system",
    channel: "push",
    tracking_source_id: "app_event",
    tracking_source_name: "App Event",
    statuses: ["Sent", "Opened"],
  },
  {
    code: "newsletter",
    label: "Newsletter",
    description: "Monthly updates and news",
    origin: "system",
    channel: "email",
    tracking_source_id: "api_event",
    tracking_source_name: "API Event",
    statuses: ["Sent", "Opened", "Clicked"],
  },
  {
    code: "order_alert",
    label: "Order Alert",
    description: "Your order is ready",
    origin: "system",
    channel: "sms",
    tracking_source_id: "usage_sms",
    tracking_source_name: "SMS Usage",
    statuses: ["Sent", "Delivered", "Read"],
  },
  {
    code: "campaign_executed",
    label: "Campaign Executed",
    description: "Customer was targeted by a campaign",
    origin: "system",
    channel: "sms",
    tracking_source_id: "api_event",
    tracking_source_name: "API Event",
    statuses: ["Sent", "Delivered"],
  },
];

const CHANNELS: CustomerEventChannel[] = [
  "email",
  "sms",
  "push",
  "ussd",
  "app",
  "web",
  "api",
  "voice",
  "other",
];

/** Canonical channel filter options. Email / SMS / Push stay first to match the previous toolbar. */
export const CHANNEL_FILTER_OPTIONS: Array<{
  value: CustomerEventChannel;
  label: string;
}> = [
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
  { value: "push", label: "Push" },
  { value: "ussd", label: "USSD" },
  { value: "app", label: "App" },
  { value: "web", label: "Web" },
  { value: "api", label: "API" },
  { value: "voice", label: "Voice" },
  { value: "other", label: "Other" },
];

function pickString(raw: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function normalizeChannel(value: string): CustomerEventChannel {
  const normalized = value.trim().toLowerCase();
  if (CHANNELS.includes(normalized as CustomerEventChannel)) {
    return normalized as CustomerEventChannel;
  }
  if (normalized === "inapp" || normalized === "mobile") return "app";
  if (normalized === "obd" || normalized === "ivr") return "voice";
  if (normalized === "whatsapp" || normalized === "short_code") return "sms";
  return "other";
}

export function normalizeOrigin(value: string): CustomerEventOrigin {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "customer" ||
    normalized === "customer_driven" ||
    normalized === "user" ||
    normalized === "subscriber"
  ) {
    return "customer";
  }
  return "system";
}

export function parseEventDate(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getPresetRange(
  preset: EventTimePreset,
  now: Date,
  dateFrom?: string,
  dateTo?: string,
): { from: Date | null; to: Date | null } {
  if (preset === "all") return { from: null, to: null };

  if (preset === "custom") {
    const from = parseEventDate(dateFrom);
    const to = parseEventDate(dateTo);
    if (to) to.setHours(23, 59, 59, 999);
    return { from, to };
  }

  const window = EVENT_COUNT_WINDOWS.find((item) => item.key === preset);
  if (!window) return { from: null, to: null };
  return { from: new Date(now.getTime() - window.ms), to: now };
}

export function isEventInRange(
  occurredAt: string,
  from: Date | null,
  to: Date | null,
): boolean {
  const date = parseEventDate(occurredAt);
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function matchesSearch(event: CustomerEvent, search: string): boolean {
  if (!search.trim()) return true;
  const term = search.trim().toLowerCase();
  return [
    event.event_type,
    event.event_type_label,
    event.description,
    event.tracking_source_name,
    event.channel,
    event.status,
    event.origin,
  ].some((value) => value.toLowerCase().includes(term));
}

export function filterCustomerEvents(
  events: CustomerEvent[],
  query: CustomerEventQuery,
  now: Date = new Date(),
): CustomerEvent[] {
  const origin = query.origin && query.origin !== "all" ? query.origin : "";
  const eventType = query.event_type && query.event_type !== "all" ? query.event_type : "";
  const trackingSource =
    query.tracking_source_id && query.tracking_source_id !== "all"
      ? query.tracking_source_id
      : "";
  const status = query.status && query.status !== "all" ? query.status : "";
  const channel = query.channel && query.channel !== "all" ? query.channel : "";
  const { from, to } = getPresetRange(
    query.time_preset || "all",
    now,
    query.date_from,
    query.date_to,
  );

  return events.filter((event) => {
    if (!matchesSearch(event, query.search || "")) return false;
    if (eventType && event.event_type !== eventType) return false;
    if (trackingSource && event.tracking_source_id !== trackingSource) return false;
    if (origin && event.origin !== origin) return false;
    if (status && event.status !== status) return false;
    if (channel && event.channel !== channel) return false;
    if (!isEventInRange(event.occurred_at, from, to)) return false;
    return true;
  });
}

function emptyCounts(): CustomerEventCounts {
  return {
    last_1h: { total: 0, customer: 0, system: 0 },
    last_24h: { total: 0, customer: 0, system: 0 },
    last_7d: { total: 0, customer: 0, system: 0 },
    last_30d: { total: 0, customer: 0, system: 0 },
    last_90d: { total: 0, customer: 0, system: 0 },
    all: { total: 0, customer: 0, system: 0 },
  };
}

function bumpBucket(bucket: CustomerEventCountBucket, origin: CustomerEventOrigin) {
  bucket.total += 1;
  bucket[origin] += 1;
}

export function aggregateEventCounts(
  events: CustomerEvent[],
  now: Date = new Date(),
): CustomerEventCounts {
  const counts = emptyCounts();
  const nowMs = now.getTime();

  events.forEach((event) => {
    const date = parseEventDate(event.occurred_at);
    if (!date) return;

    bumpBucket(counts.all, event.origin);
    const age = nowMs - date.getTime();
    EVENT_COUNT_WINDOWS.forEach((window) => {
      if (age >= 0 && age <= window.ms) {
        bumpBucket(counts[window.key], event.origin);
      }
    });
  });

  return counts;
}

export function buildEventFacets(events: CustomerEvent[]): CustomerEventFacets {
  const tally = (key: keyof CustomerEvent) => {
    const map = new Map<string, { label: string; count: number }>();
    events.forEach((event) => {
      const value = String(event[key] || "");
      if (!value) return;
      const label =
        key === "event_type"
          ? event.event_type_label
          : key === "tracking_source_id"
            ? event.tracking_source_name
            : value;
      const existing = map.get(value);
      if (existing) existing.count += 1;
      else map.set(value, { label, count: 1 });
    });
    return Array.from(map.entries())
      .map(([value, item]) => ({ value, label: item.label, count: item.count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  };

  return {
    event_types: tally("event_type"),
    tracking_sources: tally("tracking_source_id"),
    statuses: tally("status"),
    channels: tally("channel"),
  };
}

export function normalizeCustomerEvent(raw: unknown, index = 0): CustomerEvent | null {
  const record = asRecord(raw);
  if (!record) return null;

  const nestedSource = asRecord(record.tracking_source) || asRecord(record.trackingSource);
  const eventType =
    pickString(record, ["event_type", "eventType", "event_code", "eventCode", "code"]) ||
    pickString(record, ["title"]).toLowerCase().replace(/\s+/g, "_");
  if (!eventType) return null;

  const catalog = CUSTOMER_EVENT_CATALOG.find((item) => item.code === eventType);
  const occurredAt =
    pickString(record, [
      "occurred_at",
      "occurredAt",
      "timestamp",
      "event_time",
      "eventTime",
      "date",
      "created_at",
      "createdAt",
    ]) || new Date().toISOString();

  const channelRaw =
    pickString(record, ["channel", "delivery_channel", "deliveryChannel"]) ||
    catalog?.channel ||
    "other";
  const originRaw =
    pickString(record, ["origin", "event_origin", "eventOrigin", "actor", "source_kind"]) ||
    catalog?.origin ||
    "system";

  const trackingSourceId =
    pickString(record, [
      "tracking_source_id",
      "trackingSourceId",
      "tracking_source",
      "trackingSource",
    ]) ||
    pickString(nestedSource || {}, ["id", "code", "source_type", "sourceType"]) ||
    catalog?.tracking_source_id ||
    "custom";

  const trackingSourceName =
    pickString(record, ["tracking_source_name", "trackingSourceName"]) ||
    pickString(nestedSource || {}, ["name", "label"]) ||
    catalog?.tracking_source_name ||
    trackingSourceId;

  return {
    id:
      pickString(record, ["id", "event_id", "eventId"]) ||
      `EVT-${eventType}-${index}`,
    event_type: eventType,
    event_type_label:
      pickString(record, ["event_type_label", "eventTypeLabel", "event_name", "eventName", "title"]) ||
      catalog?.label ||
      eventType.replace(/_/g, " "),
    description:
      pickString(record, ["description", "event_description", "eventDescription"]) ||
      catalog?.description ||
      "",
    channel: normalizeChannel(channelRaw),
    tracking_source_id: String(trackingSourceId),
    tracking_source_name: trackingSourceName,
    origin: normalizeOrigin(originRaw),
    status: pickString(record, ["status", "event_status", "eventStatus"]) || "Recorded",
    occurred_at: occurredAt,
  };
}

export function unwrapEventList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["data", "events", "items", "results", "rows"]) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate;
    const nested = asRecord(candidate);
    if (nested) {
      for (const nestedKey of ["data", "events", "items", "results", "rows"]) {
        if (Array.isArray(nested[nestedKey])) return nested[nestedKey] as unknown[];
      }
    }
  }
  return [];
}

export function parseApiCounts(raw: unknown): CustomerEventCounts | null {
  const record = asRecord(raw);
  if (!record) return null;

  const readBucket = (value: unknown): CustomerEventCountBucket | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return { total: value, customer: 0, system: 0 };
    }
    const bucket = asRecord(value);
    if (!bucket) return null;
    const total = Number(bucket.total ?? bucket.count ?? 0);
    const customer = Number(bucket.customer ?? bucket.customer_driven ?? 0);
    const system = Number(bucket.system ?? bucket.system_events ?? 0);
    if (!Number.isFinite(total)) return null;
    return { total, customer, system };
  };

  const counts = emptyCounts();
  let found = false;
  (Object.keys(counts) as Array<keyof CustomerEventCounts>).forEach((key) => {
    const bucket =
      readBucket(record[key]) ||
      readBucket(record[key.replace("last_", "")]) ||
      readBucket(record[key.replace("_", "")]);
    if (bucket) {
      counts[key] = bucket;
      found = true;
    }
  });
  return found ? counts : null;
}

function createSeededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function hashSeed(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

/**
 * Deterministic fallback stream so the same subscriber always sees the same
 * events when the events API is not yet available.
 */
export function generateFallbackCustomerEvents(
  subscriberId: string,
  now: Date = new Date(),
): CustomerEvent[] {
  const random = createSeededRandom(hashSeed(subscriberId));
  const catalog = CUSTOMER_EVENT_CATALOG;
  const windows = [
    { withinMs: 45 * 60 * 1000, count: 3 },
    { withinMs: 18 * 60 * 60 * 1000, count: 8 },
    { withinMs: 5 * 24 * 60 * 60 * 1000, count: 12 },
    { withinMs: 22 * 24 * 60 * 60 * 1000, count: 16 },
    { withinMs: 75 * 24 * 60 * 60 * 1000, count: 14 },
  ];

  const events: CustomerEvent[] = [];
  let sequence = 0;

  windows.forEach((window, windowIndex) => {
    for (let i = 0; i < window.count; i += 1) {
      const definition = catalog[Math.floor(random() * catalog.length)];
      const status =
        definition.statuses[Math.floor(random() * definition.statuses.length)];
      const offset = Math.floor(random() * window.withinMs);
      const occurred = new Date(now.getTime() - offset - windowIndex * 1000);
      sequence += 1;
      events.push({
        id: `EVT-${subscriberId}-${sequence}`,
        event_type: definition.code,
        event_type_label: definition.label,
        description: definition.description,
        channel: definition.channel,
        tracking_source_id: definition.tracking_source_id,
        tracking_source_name: definition.tracking_source_name,
        origin: definition.origin,
        status,
        occurred_at: occurred.toISOString(),
      });
    }
  });

  return events.sort(
    (a, b) =>
      (parseEventDate(b.occurred_at)?.getTime() || 0) -
      (parseEventDate(a.occurred_at)?.getTime() || 0),
  );
}

export function humanizeChannel(channel: string): string {
  if (!channel) return "—";
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

export function humanizeOrigin(origin: CustomerEventOrigin): string {
  return origin === "customer" ? "Customer-driven" : "System";
}

export function hasActiveEventFilters(
  query: CustomerEventQuery,
  defaultPreset: EventTimePreset = "last_30d",
): boolean {
  return Boolean(
    query.search?.trim() ||
      (query.event_type && query.event_type !== "all") ||
      (query.tracking_source_id && query.tracking_source_id !== "all") ||
      (query.origin && query.origin !== "all") ||
      (query.status && query.status !== "all") ||
      (query.channel && query.channel !== "all") ||
      (query.time_preset && query.time_preset !== defaultPreset) ||
      query.date_from ||
      query.date_to,
  );
}
