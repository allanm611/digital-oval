import { communicationChannelService } from "../../../shared/services/communicationChannelService";
import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { dndService } from "../../campaigns/services/dndService";
import { customerEventService } from "./customerEventService";
import type {
  CustomerPreferenceProgress,
  CustomerPreferenceResult,
} from "../types/customerPreference";
import type { CustomerListIdentifiers } from "../types/customerSubscribedList";
import {
  applyChannelCatalog,
  applyDndTypeName,
  buildChannelSummaries,
  collectSearchProbes,
  consentKey,
  countPreferences,
  createDraftSettings,
  EMPTY_PREFERENCE_COUNTS,
  EMPTY_PREFERENCE_SETTINGS,
  eventToDraft,
  finalizeConsent,
  finalizeSettings,
  findExistingConsentKey,
  matchDndRecord,
  mergeConsent,
  mergeSettings,
  parseConsentRecord,
  parseHintPreferences,
  parseSettings,
  sortConsents,
  unwrapPreferenceList,
  normalizeChannel,
  type DraftConsent,
  type DraftSettings,
} from "../utils/customerPreferenceHelpers";
import { asRecord } from "../utils/customerSegmentHelpers";
import {
  collectCustomerIdentifiers,
  hasAnyIdentifier,
} from "../utils/customerSubscribedListHelpers";

const CACHE_TTL_MS = 60_000;
const DND_PAGE_SIZE = 50;
const MAX_DND_MATCHES = 100;

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerPreferenceResult }
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

