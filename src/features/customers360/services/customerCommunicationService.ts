import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { broadcastService } from "../../campaigns/services/broadcastService";
import { communicationService } from "../../communications/services/communicationService";
import { customerEventService } from "./customerEventService";
import { customerSegmentService } from "./customerSegmentService";
import type {
  CustomerCommunicationEvidence,
  CustomerCommunicationProgress,
  CustomerCommunicationResult,
} from "../types/customerCommunication";
import type { CustomerListIdentifiers } from "../types/customerSubscribedList";
import {
  countCommunications,
  draftKey,
  EMPTY_COMMUNICATION_COUNTS,
  eventToDraft,
  finalizeCommunication,
  findExistingKey,
  mergeDraft,
  normalizeChannel,
  normalizeStatus,
  parseCommunicationRecord,
  parseHintCommunications,
  sortCommunications,
  unwrapCommunicationList,
  type DraftCommunication,
} from "../utils/customerCommunicationHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";
import {
  collectCustomerIdentifiers,
  hasAnyIdentifier,
  identifiersMatch,
  mapWithConcurrency,
} from "../utils/customerSubscribedListHelpers";

const CACHE_TTL_MS = 60_000;
const LOG_PAGE_SIZE = 100;
const MAX_LOG_PAGES = 3;
const MAX_CAMPAIGNS = 50;
const MAX_BROADCASTS = 80;
const BROADCAST_CONCURRENCY = 3;
const IDENTIFIER_PROBE_LIMIT = 3;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerCommunicationResult }
>();

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function abortIfNeeded(isAborted?: () => boolean) {
  if (isAborted?.()) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function cacheKey(
  subscriberId: string,
  identifiers: CustomerListIdentifiers,
): string {
  return [
    subscriberId,
    identifiers.msisdns.join(","),
    identifiers.emails.join(","),
    identifiers.ids.join(","),
  ].join("|");
}

function emptyResult(warnings: string[] = []): CustomerCommunicationResult {
  return {
    communications: [],
    counts: { ...EMPTY_COMMUNICATION_COUNTS },
    campaignCount: 0,
    broadcastCount: 0,
    eventCount: 0,
    source: "live",
    subscriberLookupUsed: false,
    eventsLive: false,
    warnings,
  };
}

async function tryJsonGet(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) return null;
    const payload = await response.json();
    const record = asRecord(payload);
    if (record?.success === false) return null;
    return payload;
  } catch {
    return null;
  }
}

function upsertDraft(
  byKey: Map<string, DraftCommunication>,
  draft: DraftCommunication,
) {
  const existingKey = findExistingKey(byKey, draft);
  if (existingKey) {
    const merged = mergeDraft(byKey.get(existingKey)!, draft);
    byKey.delete(existingKey);
    byKey.set(draftKey(merged), merged);
    return;
  }
  byKey.set(draftKey(draft), draft);
}

function draftsFromPayload(
  payload: unknown,
  evidence: CustomerCommunicationEvidence,
  identifiers?: CustomerListIdentifiers,
): DraftCommunication[] {
  return unwrapCommunicationList(payload)
    .map((item) => {
      const row = asRecord(item);
      const recipient =
        row &&
        (row.recipient ??
          row.recipient_identifier ??
          row.msisdn ??
          row.email ??
          row.phone);
      const matched = identifiers
        ? identifiersMatch(recipient, identifiers)
        : null;
      if (identifiers && recipient && !matched) return null;
      return parseCommunicationRecord(item, {
        evidence,
        matchedIdentifierType: matched,
      });
    })
    .filter((item): item is DraftCommunication => Boolean(item));
}

