import {
  BROADCAST_STATUSES,
  Broadcast,
  BroadcastDetails,
  BroadcastStatus,
  BROADCAST_STATUS_LABELS,
} from "../types/broadcast";

/** Legacy / UI aliases → DB status */
const STATUS_ALIASES: Record<string, BroadcastStatus> = {
  sent: "completed",
  in_progress: "running",
  inprogress: "running",
  "in-progress": "running",
  canceled: "cancelled",
  abort: "aborted",
  unknown: "pending",
};

/**
 * Normalize any status string to the DB BroadcastStatus union.
 */
export function normalizeBroadcastStatus(raw: unknown): BroadcastStatus {
  if (raw == null || raw === "") return "pending";

  const key = String(raw).trim().toLowerCase().replace(/\s+/g, "_");
  if ((BROADCAST_STATUSES as string[]).includes(key)) {
    return key as BroadcastStatus;
  }
  return STATUS_ALIASES[key] ?? "pending";
}

export function formatBroadcastStatusLabel(status: BroadcastStatus | string): string {
  const normalized = normalizeBroadcastStatus(status);
  return BROADCAST_STATUS_LABELS[normalized] ?? normalized;
}

function deliveryRate(sent: number, failed: number): number {
  const total = sent + failed;
  if (total <= 0) return 0;
  return Number(((sent / total) * 100).toFixed(2));
}

/** Raw row from GET /monitoring/reporting/campaigns/:id/broadcasts */
export function normalizeReportingBroadcastRow(row: Record<string, unknown>): Broadcast {
  const broadcastId = row.broadcast_id;
  const runId = row.run_id;
  const sent = Number(row.messages_sent ?? 0);
  const delivered = Number(row.messages_delivered ?? sent);
  const failed = Number(row.messages_failed ?? 0);

  return {
    broadcast_id: broadcastId != null ? String(broadcastId) : "",
    broadcast_name: String(row.broadcast_name ?? "—"),
    run_id: runId != null ? String(runId) : "",
    status: normalizeBroadcastStatus(row.status ?? row.broadcast_status),
    actual_start_time: String(
      row.actual_start_time ?? row.planned_start_time ?? row.broadcast_created_at ?? "",
    ),
    actual_end_time: String(row.actual_end_time ?? row.planned_end_time ?? ""),
    messages_queued: Number(row.messages_queued ?? 0),
    messages_sent: sent,
    messages_delivered: delivered,
    messages_failed: failed,
    total_batches: Number(row.total_batches ?? 0),
    processed_count: Number(row.processed_count ?? 0),
    error_count: Number(row.error_count ?? 0),
    retry_count: Number(row.retry_count ?? 0),
    avg_processing_time_ms: Number(row.avg_processing_time_ms ?? 0),
    delivery_rate: Number(row.delivery_rate ?? deliveryRate(delivered || sent, failed)),
    channel_code: row.channel_code != null ? String(row.channel_code) : undefined,
    segment_name: row.segment_name != null ? String(row.segment_name) : undefined,
    broadcast_type: row.broadcast_type != null ? String(row.broadcast_type) : undefined,
    planned_start_time:
      row.planned_start_time != null ? String(row.planned_start_time) : undefined,
    campaign_id: row.campaign_id != null ? Number(row.campaign_id) : undefined,
    campaign_name: row.campaign_name != null ? String(row.campaign_name) : undefined,
  };
}

/**
 * Raw row from operational APIs:
 * - GET /broadcasts/
 * - GET /campaigns/:id/broadcasts
 */
export function normalizeOperationalBroadcastRow(row: Record<string, unknown>): Broadcast {
  const sent = Number(row.messages_sent ?? 0);
  const failed = Number(row.messages_failed ?? 0);

  return {
    broadcast_id: row.id != null ? String(row.id) : "",
    broadcast_name: String(row.name ?? "—"),
    run_id: "",
    status: normalizeBroadcastStatus(row.status),
    actual_start_time: String(row.start_time ?? row.created_at ?? ""),
    actual_end_time: String(row.end_time ?? ""),
    messages_queued: 0,
    messages_sent: sent,
    messages_delivered: sent,
    messages_failed: failed,
    total_batches: 0,
    processed_count: sent + failed,
    error_count: failed,
    retry_count: 0,
    avg_processing_time_ms: 0,
    delivery_rate: deliveryRate(sent, failed),
    channel_code: row.channel_code != null ? String(row.channel_code) : undefined,
    segment_name: row.segment_name != null ? String(row.segment_name) : undefined,
    broadcast_type: row.broadcast_type != null ? String(row.broadcast_type) : undefined,
    planned_start_time: row.start_time != null ? String(row.start_time) : undefined,
    campaign_id: row.campaign_id != null ? Number(row.campaign_id) : undefined,
    campaign_name: row.campaign_name != null ? String(row.campaign_name) : undefined,
    offer_id: row.offer_id != null ? Number(row.offer_id) : undefined,
    offer_name: row.offer_name != null ? String(row.offer_name) : undefined,
    segment_id: row.segment_id != null ? Number(row.segment_id) : undefined,
    timezone: row.timezone != null ? String(row.timezone) : undefined,
    created_at: row.created_at != null ? String(row.created_at) : undefined,
    updated_at: row.updated_at != null ? String(row.updated_at) : undefined,
  };
}

