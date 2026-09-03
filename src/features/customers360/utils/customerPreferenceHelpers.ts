import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerChannelPreference,
  CustomerPreferenceChannel,
  CustomerPreferenceConsentStatus,
  CustomerPreferenceCounts,
  CustomerPreferenceEvidence,
  CustomerPreferenceItem,
  CustomerPreferenceKind,
  CustomerPreferenceSettings,
  CustomerPreferenceVerification,
} from "../types/customerPreference";
import type {
  CustomerIdentifierKind,
  CustomerListIdentifiers,
} from "../types/customerSubscribedList";
import { asRecord } from "./customerSegmentHelpers";
import {
  extractAddedAt,
  identifiersMatch,
} from "./customerSubscribedListHelpers";

export const EMPTY_PREFERENCE_COUNTS: CustomerPreferenceCounts = {
  total: 0,
  optedIn: 0,
  optedOut: 0,
  channels: 0,
};

export const EMPTY_PREFERENCE_SETTINGS: CustomerPreferenceSettings = {
  language: null,
  languageLabel: null,
  preferredChannel: null,
  preferredChannelLabel: null,
  frequency: null,
  personalization: null,
  dataSharing: null,
  contentCategories: [],
  evidence: [],
  verification: "hint",
};

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  sw: "Swahili",
  fr: "French",
  es: "Spanish",
};

const PREFERRED_CHANNEL_LABELS: Record<string, string> = {
  normal_sms: "Normal SMS",
  flash_sms: "Flash SMS",
  email: "Email",
  whatsapp: "WhatsApp",
  push: "Push",
  ussd: "USSD",
  interactive_ussd: "Interactive USSD",
  inapp: "In-App",
  ivr: "IVR",
  obd: "OBD",
  short_code: "Short Code",
  sms: "SMS",
  app: "App",
  voice: "Voice",
};

const PREFERENCE_EVENT_TYPES = new Set([
  "opt_out",
  "opt_in",
  "dnd_added",
  "dnd_removed",
  "preference_updated",
  "consent_granted",
  "consent_withdrawn",
  "unsubscribe",
  "resubscribe",
]);

const EXCLUDED_EVENT_TYPES = new Set([
  "order_confirmation",
  "promotional_sms",
  "welcome_email",
  "campaign_executed",
  "message_sent",
  "newsletter",
  "received_message",
  "offer_redeemed",
  "offer_accepted",
  "bundle_purchase",
  "recharge",
]);

export type DraftConsent = {
  kind: CustomerPreferenceKind;
  name: string;
  channel: CustomerPreferenceChannel | null;
  category: string | null;
  status: CustomerPreferenceConsentStatus;
  updatedAt: string | null;
  expiresAt: string | null;
  dndSubscriptionId: number | null;
  communicationChannelId: number | null;
  matchedIdentifier: string | null;
  matchedIdentifierType: CustomerIdentifierKind | null;
  eventId: string | null;
  evidence: Set<CustomerPreferenceEvidence>;
};

export type DraftSettings = {
  language: string | null;
  preferredChannel: string | null;
  frequency: string | null;
  personalization: boolean | null;
  dataSharing: boolean | null;
  contentCategories: string[];
  evidence: Set<CustomerPreferenceEvidence>;
};

export function numericId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.trunc(value);
  }
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  }
  return null;
}

export function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

export function booleanOrNull(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const raw = value.trim().toLowerCase();
    if (["true", "yes", "1", "enabled", "opted_in"].includes(raw)) return true;
    if (["false", "no", "0", "disabled", "opted_out"].includes(raw)) return false;
  }
  return null;
}