async function trySubscriberScopedCommunications(
  subscriberId: string,
  identifiers: CustomerListIdentifiers,
): Promise<{ available: boolean; drafts: DraftCommunication[] }> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/communications`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/messages`,
    `${API_CONFIG.BASE_URL}/communications/logs?subscriberId=${encoded}`,
    `${API_CONFIG.BASE_URL}/communications/logs?customerId=${encoded}`,
  ];

  const drafts: DraftCommunication[] = [];
  let available = false;

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    draftsFromPayload(payload, "subscriber_api", identifiers).forEach((draft) => {
      drafts.push(draft);
    });
  }

  return { available, drafts };
}

async function loadIdentifierLogs(
  identifiers: CustomerListIdentifiers,
  isAborted?: () => boolean,
): Promise<DraftCommunication[]> {
  const probes = [
    ...identifiers.msisdns.slice(0, 2),
    ...identifiers.emails.slice(0, 1),
  ].slice(0, IDENTIFIER_PROBE_LIMIT);

  const drafts: DraftCommunication[] = [];

  for (const probe of probes) {
    abortIfNeeded(isAborted);
    const params = new URLSearchParams({
      recipient: probe,
      limit: String(LOG_PAGE_SIZE),
    });
    const payload = await tryJsonGet(
      `${API_CONFIG.BASE_URL}/communications/logs?${params.toString()}`,
    );
    if (payload == null) continue;
    drafts.push(...draftsFromPayload(payload, "delivery_log", identifiers));
  }

  return drafts;
}

async function loadRecentLogs(
  identifiers: CustomerListIdentifiers,
  isAborted?: () => boolean,
): Promise<{ drafts: DraftCommunication[]; failed: boolean }> {
  const drafts: DraftCommunication[] = [];
  let failed = false;

  for (let page = 1; page <= MAX_LOG_PAGES; page += 1) {
    abortIfNeeded(isAborted);
    try {
      const response = await communicationService.getLogs({
        page,
        limit: LOG_PAGE_SIZE,
      });
      const logs = response?.data?.logs ?? [];
      logs.forEach((log) => {
        const match = identifiersMatch(
          log.recipient_identifier ?? (log as { recipient?: string }).recipient,
          identifiers,
        );
        if (!match) return;
        const parsed = parseCommunicationRecord(log, {
          evidence: "delivery_log",
          matchedIdentifierType: match,
        });
        if (parsed) drafts.push(parsed);
      });
      if (logs.length < LOG_PAGE_SIZE) break;
      const total = response?.data?.pagination?.total;
      if (typeof total === "number" && page * LOG_PAGE_SIZE >= total) break;
    } catch (error) {
      if (isAbortError(error)) throw error;
      failed = true;
      break;
    }
  }

  return { drafts, failed };
}

