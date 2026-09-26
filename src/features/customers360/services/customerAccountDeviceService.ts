import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { customerEventService } from "./customerEventService";
import type {
  CustomerAccountDeviceProgress,
  CustomerAccountDeviceResult,
} from "../types/customerAccountDevice";
import {
  buildSnapshot,
  countInventory,
  draftKey,
  EMPTY_ACCOUNT_DEVICE_COUNTS,
  EMPTY_ACCOUNT_SNAPSHOT,
  eventToAccountStatus,
  eventToDeviceDraft,
  finalizeInventory,
  findExistingKey,
  isLoginEvent,
  mergeDraft,
  parseAccountRecord,
  parseDeviceRecord,
  parseHintAccounts,
  parseHintDevices,
  parseHintSnapshot,
  sortInventory,
  unwrapInventoryList,
  type DraftInventory,
} from "../utils/customerAccountDeviceHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";

const CACHE_TTL_MS = 60_000;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerAccountDeviceResult }
>();

function abortIfNeeded(isAborted?: () => boolean) {
  if (isAborted?.()) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function emptyResult(warnings: string[] = []): CustomerAccountDeviceResult {
  return {
    snapshot: { ...EMPTY_ACCOUNT_SNAPSHOT, evidence: [] },
    items: [],
    counts: { ...EMPTY_ACCOUNT_DEVICE_COUNTS },
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
  byKey: Map<string, DraftInventory>,
  draft: DraftInventory,
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

async function trySubscriberScopedInventory(
  subscriberId: string,
): Promise<{ available: boolean; drafts: DraftInventory[] }> {
  const encoded = encodeURIComponent(subscriberId);
  const accountPaths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/accounts`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/subscriptions`,
  ];
  const devicePaths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/devices`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/sessions`,
  ];

  const drafts: DraftInventory[] = [];
  let available = false;

  for (const url of accountPaths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    unwrapInventoryList(payload).forEach((item) => {
      const parsed = parseAccountRecord(item, { evidence: "subscriber_api" });
      if (parsed) drafts.push(parsed);
    });
  }

  for (const url of devicePaths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    unwrapInventoryList(payload).forEach((item) => {
      const parsed = parseDeviceRecord(item, { evidence: "subscriber_api" });
      if (parsed) drafts.push(parsed);
    });
  }

  return { available, drafts };
}

export type LoadCustomerAccountDevicesInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerAccountDeviceProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerAccountDeviceService = {
  invalidateCache(subscriberId?: string | number) {
    if (subscriberId == null || subscriberId === "") {
      RESULT_CACHE.clear();
      return;
    }
    RESULT_CACHE.delete(String(subscriberId));
  },

  async getCustomerAccountDevices(
    input: LoadCustomerAccountDevicesInput,
  ): Promise<CustomerAccountDeviceResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const warnings: string[] = [];

    if (!subscriberId) {
      return emptyResult(["No customer selected."]);
    }

    const cached = input.skipCache ? undefined : RESULT_CACHE.get(subscriberId);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        phase: "events",
        checked: cached.result.items.length,
        total: cached.result.items.length,
      });
      return cached.result;
    }

    abortIfNeeded(input.isAborted);
    input.onProgress?.({ phase: "lookup", checked: 0, total: 1 });
    const scoped = await trySubscriberScopedInventory(subscriberId);
    input.onProgress?.({ phase: "lookup", checked: 1, total: 1 });

    const byKey = new Map<string, DraftInventory>();
    scoped.drafts.forEach((draft) => upsertDraft(byKey, draft));

    abortIfNeeded(input.isAborted);
    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      {},
      { throwOnError: false, customerRecord: input.customerRecord },
    );
    const eventsLive = eventsResult.source === "api";
    let eventCount = 0;
    let lastLoginFromEvents: string | null = null;
    let latestAccountStatus: { at: string; status: ReturnType<typeof eventToAccountStatus> } | null =
      null;

    if (eventsLive) {
      eventsResult.allEvents.forEach((event) => {
        if (isLoginEvent(event)) {
          eventCount += 1;
          if (
            !lastLoginFromEvents ||
            Date.parse(event.occurred_at) > Date.parse(lastLoginFromEvents)
          ) {
            lastLoginFromEvents = event.occurred_at;
          }
        }
        const deviceDraft = eventToDeviceDraft(event);
        if (deviceDraft) {
          eventCount += 1;
          upsertDraft(byKey, deviceDraft);
        }
        const accountStatus = eventToAccountStatus(event);
        if (accountStatus) {
          eventCount += 1;
          if (
            !latestAccountStatus ||
            Date.parse(event.occurred_at) > Date.parse(latestAccountStatus.at)
          ) {
            latestAccountStatus = { at: event.occurred_at, status: accountStatus };
          }
        }
      });
    }
    input.onProgress?.({ phase: "events", checked: 1, total: 1 });

    parseHintAccounts(input.customerRecord).forEach((draft) => {
      upsertDraft(byKey, draft);
    });
    parseHintDevices(input.customerRecord).forEach((draft) => {
      upsertDraft(byKey, draft);
    });

    if (latestAccountStatus?.status) {
      const primary =
        Array.from(byKey.values()).find(
          (item) => item.kind === "account" && item.isPrimary,
        ) || Array.from(byKey.values()).find((item) => item.kind === "account");
      if (primary) {
        primary.status = latestAccountStatus.status;
        primary.evidence.add("event");
      }
    }

    const items = sortInventory(
      Array.from(byKey.values()).map((draft) => finalizeInventory(draft)),
    );
    const snapshot = buildSnapshot(
      parseHintSnapshot(input.customerRecord),
      items,
      lastLoginFromEvents,
    );

    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so last login and device activity could not be confirmed from the event stream.",
      );
    }
    const hintOnlyDevices = items.filter(
      (item) => item.kind === "device" && item.verification === "hint",
    ).length;
    if (hintOnlyDevices > 0) {
      warnings.push(
        `${hintOnlyDevices} device${hintOnlyDevices === 1 ? "" : "s"} came from the customer profile and ${hintOnlyDevices === 1 ? "was" : "were"} not verified against a devices API or events.`,
      );
    }

    const result: CustomerAccountDeviceResult = {
      snapshot,
      items,
      counts: countInventory(items),
      eventCount,
      source: !eventsLive ? "partial" : "live",
      subscriberLookupUsed: scoped.available,
      eventsLive,
      warnings: warnings.filter(
        (warning, index, all) => all.indexOf(warning) === index,
      ),
    };

    RESULT_CACHE.set(subscriberId, {
      expires: Date.now() + CACHE_TTL_MS,
      result,
    });
    return result;
  },
};

export default customerAccountDeviceService;
