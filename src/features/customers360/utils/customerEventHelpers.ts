import type {
  CustomerEvent,
  CustomerEventCampaignSummary,
  CustomerEventCatalogItem,
  CustomerEventChannel,
  CustomerEventCountBucket,
  CustomerEventCounts,
  CustomerEventCreativeSummary,
  CustomerEventFacets,
  CustomerEventLoyaltyContext,
  CustomerEventMessageSummary,
  CustomerEventOfferSummary,
  CustomerEventOrigin,
  CustomerEventPurchaseContext,
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

/** Visible time-filter tabs on Customer 360 Events. Custom replaces Last 90 days. */
export const EVENT_TIME_TABS: Array<{
  key: Exclude<EventTimePreset, "all" | "last_90d">;
  label: string;
  hint: string;
}> = [
  { key: "last_1h", label: "Last 1 hr", hint: "Rolling hour" },
  { key: "last_24h", label: "Last 24 hrs", hint: "Rolling day" },
  { key: "last_7d", label: "Last 7 days", hint: "Rolling week" },
  { key: "last_30d", label: "Last 30 days", hint: "Rolling month" },
  { key: "custom", label: "Custom range", hint: "Pick a date range" },
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
    code: "points_earned",
    label: "Points Earned",
    description: "Customer earned loyalty points",
    origin: "system",
    channel: "app",
    tracking_source_id: "loyalty",
    tracking_source_name: "Loyalty",
    statuses: ["Completed"],
  },
  {
    code: "points_redeemed",
    label: "Points Redeemed",
    description: "Customer redeemed loyalty points for a reward",
    origin: "customer",
    channel: "app",
    tracking_source_id: "loyalty",
    tracking_source_name: "Loyalty",
    statuses: ["Completed", "Failed"],
  },
  {
    code: "loyalty_tier_changed",
    label: "Loyalty Tier Changed",
    description: "Customer loyalty program tier changed",
    origin: "system",
    channel: "app",
    tracking_source_id: "loyalty",
    tracking_source_name: "Loyalty",
    statuses: ["Completed"],
  },
  {
    code: "reward_granted",
    label: "Reward Granted",
    description: "A loyalty or manual reward was granted to the customer",
    origin: "system",
    channel: "app",
    tracking_source_id: "loyalty",
    tracking_source_name: "Loyalty",
    statuses: ["Completed", "Failed"],
  },
  {
    code: "opt_out",
    label: "Opted Out",
    description: "Customer opted out of a communication channel or DND list",
    origin: "customer",
    channel: "sms",
    tracking_source_id: "consent",
    tracking_source_name: "Consent",
    statuses: ["Completed"],
  },
  {
    code: "opt_in",
    label: "Opted In",
    description: "Customer opted in to a communication channel",
    origin: "customer",
    channel: "app",
    tracking_source_id: "consent",
    tracking_source_name: "Consent",
    statuses: ["Completed"],
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
  {
    code: "received_message",
    label: "Received Message",
    description: "Customer received a campaign or offer message",
    origin: "system",
    channel: "sms",
    tracking_source_id: "usage_sms",
    tracking_source_name: "SMS Usage",
    statuses: ["Received", "Delivered", "Read"],
  },
  {
    code: "message_received",
    label: "Message Received",
    description: "Inbound or delivery confirmation for a customer message",
    origin: "customer",
    channel: "sms",
    tracking_source_id: "usage_sms",
    tracking_source_name: "SMS Usage",
    statuses: ["Received", "Delivered"],
  },
];

/** Event types that typically carry offer / campaign / creative / message context. */
export const COMMUNICATION_EVENT_TYPES = new Set([
  "offer_redeemed",
  "offer_accepted",
  "welcome_email",
  "promotional_sms",
  "price_drop_alert",
  "order_confirmation",
  "delivery_notification",
  "new_products",
  "newsletter",
  "order_alert",
  "campaign_executed",
  "received_message",
  "message_received",
  "message_sent",
  "message_delivered",
]);

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

function pickId(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return value;
    }
    if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      return Number(value.trim());
    }
  }
  return null;
}