/** @deprecated Use normalizeOperationalBroadcastRow */
export const normalizePendingBroadcastRow = normalizeOperationalBroadcastRow;

/**
 * Prefer reporting rows (richer metrics) over operational duplicates of the same broadcast.
 */
export function dedupeBroadcastRows(rows: Broadcast[]): Broadcast[] {
  const byId = new Map<string, Broadcast>();

  for (const row of rows) {
    if (!row.broadcast_id) continue;
    const existing = byId.get(row.broadcast_id);
    if (!existing) {
      byId.set(row.broadcast_id, row);
      continue;
    }
    // Prefer the row that has a run_id / richer metrics
    const existingScore = (existing.run_id ? 2 : 0) + (existing.messages_delivered > 0 ? 1 : 0);
    const nextScore = (row.run_id ? 2 : 0) + (row.messages_delivered > 0 ? 1 : 0);
    if (nextScore >= existingScore) {
      byId.set(row.broadcast_id, { ...existing, ...row });
    }
  }

  return Array.from(byId.values());
}

export function normalizeBroadcastDetailsPayload(
  data: Record<string, unknown>,
): BroadcastDetails {
  const broadcastRaw = (data.broadcast ?? {}) as Record<string, unknown>;
  const campaign = (broadcastRaw.campaign ?? {}) as Record<string, unknown>;
  const segment = (broadcastRaw.segment ?? {}) as Record<string, unknown>;
  const offer = (broadcastRaw.offer ?? {}) as Record<string, unknown>;
  const metricsRaw = (data.metrics ?? {}) as Record<string, unknown>;
  const logsRaw = Array.isArray(data.delivery_logs) ? data.delivery_logs : [];

  return {
    broadcast: {
      id: (broadcastRaw.id as string | number) ?? "",
      name: String(broadcastRaw.name ?? "—"),
      campaign: {
        id: (campaign.id as number | string | null) ?? null,
        name: campaign.name != null ? String(campaign.name) : null,
      },
      segment: {
        id: (segment.id as number | string | null) ?? null,
        name: segment.name != null ? String(segment.name) : null,
      },
      offer: {
        id: (offer.id as number | string | null) ?? null,
        name: offer.name != null ? String(offer.name) : null,
      },
      channel_code: broadcastRaw.channel_code != null ? String(broadcastRaw.channel_code) : null,
      status: normalizeBroadcastStatus(broadcastRaw.status),
      start_time: broadcastRaw.start_time != null ? String(broadcastRaw.start_time) : null,
      end_time: broadcastRaw.end_time != null ? String(broadcastRaw.end_time) : null,
      timezone: broadcastRaw.timezone != null ? String(broadcastRaw.timezone) : null,
      broadcast_type:
        broadcastRaw.broadcast_type != null ? String(broadcastRaw.broadcast_type) : null,
      created_at: broadcastRaw.created_at != null ? String(broadcastRaw.created_at) : null,
      updated_at: broadcastRaw.updated_at != null ? String(broadcastRaw.updated_at) : null,
    },
    metrics: {
      total_audience: Number(metricsRaw.total_audience ?? 0),
      messages_sent: Number(metricsRaw.messages_sent ?? 0),
      messages_failed: Number(metricsRaw.messages_failed ?? 0),
    },
    policy_violations: Array.isArray(data.policy_violations) ? data.policy_violations : [],
    delivery_logs: logsRaw.map((log) => {
      const row = log as Record<string, unknown>;
      return {
        id: (row.id as string | number) ?? "",
        recipient: String(row.recipient ?? ""),
        channel: String(row.channel ?? ""),
        title: String(row.title ?? ""),
        body_text: String(row.body_text ?? ""),
        status: String(row.status ?? ""),
        status_code: Number(row.status_code ?? 0),
        provider_response_or_error:
          row.provider_response_or_error != null
            ? String(row.provider_response_or_error)
            : null,
        created_at: String(row.created_at ?? ""),
      };
    }),
  };
}
