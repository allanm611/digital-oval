/**
 * Customer 360 event stream — customer-driven actions and system events.
 *
 * Source of truth:
 *   GET /subscribers/:id/events
 * Query: optional preset (last_1h | last_24h | last_7d | last_30d | last_90d),
 *        from, to, search, event_type, tracking_source_id, origin, status,
 *        channel, limit (<= 50), offset
 * Body: { success, data, pagination, counts, facets }
 */

export type CustomerEventOrigin = "customer" | "system";

export type CustomerEventChannel =
  | "email"
  | "sms"
  | "push"
  | "ussd"
  | "app"
  | "web"
  | "api"
  | "voice"
  | "other";

export type EventTimePreset =
  | "last_1h"
  | "last_24h"
  | "last_7d"
  | "last_30d"
  | "last_90d"
  | "all"
  | "custom";

export interface CustomerEventOfferSummary {
  id: number | null;
  name: string;
  code: string;
  type: string;
  status: string;
  description: string;
}

export interface CustomerEventCampaignSummary {
  id: number | null;
  name: string;
  code: string;
  status: string;
  type: string;
}

export interface CustomerEventCreativeSummary {
  id: number | null;
  name: string;
  channel: string;
  title: string;
  locale: string;
  text_body: string;
  html_body: string;
}

export interface CustomerEventMessageSummary {
  subject: string;
  content: string;
  direction: "inbound" | "outbound" | null;
  received_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
}

/** Commercial fields when the event payload includes a real transaction. */
export interface CustomerEventPurchaseContext {
  transaction_id: string | null;
  product_id: number | null;
  product_name: string;
  product_code: string;
  amount: number | null;
  currency: string | null;
  quantity: number | null;
  payment_method: string | null;
}

/** Points / program fields when the event payload includes a loyalty ledger. */
export interface CustomerEventLoyaltyContext {
  points: number | null;
  points_balance: number | null;
  kind: string | null;
  reward_name: string;
  reward_type: string | null;
  program_name: string | null;
  tier: string | null;
  tier_from: string | null;
  tier_to: string | null;
}

/** Care fields when the event payload includes a ticket, call, or complaint. */
export interface CustomerEventInteractionContext {
  ticket_id: string | null;
  subject: string;
  notes: string;
  agent: string | null;
  kind: string | null;
  resolution: string | null;
}

/** Handset / session fields when the event payload includes a real device. */
export interface CustomerEventDeviceContext {
  device_id: string | null;
  device_name: string;
  device_type: string | null;
  os: string | null;
  os_version: string | null;
  app_version: string | null;
  imei: string | null;
}

export interface CustomerEvent {
  id: string;
  event_type: string;
  event_type_label: string;
  description: string;
  channel: CustomerEventChannel;
  channel_raw?: string;
  communication_channel_id?: string;
  communication_channel_code?: string;
  tracking_source_id: string;
  tracking_source_name: string;
  origin: CustomerEventOrigin;
  status: string;
  occurred_at: string;
  offer: CustomerEventOfferSummary | null;
  campaign: CustomerEventCampaignSummary | null;
  creative: CustomerEventCreativeSummary | null;
  message: CustomerEventMessageSummary | null;
  purchase: CustomerEventPurchaseContext | null;
  loyalty: CustomerEventLoyaltyContext | null;
  interaction: CustomerEventInteractionContext | null;
  device: CustomerEventDeviceContext | null;
}

export interface CustomerEventCountBucket {
  total: number;
  customer: number;
  system: number;
}

export type CustomerEventCounts = Record<
  Exclude<EventTimePreset, "custom">,
  CustomerEventCountBucket
>;

export interface CustomerEventFacetOption {
  value: string;
  label: string;
  count?: number;
}

export interface CustomerEventFacets {
  event_types: CustomerEventFacetOption[];
  tracking_sources: CustomerEventFacetOption[];
  statuses: CustomerEventFacetOption[];
  channels: CustomerEventFacetOption[];
}

export interface CustomerEventQuery {
  search?: string;
  event_type?: string;
  event_types?: string[];
  tracking_source_id?: string;
  origin?: CustomerEventOrigin | "all";
  status?: string;
  channel?: string;
  time_preset?: EventTimePreset;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface CustomerEventListResult {
  events: CustomerEvent[];
  allEvents: CustomerEvent[];
  total: number;
  counts: CustomerEventCounts;
  facets: CustomerEventFacets;
  source: "api" | "fallback";
}

export interface CustomerEventCatalogItem {
  code: string;
  label: string;
  description: string;
  origin: CustomerEventOrigin;
  channel: CustomerEventChannel;
  tracking_source_id: string;
  tracking_source_name: string;
  statuses: string[];
}

export interface TrackingSourceOption {
  id: string;
  name: string;
  code: string;
  sourceType?: string;
}

export interface CommunicationChannelOption {
  id: string;
  name: string;
  code: string;
}

export interface EventFilterCatalogs {
  trackingSources?: TrackingSourceOption[];
  communicationChannels?: CommunicationChannelOption[];
}