export function unwrapPreferenceList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.preferences,
    record.consents,
    record.channels,
    record.dnd,
    record.opt_ins,
    record.opt_outs,
    record.notifications,
    record.items,
    nested?.data,
    nested?.preferences,
    nested?.consents,
    nested?.channels,
    nested?.dnd,
    nested?.opt_ins,
    nested?.notifications,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeChannel(value: unknown): CustomerPreferenceChannel {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (raw === "email" || raw === "e_mail") return "email";
  if (
    raw === "sms" ||
    raw === "text" ||
    raw === "normal_sms" ||
    raw === "flash_sms" ||
    raw === "short_code"
  ) {
    return "sms";
  }
  if (raw === "push" || raw === "push_notification") return "push";
  if (raw === "whatsapp" || raw === "wa") return "whatsapp";
  if (raw === "ussd" || raw === "interactive_ussd") return "ussd";
  if (raw === "app" || raw === "inapp" || raw === "in_app") return "app";
  if (raw === "voice" || raw === "ivr" || raw === "obd") return "voice";
  return "other";
}

export function normalizeConsentStatus(
  value: unknown,
  extras?: { optedIn?: boolean | null; dndActive?: boolean },
): CustomerPreferenceConsentStatus {
  if (extras?.dndActive) return "opted_out";
  if (extras?.optedIn === false) return "opted_out";
  if (extras?.optedIn === true) return "opted_in";
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["opted_out", "unsubscribed", "suppressed", "dnd", "blocked"].includes(raw)) {
    return "opted_out";
  }
  if (["opted_in", "subscribed", "enabled", "active", "granted"].includes(raw)) {
    return "opted_in";
  }
  if (raw === "preferred") return "preferred";
  if (["disabled", "inactive", "removed"].includes(raw)) return "opted_out";
  return "unknown";
}

