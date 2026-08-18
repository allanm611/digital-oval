/**
 * Canonical broadcast statuses from cvm.broadcasts
 * (see migrations/20260722_fix_broadcasts_status_constraint.sql)
 */
export type BroadcastStatus =
  | "draft"
  | "pending"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "aborted"
  | "cancelled";

export const BROADCAST_STATUSES: BroadcastStatus[] = [
  "draft",
  "pending",
  "scheduled",
  "running",
  "paused",
  "completed",
  "failed",
  "aborted",
  "cancelled",
];

/** Human-readable labels for DB statuses */
export const BROADCAST_STATUS_LABELS: Record<BroadcastStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  scheduled: "Scheduled",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
  aborted: "Aborted",
  cancelled: "Cancelled",
};

export interface Broadcast {
  broadcast_id: string;
  broadcast_name: string;
  run_id: string;
  status: BroadcastStatus;
  actual_start_time: string;
  actual_end_time: string;
  messages_queued: number;
  messages_sent: number;
  messages_delivered: number;
  messages_failed: number;
  total_batches: number;
  processed_count: number;
  error_count: number;
  retry_count: number;
  avg_processing_time_ms: number;
  delivery_rate: number;
  channel_code?: string;
  segment_name?: string;
  broadcast_type?: string;
  planned_start_time?: string;
  /** Present on operational list rows */
  campaign_id?: number;
  campaign_name?: string;
  offer_id?: number;
  offer_name?: string;
  segment_id?: number;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BroadcastsResponse {
  success: boolean;
  data: Broadcast[];
  total: number;
  error?: string;
}

/** Nested entity refs from GET /broadcasts/:id/details */
export interface BroadcastEntityRef {
  id: number | string | null;
  name: string | null;
}

export interface BroadcastDeliveryLog {
  id: string | number;
  recipient: string;
  channel: string;
  title: string;
  body_text: string;
  status: "DELIVERED" | "FAILED" | string;
  status_code: number;
  provider_response_or_error: string | null;
  created_at: string;
}

export interface BroadcastDetails {
  broadcast: {
    id: string | number;
    name: string;
    campaign: BroadcastEntityRef;
    segment: BroadcastEntityRef;
    offer: BroadcastEntityRef;
    channel_code: string | null;
    status: BroadcastStatus;
    start_time: string | null;
    end_time: string | null;
    timezone: string | null;
    broadcast_type: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  metrics: {
    total_audience: number;
    messages_sent: number;
    messages_failed: number;
  };
  policy_violations: unknown[];
  delivery_logs: BroadcastDeliveryLog[];
}

export interface BroadcastDetailsResponse {
  success: boolean;
  data?: BroadcastDetails;
  error?: string;
}