async function loadBroadcastDeliveryLogs(
  campaignIds: number[],
  identifiers: CustomerListIdentifiers,
  onProgress?: (checked: number, total: number) => void,
  isAborted?: () => boolean,
): Promise<{ drafts: DraftCommunication[]; broadcastCount: number; failed: number }> {
  const ids = campaignIds.slice(0, MAX_CAMPAIGNS);
  const broadcastIds: string[] = [];
  const meta = new Map<
    string,
    {
      campaignId: number;
      campaignName: string | null;
      offerId: number | null;
      offerName: string | null;
      broadcastName: string | null;
      channel: string | null;
    }
  >();

  for (const campaignId of ids) {
    abortIfNeeded(isAborted);
    try {
      const response =
        await broadcastService.getCampaignOperationalBroadcasts(campaignId);
      (response.data ?? []).forEach((row) => {
        const id = String(row.broadcast_id || "");
        if (!id || broadcastIds.includes(id)) return;
        broadcastIds.push(id);
        meta.set(id, {
          campaignId: row.campaign_id ?? campaignId,
          campaignName: row.campaign_name ?? null,
          offerId: row.offer_id ?? null,
          offerName: row.offer_name ?? null,
          broadcastName: row.broadcast_name ?? null,
          channel: row.channel_code ?? null,
        });
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
    }
  }

  const limited = broadcastIds.slice(0, MAX_BROADCASTS);
  let failed = 0;
  let checked = 0;
  onProgress?.(0, limited.length);

  const rows = await mapWithConcurrency(
    limited,
    BROADCAST_CONCURRENCY,
    async (broadcastId) => {
      abortIfNeeded(isAborted);
      try {
        const details = await broadcastService.getBroadcastDetails(broadcastId);
        return { broadcastId, details, failed: false as const };
      } catch (error) {
        if (isAbortError(error)) throw error;
        failed += 1;
        return { broadcastId, details: null, failed: true as const };
      } finally {
        checked += 1;
        onProgress?.(checked, limited.length);
      }
    },
    isAborted,
  );

  const drafts: DraftCommunication[] = [];
  for (const row of rows) {
    if (!row.details) continue;
    const info = meta.get(row.broadcastId);
    const logs = row.details.delivery_logs ?? [];
    logs.forEach((log) => {
      const match = identifiersMatch(log.recipient, identifiers);
      if (!match) return;
      drafts.push({
        subject:
          log.title ||
          info?.broadcastName ||
          row.details!.broadcast.name ||
          "Campaign message",
        body: log.body_text || "",
        channel: normalizeChannel(log.channel || info?.channel),
        status: normalizeStatus(log.status),
        sentAt: log.created_at || row.details!.broadcast.start_time,
        deliveredAt:
          normalizeStatus(log.status) === "delivered" ? log.created_at : null,
        recipient: log.recipient || null,
        matchedIdentifierType: match,
        origin: "campaign",
        campaignId:
          numericFromUnknown(row.details.broadcast.campaign.id) ??
          info?.campaignId ??
          null,
        campaignName:
          row.details.broadcast.campaign.name || info?.campaignName || null,
        offerId:
          numericFromUnknown(row.details.broadcast.offer.id) ??
          info?.offerId ??
          null,
        offerName: row.details.broadcast.offer.name || info?.offerName || null,
        broadcastId: String(row.details.broadcast.id || row.broadcastId),
        broadcastName:
          row.details.broadcast.name || info?.broadcastName || null,
        executionId: null,
        creativeId: null,
        creativeName: null,
        eventId: null,
        evidence: new Set(["delivery_log"]),
      });
    });
  }

  return { drafts, broadcastCount: limited.length, failed };
}

function numericFromUnknown(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
}

export type LoadCustomerCommunicationsInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerCommunicationProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerCommunicationService = {
  invalidateCache(subscriberId?: string | number) {
    if (subscriberId == null || subscriberId === "") {
      RESULT_CACHE.clear();
      return;
    }
    const prefix = `${String(subscriberId)}|`;
    Array.from(RESULT_CACHE.keys()).forEach((key) => {
      if (key === String(subscriberId) || key.startsWith(prefix)) {
        RESULT_CACHE.delete(key);
      }
    });
  },

  async getCustomerCommunications(
    input: LoadCustomerCommunicationsInput,
  ): Promise<CustomerCommunicationResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const warnings: string[] = [];
    const identifiers = collectCustomerIdentifiers(
      input.customerRecord,
      subscriberId,
    );

    if (!subscriberId) {
      return emptyResult(["No customer selected."]);
    }

    const key = cacheKey(subscriberId, identifiers);
    const cached = input.skipCache ? undefined : RESULT_CACHE.get(key);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "events",
        checked: cached.result.communications.length,
        total: cached.result.communications.length,
      });
      return cached.result;
    }

    input.onProgress?.({ phase: "lookup", checked: 0, total: 1 });
    const scoped = await trySubscriberScopedCommunications(
      subscriberId,
      identifiers,
    );
    input.onProgress?.({ phase: "lookup", checked: 1, total: 1 });

    const byKey = new Map<string, DraftCommunication>();
    scoped.drafts.forEach((draft) => upsertDraft(byKey, draft));

    input.onProgress?.({ phase: "logs", checked: 0, total: 1 });
    let logScanFailed = false;
    if (hasAnyIdentifier(identifiers)) {
      const probed = await loadIdentifierLogs(identifiers, input.isAborted);
      probed.forEach((draft) => upsertDraft(byKey, draft));
      const recent = await loadRecentLogs(identifiers, input.isAborted);
      recent.drafts.forEach((draft) => upsertDraft(byKey, draft));
      logScanFailed = recent.failed;
    }
    input.onProgress?.({ phase: "logs", checked: 1, total: 1 });

    const audience = await customerSegmentService.getCustomerSegments({
      subscriberId,
      customerRecord: input.customerRecord,
      skipCache: input.skipCache,
      isAborted: input.isAborted,
      onProgress: (progress) => {
        input.onProgress?.({
          phase: "broadcasts",
          checked: progress.checked,
          total: progress.total,
        });
      },
    });

    abortIfNeeded(input.isAborted);

    const campaignIds = audience.audienceCampaigns.map(
      (item) => item.campaignId,
    );
    let broadcastCount = 0;
    let broadcastFailed = 0;

    if (hasAnyIdentifier(identifiers) && campaignIds.length > 0) {
      const broadcastResult = await loadBroadcastDeliveryLogs(
        campaignIds,
        identifiers,
        (checked, total) => {
          input.onProgress?.({ phase: "broadcasts", checked, total });
        },
        input.isAborted,
      );
      broadcastResult.drafts.forEach((draft) => upsertDraft(byKey, draft));
      broadcastCount = broadcastResult.broadcastCount;
      broadcastFailed = broadcastResult.failed;
    }

    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      { time_preset: "all", limit: 500 },
    );
    const eventsLive = eventsResult.source === "api";
    const liveEvents = eventsLive ? eventsResult.allEvents : [];
    let eventCount = 0;
    if (eventsLive) {
      liveEvents.forEach((event) => {
        const draft = eventToDraft(event);
        if (!draft) return;
        eventCount += 1;
        upsertDraft(byKey, draft);
      });
    }
    input.onProgress?.({ phase: "events", checked: 1, total: 1 });

    parseHintCommunications(input.customerRecord).forEach((draft) => {
      upsertDraft(byKey, draft);
    });

    const communications = sortCommunications(
      Array.from(byKey.values()).map((draft) => finalizeCommunication(draft)),
    );

    if (!hasAnyIdentifier(identifiers)) {
      warnings.push(
        "This customer has no phone number, email, or ID to match against delivery logs.",
      );
    }
    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so message activity could not be confirmed from the event stream.",
      );
    }
    if (logScanFailed) {
      warnings.push(
        "Some communication logs could not be searched for this customer.",
      );
    }
    if (broadcastFailed > 0) {
      warnings.push(
        `Delivery logs could not be loaded for ${broadcastFailed} broadcast${broadcastFailed === 1 ? "" : "s"}.`,
      );
    }
    if (campaignIds.length >= MAX_CAMPAIGNS) {
      warnings.push(
        `Stopped after checking ${MAX_CAMPAIGNS.toLocaleString()} audience campaigns for broadcasts.`,
      );
    }
    const hintOnly = communications.filter((item) => item.verification === "hint")
      .length;
    if (hintOnly > 0) {
      warnings.push(
        `${hintOnly} communication${hintOnly === 1 ? "" : "s"} came from the customer profile and ${hintOnly === 1 ? "was" : "were"} not verified against delivery logs or events.`,
      );
    }

    const uniqueWarnings = warnings.filter(
      (warning, index, all) => all.indexOf(warning) === index,
    );

    const result: CustomerCommunicationResult = {
      communications,
      counts: countCommunications(communications),
      campaignCount: campaignIds.length,
      broadcastCount,
      eventCount,
      source:
        logScanFailed || broadcastFailed > 0 || audience.source === "partial" || !eventsLive
          ? "partial"
          : "live",
      subscriberLookupUsed: scoped.available,
      eventsLive,
      warnings: uniqueWarnings,
    };

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerCommunicationService;