export function humanizePreferenceChannel(
  channel: CustomerPreferenceChannel | string | null | undefined,
): string {
  if (!channel) return "—";
  const raw = String(channel).toLowerCase();
  if (raw === "sms") return "SMS";
  if (raw === "ussd") return "USSD";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function humanizeConsentStatus(
  status: CustomerPreferenceConsentStatus | string,
): string {
  if (status === "opted_in") return "Opted in";
  if (status === "opted_out") return "Opted out";
  if (status === "preferred") return "Preferred";
  return "Unknown";
}

export function humanizePreferenceKind(kind: CustomerPreferenceKind | string): string {
  if (kind === "dnd") return "DND";
  if (kind === "channel") return "Channel";
  if (kind === "notification") return "Notification";
  if (kind === "privacy") return "Privacy";
  if (kind === "content") return "Content";
  return "Preference";
}

export function languageLabel(code: string | null | undefined): string | null {
  if (!code) return null;
  const key = code.trim().toLowerCase();
  return LANGUAGE_LABELS[key] || code;
}

export function preferredChannelLabel(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const key = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return PREFERRED_CHANNEL_LABELS[key] || humanizePreferenceChannel(normalizeChannel(value));
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        const row = asRecord(item);
        return stringOrNull(row?.name ?? row?.label ?? row?.category ?? row?.title) || "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function createDraftConsent(
  extras?: Partial<Omit<DraftConsent, "evidence">> & {
    evidence?: CustomerPreferenceEvidence[];
  },
): DraftConsent {
  return {
    kind: extras?.kind || "channel",
    name: extras?.name || "",
    channel: extras?.channel ?? null,
    category: extras?.category ?? null,
    status: extras?.status || "unknown",
    updatedAt: extras?.updatedAt ?? null,
    expiresAt: extras?.expiresAt ?? null,
    dndSubscriptionId: extras?.dndSubscriptionId ?? null,
    communicationChannelId: extras?.communicationChannelId ?? null,
    matchedIdentifier: extras?.matchedIdentifier ?? null,
    matchedIdentifierType: extras?.matchedIdentifierType ?? null,
    eventId: extras?.eventId ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

export function createDraftSettings(
  extras?: Partial<Omit<DraftSettings, "evidence" | "contentCategories">> & {
    evidence?: CustomerPreferenceEvidence[];
    contentCategories?: string[];
  },
): DraftSettings {
  return {
    language: extras?.language ?? null,
    preferredChannel: extras?.preferredChannel ?? null,
    frequency: extras?.frequency ?? null,
    personalization: extras?.personalization ?? null,
    dataSharing: extras?.dataSharing ?? null,
    contentCategories: extras?.contentCategories ? [...extras.contentCategories] : [],
    evidence: new Set(extras?.evidence || []),
  };
}

export function consentKey(draft: DraftConsent): string {
  if (draft.dndSubscriptionId) return `dnd-${draft.dndSubscriptionId}`;
  if (draft.eventId) return `event-${draft.eventId}`;
  return `pref-${draft.kind}-${draft.channel || "any"}-${(draft.category || draft.name).toLowerCase()}`;
}

export function findExistingConsentKey(
  byKey: Map<string, DraftConsent>,
  draft: DraftConsent,
): string | null {
  const canonical = consentKey(draft);
  if (byKey.has(canonical)) return canonical;
  for (const [key, item] of byKey) {
    if (draft.dndSubscriptionId && item.dndSubscriptionId === draft.dndSubscriptionId) {
      return key;
    }
    if (draft.eventId && item.eventId === draft.eventId) return key;
  }
  return null;
}

export function mergeConsent(target: DraftConsent, source: DraftConsent): DraftConsent {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.name = target.name || source.name;
  target.channel = target.channel || source.channel;
  target.category = target.category || source.category;
  if (source.status === "opted_out" || target.status === "unknown") {
    target.status = source.status === "opted_out" ? "opted_out" : target.status;
    if (target.status === "unknown") target.status = source.status;
  }
  if (source.status === "opted_out") target.status = "opted_out";
  target.updatedAt = target.updatedAt || source.updatedAt;
  target.expiresAt = target.expiresAt || source.expiresAt;
  target.dndSubscriptionId = target.dndSubscriptionId ?? source.dndSubscriptionId;
  target.communicationChannelId =
    target.communicationChannelId ?? source.communicationChannelId;
  target.matchedIdentifier = target.matchedIdentifier || source.matchedIdentifier;
  target.matchedIdentifierType =
    target.matchedIdentifierType || source.matchedIdentifierType;
  target.eventId = target.eventId || source.eventId;
  if (source.kind === "dnd") target.kind = "dnd";
  return target;
}

export function mergeSettings(
  target: DraftSettings,
  source: DraftSettings,
): DraftSettings {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.language = target.language || source.language;
  target.preferredChannel = target.preferredChannel || source.preferredChannel;
  target.frequency = target.frequency || source.frequency;
  target.personalization = target.personalization ?? source.personalization;
  target.dataSharing = target.dataSharing ?? source.dataSharing;
  if (source.contentCategories.length > target.contentCategories.length) {
    target.contentCategories = [...source.contentCategories];
  }
  return target;
}

export function matchDndRecord(
  row: Record<string, unknown>,
  identifiers: CustomerListIdentifiers,
): { identifier: string; type: CustomerIdentifierKind } | null {
  const candidates: unknown[] = [
    row.customer_phone,
    row.customerPhone,
    row.phone,
    row.msisdn,
    row.customer_email,
    row.customerEmail,
    row.email,
    row.customer_id,
    row.customerId,
    row.subscriber_id,
  ];
  for (const value of candidates) {
    const kind = identifiersMatch(value, identifiers);
    if (!kind) continue;
    return { identifier: String(value ?? "").trim(), type: kind };
  }
  return null;
}

export function parseConsentRecord(
  item: unknown,
  extras?: {
    evidence?: CustomerPreferenceEvidence;
    matched?: { identifier: string; type: CustomerIdentifierKind } | null;
  },
): DraftConsent | null {
  if (typeof item === "string" && item.trim()) {
    const channel = normalizeChannel(item);
    return createDraftConsent({
      kind: "channel",
      name: humanizePreferenceChannel(channel),
      channel,
      status: "opted_in",
      evidence: extras?.evidence ? [extras.evidence] : [],
    });
  }

  const row = asRecord(item);
  if (!row) return null;

  const channelValue =
    row.channel ?? row.channel_code ?? row.preferred_channel ?? row.name;
  const hasChannel = Boolean(stringOrNull(channelValue));
  const optedIn = booleanOrNull(
    row.opted_in ?? row.optedIn ?? row.enabled ?? row.is_enabled,
  );
  const dndActive =
    String(row.status || "").toLowerCase() === "active" ||
    Boolean(row.dnd) ||
    Boolean(row.is_dnd);
  const dndId = numericId(row.dnd_subscription_id ?? row.dnd_id ?? row.id);
  const isDnd =
    Boolean(row.dnd_type_id || row.dnd_type_name || row.customer_phone) ||
    extras?.evidence === "dnd";

  if (!hasChannel && !isDnd && optedIn == null && !row.category && !row.topic) {
    return null;
  }

  const channel = hasChannel ? normalizeChannel(channelValue) : null;
  const category = stringOrNull(
    row.dnd_type_name ??
      row.category ??
      row.topic ??
      row.message_type ??
      row.type ??
      row.dnd_type_id,
  );
  const status = normalizeConsentStatus(row.status ?? row.consent, {
    optedIn,
    dndActive: isDnd && String(row.status || "active").toLowerCase() !== "removed",
  });
  const name =
    stringOrNull(row.name ?? row.title ?? row.dnd_type_name) ||
    [channel ? humanizePreferenceChannel(channel) : null, category]
      .filter(Boolean)
      .join(" · ") ||
    "Preference";

  return createDraftConsent({
    kind: isDnd ? "dnd" : category ? "notification" : "channel",
    name,
    channel,
    category,
    status: isDnd && status === "unknown" ? "opted_out" : status,
    updatedAt:
      stringOrNull(row.updated_at ?? row.added_at ?? row.opted_at) ??
      extractAddedAt(row),
    expiresAt: stringOrNull(row.expires_at ?? row.expiresAt),
    dndSubscriptionId: isDnd ? dndId : null,
    communicationChannelId: numericId(
      row.communication_channel_id ?? row.channel_id,
    ),
    matchedIdentifier: extras?.matched?.identifier ?? null,
    matchedIdentifierType: extras?.matched?.type ?? null,
    eventId: stringOrNull(row.event_id ?? row.eventId),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseSettings(
  payload: unknown,
  extras?: { evidence?: CustomerPreferenceEvidence },
): DraftSettings | null {
  const record = asRecord(payload);
  if (!record) return null;
  const nested = asRecord(record.data);
  const source = nested || record;

  const language = stringOrNull(
    source.language ??
      source.language_preference ??
      source.preferred_language ??
      source.locale,
  );
  const preferredChannel = stringOrNull(
    source.preferred_channel ?? source.preferredChannel ?? source.channel,
  );
  const frequency = stringOrNull(
    source.frequency ?? source.contact_frequency ?? source.email_frequency,
  );
  const personalization = booleanOrNull(
    source.personalization ?? source.allow_personalization,
  );
  const dataSharing = booleanOrNull(
    source.data_sharing ?? source.allow_data_sharing ?? source.privacy_share,
  );
  const contentCategories = parseStringList(
    source.content_preferences ??
      source.content_categories ??
      source.interests ??
      source.topics,
  );

  if (
    !language &&
    !preferredChannel &&
    !frequency &&
    personalization == null &&
    dataSharing == null &&
    contentCategories.length === 0
  ) {
    return null;
  }

  return createDraftSettings({
    language,
    preferredChannel,
    frequency,
    personalization,
    dataSharing,
    contentCategories,
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseHintPreferences(
  record: Record<string, unknown> | null | undefined,
): { settings: DraftSettings | null; consents: DraftConsent[] } {
  if (!record) return { settings: null, consents: [] };

  const settings = parseSettings(
    {
      language_preference: record.language_preference ?? record.preferred_language,
      preferred_channel: record.preferred_channel ?? record.preferredChannel,
      frequency: record.contact_frequency,
      personalization: record.personalization,
      data_sharing: record.data_sharing,
      content_preferences: record.content_preferences ?? record.interests,
    },
    { evidence: "profile_hint" },
  );

  const lists = [
    record.communication_channels,
    record.notifications,
    record.preferences,
    record.consents,
    record.dnd,
  ];
  const consents = lists.flatMap((list) =>
    unwrapPreferenceList(list)
      .map((item) => parseConsentRecord(item, { evidence: "profile_hint" }))
      .filter((item): item is DraftConsent => Boolean(item)),
  );

  return { settings, consents };
}

export function isPreferenceEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  if (EXCLUDED_EVENT_TYPES.has(type)) return false;
  if (PREFERENCE_EVENT_TYPES.has(type)) return true;
  return /opt_out|opt_in|unsubscribe|consent|dnd_|preference_/.test(type);
}

export function eventToDraft(event: CustomerEvent): DraftConsent | null {
  if (!isPreferenceEvent(event)) return null;
  const type = event.event_type.toLowerCase();
  const optedOut = /opt_out|unsub|withdraw|dnd_added/.test(type);
  const channel = normalizeChannel(event.channel);
  return createDraftConsent({
    kind: /dnd/.test(type) ? "dnd" : "channel",
    name: event.event_type_label || event.description || "Preference change",
    channel,
    status: optedOut ? "opted_out" : "opted_in",
    updatedAt: event.occurred_at,
    eventId: event.id,
    evidence: ["event"],
  });
}

export function applyChannelCatalog(
  draft: DraftConsent,
  channelsByCode: Map<string, { id: number; name: string }>,
): DraftConsent {
  if (!draft.channel) return draft;
  const match =
    channelsByCode.get(draft.channel) ||
    channelsByCode.get(draft.channel.toUpperCase());
  if (match) {
    draft.communicationChannelId = draft.communicationChannelId ?? match.id;
    if (!draft.name || draft.name === humanizePreferenceChannel(draft.channel)) {
      draft.name = match.name;
    }
  }
  return draft;
}

export function applyDndTypeName(
  draft: DraftConsent,
  typesById: Map<number, string>,
): DraftConsent {
  if (draft.category && /^\d+$/.test(draft.category)) {
    const name = typesById.get(Number(draft.category));
    if (name) draft.category = name;
  }
  return draft;
}

export function buildChannelSummaries(
  consents: CustomerPreferenceItem[],
  preferredChannel: string | null,
): CustomerChannelPreference[] {
  const byChannel = new Map<CustomerPreferenceChannel, CustomerChannelPreference>();

  consents.forEach((item) => {
    if (!item.channel) return;
    const existing = byChannel.get(item.channel);
    const categories = item.category ? [item.category] : [];
    if (!existing) {
      byChannel.set(item.channel, {
        id: `channel-${item.channel}`,
        channel: item.channel,
        channelLabel: item.channelLabel || humanizePreferenceChannel(item.channel),
        status: item.status,
        categories,
        evidence: [...item.evidence],
        verification: item.verification,
      });
      return;
    }
    if (item.status === "opted_out") existing.status = "opted_out";
    else if (existing.status === "unknown" || existing.status === "preferred") {
      existing.status = item.status;
    }
    categories.forEach((category) => {
      if (!existing.categories.includes(category)) existing.categories.push(category);
    });
    item.evidence.forEach((entry) => {
      if (!existing.evidence.includes(entry)) existing.evidence.push(entry);
    });
    if (item.verification === "verified") existing.verification = "verified";
  });

  if (preferredChannel) {
    const channel = normalizeChannel(preferredChannel);
    const existing = byChannel.get(channel);
    if (!existing) {
      byChannel.set(channel, {
        id: `channel-${channel}`,
        channel,
        channelLabel: preferredChannelLabel(preferredChannel) || humanizePreferenceChannel(channel),
        status: "preferred",
        categories: [],
        evidence: ["profile_hint"],
        verification: "hint",
      });
    } else if (existing.status === "unknown") {
      existing.status = "preferred";
    }
  }

  const order: CustomerPreferenceChannel[] = [
    "sms",
    "email",
    "push",
    "whatsapp",
    "ussd",
    "app",
    "voice",
    "other",
  ];
  return Array.from(byChannel.values()).sort(
    (a, b) => order.indexOf(a.channel) - order.indexOf(b.channel),
  );
}

export function finalizeSettings(draft: DraftSettings): CustomerPreferenceSettings {
  const verification: CustomerPreferenceVerification =
    draft.evidence.has("subscriber_api") ? "verified" : "hint";
  return {
    language: draft.language,
    languageLabel: languageLabel(draft.language),
    preferredChannel: draft.preferredChannel,
    preferredChannelLabel: preferredChannelLabel(draft.preferredChannel),
    frequency: draft.frequency,
    personalization: draft.personalization,
    dataSharing: draft.dataSharing,
    contentCategories: draft.contentCategories,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function finalizeConsent(draft: DraftConsent): CustomerPreferenceItem {
  const verification: CustomerPreferenceVerification =
    draft.evidence.has("subscriber_api") ||
    draft.evidence.has("dnd") ||
    draft.evidence.has("event")
      ? "verified"
      : "hint";
  return {
    id: consentKey(draft),
    kind: draft.kind,
    name: draft.name || "Preference",
    channel: draft.channel,
    channelLabel: draft.channel
      ? humanizePreferenceChannel(draft.channel)
      : null,
    category: draft.category,
    status: draft.status,
    updatedAt: draft.updatedAt,
    expiresAt: draft.expiresAt,
    dndSubscriptionId: draft.dndSubscriptionId,
    communicationChannelId: draft.communicationChannelId,
    matchedIdentifier: draft.matchedIdentifier,
    matchedIdentifierType: draft.matchedIdentifierType,
    eventId: draft.eventId,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function sortConsents(
  items: CustomerPreferenceItem[],
): CustomerPreferenceItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.updatedAt || "") || 0;
    const bTime = Date.parse(b.updatedAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function countPreferences(
  consents: CustomerPreferenceItem[],
  channels: CustomerChannelPreference[],
): CustomerPreferenceCounts {
  return {
    total: consents.length,
    optedIn: consents.filter((item) => item.status === "opted_in").length,
    optedOut: consents.filter((item) => item.status === "opted_out").length,
    channels: channels.length,
  };
}

export function uniqueConsentStatuses(
  items: CustomerPreferenceItem[],
): CustomerPreferenceConsentStatus[] {
  const present = new Set(items.map((item) => item.status));
  return (
    ["opted_out", "opted_in", "preferred", "unknown"] as CustomerPreferenceConsentStatus[]
  ).filter((status) => present.has(status));
}

export function uniqueConsentChannels(
  items: CustomerPreferenceItem[],
): CustomerPreferenceChannel[] {
  return Array.from(
    new Set(
      items
        .map((item) => item.channel)
        .filter((item): item is CustomerPreferenceChannel => Boolean(item)),
    ),
  );
}

export function filterConsents(
  items: CustomerPreferenceItem[],
  query: { search?: string; channel?: string; status?: string },
): CustomerPreferenceItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const channel = query.channel && query.channel !== "all" ? query.channel : "";
  const status = query.status && query.status !== "all" ? query.status : "";
  return items.filter((item) => {
    if (channel && item.channel !== channel) return false;
    if (status && item.status !== status) return false;
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      (item.category || "").toLowerCase().includes(search) ||
      (item.channelLabel || "").toLowerCase().includes(search)
    );
  });
}

export function collectSearchProbes(identifiers: CustomerListIdentifiers): string[] {
  const probes: string[] = [];
  const push = (value: string) => {
    if (value && !probes.includes(value)) probes.push(value);
  };
  identifiers.msisdns.slice(0, 2).forEach(push);
  identifiers.emails.slice(0, 2).forEach(push);
  identifiers.ids.slice(0, 2).forEach(push);
  return probes.slice(0, 4);
}