function emptyResult(warnings: string[] = []): CustomerPreferenceResult {
  return {
    settings: {
      ...EMPTY_PREFERENCE_SETTINGS,
      contentCategories: [],
      evidence: [],
    },
    channels: [],
    consents: [],
    counts: { ...EMPTY_PREFERENCE_COUNTS },
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

function upsertConsent(byKey: Map<string, DraftConsent>, draft: DraftConsent) {
  const existingKey = findExistingConsentKey(byKey, draft);
  if (existingKey) {
    const merged = mergeConsent(byKey.get(existingKey)!, draft);
    byKey.delete(existingKey);
    byKey.set(consentKey(merged), merged);
    return;
  }
  byKey.set(consentKey(draft), draft);
}

async function trySubscriberScopedPreferences(
  subscriberId: string,
): Promise<{
  available: boolean;
  settings: DraftSettings | null;
  drafts: DraftConsent[];
}> {
  const encoded = encodeURIComponent(subscriberId);
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/preferences`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/consent`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/opt-ins`,
    `${API_CONFIG.BASE_URL}/subscribers/${encoded}/dnd`,
  ];

  const drafts: DraftConsent[] = [];
  let settings: DraftSettings | null = null;
  let available = false;

  for (const url of paths) {
    const payload = await tryJsonGet(url);
    if (payload == null) continue;
    available = true;
    const parsedSettings = parseSettings(payload, { evidence: "subscriber_api" });
    if (parsedSettings) {
      settings = settings
        ? mergeSettings(settings, parsedSettings)
        : parsedSettings;
    }
    unwrapPreferenceList(payload).forEach((item) => {
      const parsed = parseConsentRecord(item, { evidence: "subscriber_api" });
      if (parsed) drafts.push(parsed);
    });
  }

  return { available, settings, drafts };
}

async function matchDndSubscriptions(
  identifiers: CustomerListIdentifiers,
  onProgress?: (checked: number, total: number) => void,
  isAborted?: () => boolean,
): Promise<{ drafts: DraftConsent[]; failed: boolean; unfiltered: boolean }> {
  const probes = collectSearchProbes(identifiers);
  if (probes.length === 0) {
    return { drafts: [], failed: false, unfiltered: false };
  }

  const drafts: DraftConsent[] = [];
  let failed = false;
  let unfiltered = false;
  let checked = 0;
  onProgress?.(0, probes.length);

  for (const probe of probes) {
    abortIfNeeded(isAborted);
    if (drafts.length >= MAX_DND_MATCHES) break;
    try {
      const rows = await dndService.getDNDSubscriptions({
        search: probe,
        limit: DND_PAGE_SIZE,
        offset: 0,
      });
      const matched = rows.filter((row) => {
        if (row.status === "removed") return false;
        return Boolean(matchDndRecord(row as unknown as Record<string, unknown>, identifiers));
      });
      if (rows.length > 20 && matched.length === 0) {
        unfiltered = true;
      } else if (rows.length > matched.length * 4 && rows.length > 15) {
        unfiltered = true;
      }
      matched.forEach((row) => {
        if (drafts.length >= MAX_DND_MATCHES) return;
        const record = row as unknown as Record<string, unknown>;
        const parsed = parseConsentRecord(record, {
          evidence: "dnd",
          matched: matchDndRecord(record, identifiers),
        });
        if (parsed) drafts.push(parsed);
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      failed = true;
    } finally {
      checked += 1;
      onProgress?.(checked, probes.length);
    }
  }

  return { drafts, failed, unfiltered };
}

export type LoadCustomerPreferencesInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerPreferenceProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerPreferenceService = {
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

  async getCustomerPreferences(
    input: LoadCustomerPreferencesInput,
  ): Promise<CustomerPreferenceResult> {
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
        phase: "catalog",
        checked: cached.result.consents.length,
        total: cached.result.consents.length,
      });
      return cached.result;
    }

    input.onProgress?.({ phase: "lookup", checked: 0, total: 1 });
    const scoped = await trySubscriberScopedPreferences(subscriberId);
    input.onProgress?.({ phase: "lookup", checked: 1, total: 1 });

    let settingsDraft =
      scoped.settings || createDraftSettings({ evidence: [] });
    const byKey = new Map<string, DraftConsent>();
    scoped.drafts.forEach((draft) => upsertConsent(byKey, draft));

    input.onProgress?.({ phase: "dnd", checked: 0, total: 1 });
    const dnd = await matchDndSubscriptions(
      identifiers,
      (checked, total) => {
        input.onProgress?.({ phase: "dnd", checked, total });
      },
      input.isAborted,
    );
    dnd.drafts.forEach((draft) => upsertConsent(byKey, draft));

    input.onProgress?.({ phase: "events", checked: 0, total: 1 });
    const eventsResult = await customerEventService.getSubscriberEvents(
      subscriberId,
      { time_preset: "all", limit: 500 },
    );
    const eventsLive = eventsResult.source === "api";
    let eventCount = 0;
    if (eventsLive) {
      eventsResult.allEvents.forEach((event) => {
        const draft = eventToDraft(event);
        if (!draft) return;
        eventCount += 1;
        upsertConsent(byKey, draft);
      });
    }
    input.onProgress?.({ phase: "events", checked: 1, total: 1 });

    const hints = parseHintPreferences(input.customerRecord);
    if (hints.settings) {
      settingsDraft = mergeSettings(settingsDraft, hints.settings);
    }
    hints.consents.forEach((draft) => upsertConsent(byKey, draft));

    input.onProgress?.({ phase: "catalog", checked: 0, total: 2 });
    const channelsByCode = new Map<string, { id: number; name: string }>();
    const typesById = new Map<number, string>();
    let catalogFailed = 0;

    try {
      const channels = await communicationChannelService.getAll();
      channels.forEach((channel) => {
        const entry = { id: channel.id, name: channel.name };
        channelsByCode.set(channel.code.toLowerCase(), entry);
        channelsByCode.set(normalizeChannel(channel.code), entry);
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      catalogFailed += 1;
    }
    input.onProgress?.({ phase: "catalog", checked: 1, total: 2 });

    try {
      const types = await dndService.getDNDTypes(true);
      types.forEach((type) => {
        if (type.id && type.name) typesById.set(type.id, type.name);
      });
    } catch (error) {
      if (isAbortError(error)) throw error;
      catalogFailed += 1;
    }
    input.onProgress?.({ phase: "catalog", checked: 2, total: 2 });

    const drafts = Array.from(byKey.values());
    drafts.forEach((draft) => {
      applyChannelCatalog(draft, channelsByCode);
      applyDndTypeName(draft, typesById);
    });

    const consents = sortConsents(drafts.map((draft) => finalizeConsent(draft)));
    const settings = finalizeSettings(settingsDraft);
    const channels = buildChannelSummaries(consents, settings.preferredChannel);

    if (!hasAnyIdentifier(identifiers)) {
      warnings.push(
        "This customer has no phone number, email, or ID to match against DND lists.",
      );
    }
    if (!eventsLive) {
      warnings.push(
        "Live customer events were not available, so opt-in changes could not be confirmed from the event stream.",
      );
    }
    if (dnd.failed) {
      warnings.push("DND subscriptions could not be searched for this customer.");
    }
    if (dnd.unfiltered) {
      warnings.push(
        "Some DND searches returned unfiltered results; only rows that matched this customer were kept.",
      );
    }
    if (catalogFailed > 0) {
      warnings.push(
        "Communication channel or DND type labels could not be loaded from configuration.",
      );
    }
    if (
      settings.verification === "hint" &&
      (settings.language || settings.preferredChannel)
    ) {
      warnings.push(
        "Language or preferred channel came from the customer profile and were not verified against a preferences API.",
      );
    }
    const hintOnly = consents.filter((item) => item.verification === "hint").length;
    if (hintOnly > 0) {
      warnings.push(
        `${hintOnly} preference${hintOnly === 1 ? "" : "s"} came from the customer profile and ${hintOnly === 1 ? "was" : "were"} not verified against DND or events.`,
      );
    }

    const result: CustomerPreferenceResult = {
      settings,
      channels,
      consents,
      counts: countPreferences(consents, channels),
      eventCount,
      source: catalogFailed > 0 || dnd.failed || !eventsLive ? "partial" : "live",
      subscriberLookupUsed: scoped.available,
      eventsLive,
      warnings: warnings.filter(
        (warning, index, all) => all.indexOf(warning) === index,
      ),
    };

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerPreferenceService;