function pickNumber(raw: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value.replace(/[, ]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function parsePurchaseContext(
  record: Record<string, unknown>,
): CustomerEventPurchaseContext | null {
  const commercial =
    asRecord(record.purchase) ||
    asRecord(record.transaction) ||
    asRecord(record.order);
  const nestedMeta =
    asRecord(record.properties) ||
    asRecord(record.payload) ||
    asRecord(record.metadata) ||
    asRecord(record.context);
  const product =
    asRecord(record.product) ||
    asRecord(commercial?.product) ||
    asRecord(nestedMeta?.product) ||
    asRecord(commercial?.bundle);
  const amountSources = [record, commercial].filter(
    Boolean,
  ) as Record<string, unknown>[];
  const sources = [record, commercial, nestedMeta].filter(
    Boolean,
  ) as Record<string, unknown>[];

  const transactionId =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, [
          "transaction_id",
          "transactionId",
          "txn_id",
          "reference",
          "order_id",
          "orderId",
        ]),
      "",
    ) || null;
  const productId =
    sources.reduce(
      (found: number | null, source) =>
        found ??
        pickId(source, ["product_id", "productId", "bundle_id", "bundleId"]),
      null,
    ) ?? pickId(product || {}, ["id", "product_id", "productId"]);
  const productName =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, [
          "product_name",
          "productName",
          "bundle_name",
          "bundleName",
        ]),
      "",
    ) || pickString(product || {}, ["name", "product_name", "title"]);
  const productCode =
    sources.reduce(
      (found, source) =>
        found || pickString(source, ["product_code", "productCode"]),
      "",
    ) || pickString(product || {}, ["product_code", "code"]);
  const amount = amountSources.reduce(
    (found: number | null, source) =>
      found ??
      pickNumber(source, [
        "amount",
        "paid_amount",
        "purchase_amount",
        "transaction_amount",
        "total",
      ]),
    null,
  );
  const currency =
    sources.reduce(
      (found, source) => found || pickString(source, ["currency", "currency_code"]),
      "",
    ) || pickString(product || {}, ["currency"]) ||
    null;
  const quantity = sources.reduce(
    (found: number | null, source) =>
      found ?? pickNumber(source, ["quantity", "qty"]),
    null,
  );
  const paymentMethod =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, [
          "payment_method",
          "paymentMethod",
          "payment_type",
          "paymentType",
        ]),
      "",
    ) || null;

  if (
    !transactionId &&
    !productId &&
    !productName &&
    amount == null &&
    !paymentMethod
  ) {
    return null;
  }

  return {
    transaction_id: transactionId,
    product_id: productId,
    product_name: productName,
    product_code: productCode,
    amount,
    currency,
    quantity,
    payment_method: paymentMethod,
  };
}

function parseLoyaltyContext(
  record: Record<string, unknown>,
): CustomerEventLoyaltyContext | null {
  const pointsObject =
    typeof record.points === "object" ? asRecord(record.points) : null;
  const nested =
    asRecord(record.loyalty) ||
    asRecord(record.loyalty_account) ||
    pointsObject ||
    asRecord(record.reward);
  const sources = [record, nested].filter(Boolean) as Record<string, unknown>[];

  const points = sources.reduce(
    (found: number | null, source) =>
      found ??
      pickNumber(source, [
        "points",
        "points_amount",
        "loyalty_points",
        "points_earned",
        "points_redeemed",
        "points_granted",
        "points_expired",
        "points_delta",
      ]),
    null,
  );
  const pointsBalance = sources.reduce(
    (found: number | null, source) =>
      found ??
      pickNumber(source, [
        "points_balance",
        "current_points",
        "points_balance_after",
      ]),
    null,
  );
  const kind =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, ["loyalty_kind", "points_kind", "ledger_type"]),
      "",
    ) || null;
  const rewardName =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, [
          "reward_name",
          "rewardName",
          "loyalty_reward",
          "benefit_name",
        ]),
      "",
    ) || pickString(asRecord(record.reward) || {}, ["name", "title"]);
  const rewardType =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, ["reward_type", "rewardType", "loyalty_reward_type"]),
      "",
    ) || null;
  const programName =
    sources.reduce(
      (found, source) =>
        found ||
        pickString(source, [
          "program_name",
          "programName",
          "loyalty_program",
          "program",
        ]),
      "",
    ) || null;
  const tier =
    sources.reduce(
      (found, source) =>
        found || pickString(source, ["tier", "loyalty_tier", "program_tier"]),
      "",
    ) || null;
  const tierFrom =
    sources.reduce(
      (found, source) =>
        found || pickString(source, ["tier_from", "previous_tier", "from_tier"]),
      "",
    ) || null;
  const tierTo =
    sources.reduce(
      (found, source) =>
        found || pickString(source, ["tier_to", "new_tier", "to_tier"]),
      "",
    ) || null;

  const typeLooksLoyalty = /point|loyalty|cashback|voucher/.test(
    String(rewardType || kind || "").toLowerCase(),
  );

  if (
    points == null &&
    pointsBalance == null &&
    !rewardName &&
    !tier &&
    !tierFrom &&
    !tierTo &&
    !programName &&
    !typeLooksLoyalty
  ) {
    return null;
  }

  return {
    points,
    points_balance: pointsBalance,
    kind,
    reward_name: rewardName,
    reward_type: rewardType,
    program_name: programName,
    tier,
    tier_from: tierFrom,
    tier_to: tierTo,
  };
}

function parseJsonRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      return asRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  return asRecord(value);
}

function firstRecord(
  ...values: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> | null {
  return values.find((item): item is Record<string, unknown> => Boolean(item)) || null;
}

function parseNestedContext(record: Record<string, unknown>): Record<string, unknown> {
  return (
    parseJsonRecord(record.metadata) ||
    parseJsonRecord(record.payload) ||
    parseJsonRecord(record.context) ||
    parseJsonRecord(record.properties) ||
    parseJsonRecord(record.details) ||
    parseJsonRecord(record.data) ||
    {}
  );
}

function parseOfferSummary(
  record: Record<string, unknown>,
): CustomerEventOfferSummary | null {
  const context = parseNestedContext(record);
  const nested = firstRecord(
    asRecord(record.offer),
    asRecord(record.offer_details),
    asRecord(record.offerDetails),
    asRecord(context.offer),
    asRecord(context.offer_details),
  );
  const id =
    (nested ? pickId(nested, ["id", "offer_id", "offerId"]) : null) ||
    pickId(record, ["offer_id", "offerId"]) ||
    pickId(context, ["offer_id", "offerId"]);
  const name =
    pickString(nested || {}, ["name", "offer_name", "offerName", "title"]) ||
    pickString(record, ["offer_name", "offerName"]) ||
    pickString(context, ["offer_name", "offerName"]) ||
    (typeof record.offer === "string" ? record.offer.trim() : "");
  const code =
    pickString(nested || {}, ["code", "offer_code", "offerCode"]) ||
    pickString(record, ["offer_code", "offerCode"]) ||
    pickString(context, ["offer_code", "offerCode"]);
  const type =
    pickString(nested || {}, ["type", "offer_type", "offerType", "offer_type_label"]) ||
    pickString(record, ["offer_type", "offerType"]) ||
    pickString(context, ["offer_type", "offerType"]);
  const status =
    pickString(nested || {}, ["status", "lifecycle_status", "lifecycleStatus"]) ||
    pickString(record, ["offer_status", "offerStatus"]);
  const description =
    pickString(nested || {}, ["description", "offer_description"]) ||
    pickString(record, ["offer_description", "offerDescription"]);
  if (!id && !name && !code) return null;
  return { id, name, code, type, status, description };
}

function parseCampaignSummary(
  record: Record<string, unknown>,
): CustomerEventCampaignSummary | null {
  const context = parseNestedContext(record);
  const nested = firstRecord(
    asRecord(record.campaign),
    asRecord(record.campaign_details),
    asRecord(record.campaignDetails),
    asRecord(context.campaign),
  );
  const id =
    (nested ? pickId(nested, ["id", "campaign_id", "campaignId"]) : null) ||
    pickId(record, ["campaign_id", "campaignId"]) ||
    pickId(context, ["campaign_id", "campaignId"]);
  const name =
    pickString(nested || {}, ["name", "campaign_name", "campaignName", "title"]) ||
    pickString(record, ["campaign_name", "campaignName"]) ||
    pickString(context, ["campaign_name", "campaignName"]) ||
    (typeof record.campaign === "string" ? record.campaign.trim() : "");
  const code =
    pickString(nested || {}, ["code", "campaign_code", "campaignCode"]) ||
    pickString(record, ["campaign_code", "campaignCode"]) ||
    pickString(context, ["campaign_code", "campaignCode"]);
  const status =
    pickString(nested || {}, ["status", "campaign_status", "campaignStatus"]) ||
    pickString(record, ["campaign_status", "campaignStatus"]);
  const type =
    pickString(nested || {}, ["type", "campaign_type", "campaignType"]) ||
    pickString(record, ["campaign_type", "campaignType"]);
  if (!id && !name && !code) return null;
  return { id, name, code, status, type };
}

function parseCreativeFromRecord(
  src: Record<string, unknown>,
  fallback: Record<string, unknown>,
  nested: boolean,
): CustomerEventCreativeSummary | null {
  const context = parseNestedContext(fallback);
  const id =
    (nested ? pickId(src, ["id", "creative_id", "creativeId", "offer_creative_id"]) : null) ||
    pickId(src, ["creative_id", "creativeId", "offer_creative_id"]) ||
    pickId(fallback, ["creative_id", "creativeId", "offer_creative_id"]) ||
    pickId(context, ["creative_id", "creativeId"]);
  const name =
    pickString(src, nested ? ["name", "creative_name", "creativeName"] : ["creative_name", "creativeName"]) ||
    pickString(fallback, ["creative_name", "creativeName"]);
  const channel = nested
    ? pickString(src, ["channel", "creative_channel"])
    : pickString(src, ["creative_channel"]) ||
      pickString(fallback, ["creative_channel", "creativeChannel"]);
  const title = nested
    ? pickString(src, ["title", "subject", "headline"])
    : pickString(src, ["creative_title", "creativeTitle"]);
  const locale = pickString(src, ["locale", "language"]);
  const textBody = nested
    ? pickString(src, ["text_body", "textBody", "body", "content", "message"])
    : pickString(src, ["creative_text", "creativeText"]) ||
      pickString(fallback, ["creative_text", "creativeText"]);
  const htmlBody = pickString(src, ["html_body", "htmlBody", "html"]);
  if (!id && !name && !title && !textBody && !htmlBody) return null;
  return {
    id,
    name,
    channel,
    title,
    locale,
    text_body: textBody,
    html_body: htmlBody,
  };
}

function parseCreativeSummary(
  record: Record<string, unknown>,
): CustomerEventCreativeSummary | null {
  const context = parseNestedContext(record);
  const nested = firstRecord(
    asRecord(record.creative),
    asRecord(record.offer_creative),
    asRecord(record.offerCreative),
    asRecord(record.creative_details),
    asRecord(context.creative),
  );
  if (nested) return parseCreativeFromRecord(nested, record, true);

  const list =
    (Array.isArray(record.creatives) && record.creatives[0]) ||
    (Array.isArray(context.creatives) && context.creatives[0]);
  const listRecord = asRecord(list);
  if (listRecord) return parseCreativeFromRecord(listRecord, record, true);

  return parseCreativeFromRecord(record, record, false);
}

function parseMessageDirection(value: string): "inbound" | "outbound" | null {
  const normalized = value.trim().toLowerCase();
  if (
    ["inbound", "in", "received", "incoming", "mo", "customer"].includes(
      normalized,
    )
  ) {
    return "inbound";
  }
  if (
    ["outbound", "out", "sent", "outgoing", "mt", "system"].includes(normalized)
  ) {
    return "outbound";
  }
  return null;
}

function parseMessageSummary(
  record: Record<string, unknown>,
  eventType: string,
  occurredAt: string,
): CustomerEventMessageSummary | null {
  const context = parseNestedContext(record);
  const nested = firstRecord(
    asRecord(record.message),
    asRecord(record.message_details),
    asRecord(record.messageDetails),
    asRecord(record.content),
    asRecord(context.message),
  );
  const src = nested || {};
  const subject =
    pickString(src, ["subject", "title", "headline"]) ||
    pickString(record, ["message_subject", "messageSubject"]) ||
    pickString(context, ["message_subject", "subject"]);
  const content =
    pickString(src, [
      "content",
      "body",
      "text",
      "text_body",
      "textBody",
      "message_body",
      "messageBody",
      "message_content",
      "messageContent",
    ]) ||
    pickString(record, [
      "message_body",
      "messageBody",
      "message_content",
      "messageContent",
    ]) ||
    (typeof record.message === "string" ? record.message.trim() : "") ||
    (typeof record.content === "string" ? record.content.trim() : "");
  const receivedAt =
    pickString(src, [
      "received_at",
      "receivedAt",
      "inbound_at",
      "inboundAt",
      "message_received_at",
    ]) || pickString(record, ["received_at", "receivedAt", "message_received_at"]);
  const sentAt =
    pickString(src, ["sent_at", "sentAt", "message_sent_at"]) ||
    pickString(record, ["sent_at", "sentAt"]);
  const deliveredAt =
    pickString(src, ["delivered_at", "deliveredAt", "message_delivered_at"]) ||
    pickString(record, ["delivered_at", "deliveredAt"]);
  const directionRaw =
    pickString(src, ["direction", "message_direction", "messageDirection"]) ||
    pickString(record, ["direction"]);
  const inboundFlag = src.inbound === true || record.inbound === true;
  let direction = parseMessageDirection(directionRaw);
  if (!direction && inboundFlag) direction = "inbound";
  if (
    !direction &&
    (eventType === "received_message" || eventType === "message_received")
  ) {
    direction = "inbound";
  }

  if (!subject && !content && !receivedAt && !sentAt && !deliveredAt && !direction) {
    return null;
  }

  return {
    subject,
    content,
    direction,
    received_at:
      receivedAt ||
      (direction === "inbound" ||
      eventType === "received_message" ||
      eventType === "message_received"
        ? occurredAt
        : null),
    sent_at: sentAt || null,
    delivered_at: deliveredAt || null,
  };
}

export function isCommunicationLinkedEvent(event: {
  event_type?: string;
  code?: string;
}): boolean {
  const type = (event.event_type || event.code || "").trim().toLowerCase();
  if (!type) return false;
  if (COMMUNICATION_EVENT_TYPES.has(type)) return true;
  return /message|offer|campaign|email|newsletter|creative|promotional/.test(
    type,
  );
}

export function hasEventRelatedContext(event: CustomerEvent): boolean {
  return Boolean(
    event.offer?.id ||
      event.offer?.name ||
      event.offer?.code ||
      event.campaign?.id ||
      event.campaign?.name ||
      event.campaign?.code ||
      event.creative?.id ||
      event.creative?.name ||
      event.creative?.text_body ||
      event.message?.content ||
      event.message?.subject ||
      event.message?.received_at,
  );
}

export function eventMessageReceivedAt(event: CustomerEvent): string | null {
  return (
    event.message?.received_at ||
    event.message?.delivered_at ||
    (event.message?.direction === "inbound" ? event.occurred_at : null) ||
    (event.event_type === "received_message" ||
    event.event_type === "message_received"
      ? event.occurred_at
      : null)
  );
}

export function stripHtmlPreview(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function creativeBodyPreview(
  creative: CustomerEventCreativeSummary | null,
): string {
  if (!creative) return "";
  return creative.text_body || stripHtmlPreview(creative.html_body);
}

export function toCreativeChannel(
  channel: CustomerEventChannel | string,
): "SMS" | "Email" | "Push" | "InApp" | "Web" | "IVR" | "USSD" | "WhatsApp" | null {
  const normalized = String(channel || "").trim().toLowerCase();
  if (normalized === "sms" || normalized === "whatsapp" || normalized === "short_code") {
    return normalized === "whatsapp" ? "WhatsApp" : "SMS";
  }
  if (normalized === "email") return "Email";
  if (normalized === "push") return "Push";
  if (normalized === "app" || normalized === "inapp" || normalized === "mobile") {
    return "InApp";
  }
  if (normalized === "web") return "Web";
  if (normalized === "ussd") return "USSD";
  if (normalized === "voice" || normalized === "ivr" || normalized === "obd") {
    return "IVR";
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
    if (from) from.setHours(0, 0, 0, 0);
    if (to) to.setHours(23, 59, 59, 999);
    if (from && to && from > to) return { from: to, to: from };
    return { from, to };
  }

  const window = EVENT_COUNT_WINDOWS.find((item) => item.key === preset);
  if (!window) return { from: null, to: null };
  return { from: new Date(now.getTime() - window.ms), to: now };
}

export function todayDateInputValue(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeDateOrder(from: string, to: string): { from: string; to: string } {
  if (from && to && from > to) return { from: to, to: from };
  return { from, to };
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
    event.offer?.name,
    event.offer?.code,
    event.campaign?.name,
    event.campaign?.code,
    event.creative?.name,
    event.creative?.title,
    event.message?.subject,
    event.message?.content,
  ].some((value) => (value || "").toLowerCase().includes(term));
}

export function filterCustomerEvents(
  events: CustomerEvent[],
  query: CustomerEventQuery,
  now: Date = new Date(),
): CustomerEvent[] {
  const origin = query.origin && query.origin !== "all" ? query.origin : "";
  const eventTypes = (query.event_types || []).filter(
    (item) => item && item !== "all",
  );
  const eventType =
    !eventTypes.length && query.event_type && query.event_type !== "all"
      ? query.event_type
      : "";
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
    if (eventTypes.length > 0 && !eventTypes.includes(event.event_type)) {
      return false;
    }
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
    offer: parseOfferSummary(record),
    campaign: parseCampaignSummary(record),
    creative: parseCreativeSummary(record),
    message: parseMessageSummary(record, eventType, occurredAt),
    purchase: parsePurchaseContext(record),
    loyalty: parseLoyaltyContext(record),
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

function buildFallbackRelatedContext(
  definition: CustomerEventCatalogItem,
  occurredAt: string,
  random: () => number,
): Pick<CustomerEvent, "offer" | "campaign" | "creative" | "message"> {
  if (!isCommunicationLinkedEvent(definition)) {
    return { offer: null, campaign: null, creative: null, message: null };
  }

  const offerIndex = Math.floor(random() * 3);
  const offers = [
    {
      name: "Welcome Data Bundle",
      code: "WELCOME-DATA",
      type: "Bundle",
      status: "active",
      description: "Starter data bundle for newly acquired subscribers.",
    },
    {
      name: "Flash Sale Voice Pack",
      code: "FLASH-VOICE",
      type: "Voice",
      status: "active",
      description: "Limited-time voice minutes with bonus SMS.",
    },
    {
      name: "Loyalty Bonus Offer",
      code: "LOYALTY-BONUS",
      type: "Bonus",
      status: "approved",
      description: "Reward offer for high-value customers.",
    },
  ];
  const campaigns = [
    { name: "Onboarding Welcome", code: "CMP-ONBOARD", status: "active", type: "lifecycle" },
    { name: "Weekend Flash Sale", code: "CMP-FLASH", status: "active", type: "promotional" },
    { name: "Loyalty Retention", code: "CMP-LOYAL", status: "scheduled", type: "retention" },
  ];
  const offer = offers[offerIndex];
  const campaign = campaigns[offerIndex];
  const inbound =
    definition.code === "received_message" || definition.code === "message_received";
  const occurred = parseEventDate(occurredAt) || new Date();
  const sentAt = new Date(occurred.getTime() - 90 * 1000).toISOString();
  const bodyByChannel: Record<string, string> = {
    email: `Hi, you qualify for ${offer.name}. Open the app to redeem ${offer.code}.`,
    sms: `${offer.name}: reply YES to redeem ${offer.code}.`,
    push: `${offer.name} is ready. Tap to view your reward.`,
    app: `Redeem ${offer.name} (${offer.code}) in the offers tab.`,
  };
  const content =
    bodyByChannel[definition.channel] ||
    `${offer.name} is available on ${definition.channel}.`;

  return {
    offer: {
      id: null,
      name: offer.name,
      code: offer.code,
      type: offer.type,
      status: offer.status,
      description: offer.description,
    },
    campaign: {
      id: null,
      name: campaign.name,
      code: campaign.code,
      status: campaign.status,
      type: campaign.type,
    },
    creative: {
      id: null,
      name: `${campaign.name} ${definition.channel} creative`,
      channel: definition.channel,
      title: offer.name,
      locale: "en",
      text_body: content,
      html_body: "",
    },
    message: {
      subject: definition.channel === "email" ? offer.name : "",
      content,
      direction: inbound ? "inbound" : "outbound",
      received_at: inbound ? occurredAt : null,
      sent_at: inbound ? sentAt : occurredAt,
      delivered_at: occurredAt,
    },
  };
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
      const occurredAt = occurred.toISOString();
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
        occurred_at: occurredAt,
        purchase: null,
        loyalty: null,
        ...buildFallbackRelatedContext(definition, occurredAt, random),
      });
    }
  });

  const receivedDefinition =
    catalog.find((item) => item.code === "received_message") || catalog[0];
  sequence += 1;
  const receivedAt = new Date(now.getTime() - 12 * 60 * 1000).toISOString();
  events.push({
    id: `EVT-${subscriberId}-${sequence}`,
    event_type: receivedDefinition.code,
    event_type_label: receivedDefinition.label,
    description: receivedDefinition.description,
    channel: receivedDefinition.channel,
    tracking_source_id: receivedDefinition.tracking_source_id,
    tracking_source_name: receivedDefinition.tracking_source_name,
    origin: receivedDefinition.origin,
    status: "Received",
    occurred_at: receivedAt,
    purchase: null,
    loyalty: null,
    ...buildFallbackRelatedContext(receivedDefinition, receivedAt, random),
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
      (query.event_types && query.event_types.length > 0) ||
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
