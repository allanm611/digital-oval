/**
 * Customer 360 event stream — customer-driven actions and system events.
 *
 * Backend contract (when available):
 *   GET /subscribers/:id/events
 *   Query: search, event_type, tracking_source_id, origin, status, channel,
 *          preset, from, to, limit, offset
 *   Body: { success, data, pagination, counts, facets }
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

export interface CustomerEvent {
  id: string;
  event_type: string;
  event_type_label: string;
  description: string;
  channel: CustomerEventChannel;
  tracking_source_id: string;
  tracking_source_name: string;
  origin: CustomerEventOrigin;
  status: string;
  occurred_at: string;
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
  sourceType?: string;
}
