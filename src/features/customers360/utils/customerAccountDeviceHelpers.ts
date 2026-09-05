import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerAccountDeviceCounts,
  CustomerAccountDeviceEvidence,
  CustomerAccountDeviceStatus,
  CustomerAccountDeviceVerification,
  CustomerAccountSnapshot,
  CustomerDeviceType,
  CustomerInventoryItem,
  CustomerInventoryKind,
  CustomerVerificationFlag,
} from "../types/customerAccountDevice";
import { asRecord } from "./customerSegmentHelpers";
import { extractAddedAt } from "./customerSubscribedListHelpers";

export const EMPTY_ACCOUNT_DEVICE_COUNTS: CustomerAccountDeviceCounts = {
  total: 0,
  accounts: 0,
  devices: 0,
  active: 0,
};

export const EMPTY_ACCOUNT_SNAPSHOT: CustomerAccountSnapshot = {
  accountId: null,
  status: "unknown",
  createdAt: null,
  lastLoginAt: null,
  msisdn: null,
  iccid: null,
  imsi: null,
  simType: null,
  tariff: null,
  emailVerified: "unknown",
  phoneVerified: "unknown",
  kycVerified: "unknown",
  primaryDeviceName: null,
  primaryOs: null,
  primaryAppVersion: null,
  lastActivityDeviceName: null,
  evidence: [],
  verification: "hint",
};

const DEVICE_EVENT_TYPES = new Set([
  "device_registered",
  "device_login",
  "device_updated",
  "session_started",
]);

const LOGIN_EVENT_TYPES = new Set([
  "app_login",
  "device_login",
  "session_started",
  "user_login",
]);

const ACCOUNT_EVENT_TYPES = new Set([
  "sim_swap",
  "sim_swapped",
  "account_activated",
  "account_suspended",
  "account_closed",
  "account_reactivated",
]);

const EXCLUDED_EVENT_TYPES = new Set([
  "promotional_sms",
  "welcome_email",
  "campaign_executed",
  "newsletter",
  "order_confirmation",
  "offer_redeemed",
  "offer_accepted",
  "bundle_purchase",
  "recharge",
  "points_earned",
  "points_redeemed",
  "opt_in",
  "opt_out",
  "data_usage",
  "customer_sms",
  "received_message",
  "voice_call",
  "support_ticket_created",
  "complaint_logged",
  "customer_care_contact",
]);

export type DraftInventory = {
  kind: CustomerInventoryKind;
  name: string;
  subtype: string;
  identifier: string;
  status: CustomerAccountDeviceStatus;
  isPrimary: boolean;
  lastSeenAt: string | null;
  firstSeenAt: string | null;
  msisdn: string | null;
  iccid: string | null;
  imsi: string | null;
  simType: string | null;
  tariff: string | null;
  deviceType: CustomerDeviceType | null;
  os: string | null;
  osVersion: string | null;
  appVersion: string | null;
  imei: string | null;
  model: string | null;
  eventId: string | null;
  evidence: Set<CustomerAccountDeviceEvidence>;
};

function stringOrNull(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function flattenValues(value: unknown): unknown[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((item) => flattenValues(item));
  if (typeof value === "string") {
    return value
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [value];
}

export function unwrapInventoryList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.accounts,
    record.subscriptions,
    record.devices,
    record.sessions,
    record.items,
    record.results,
    nested?.data,
    nested?.accounts,
    nested?.subscriptions,
    nested?.devices,
    nested?.sessions,
    nested?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeInventoryStatus(
  value: unknown,
): CustomerAccountDeviceStatus {
  if (value === true) return "active";
  if (value === false) return "inactive";
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!raw) return "unknown";
  if (["active", "enabled", "live", "open", "true", "1"].includes(raw)) {
    return "active";
  }
  if (["inactive", "disabled", "dormant"].includes(raw)) return "inactive";
  if (["suspended", "barred", "blocked", "held"].includes(raw)) {
    return "suspended";
  }
  if (["closed", "terminated", "cancelled", "canceled", "deactivated"].includes(raw)) {
    return "closed";
  }
  return "unknown";
}

export function normalizeDeviceType(value: unknown): CustomerDeviceType | null {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw || raw === "unknown") return null;
  if (raw.includes("tablet") || raw.includes("ipad")) return "tablet";
  if (raw.includes("web") || raw.includes("desktop") || raw.includes("browser")) {
    return "web";
  }
  if (raw.includes("tv") || raw.includes("stb") || raw.includes("box")) return "tv";
  if (
    raw.includes("mobile") ||
    raw.includes("phone") ||
    raw.includes("android") ||
    raw.includes("ios") ||
    raw.includes("handset")
  ) {
    return "mobile";
  }
  return "other";
}

export function parseVerificationFlag(value: unknown): CustomerVerificationFlag {
  if (value === true || value === 1) return "verified";
  if (value === false || value === 0) return "unverified";
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (!raw) return "unknown";
  if (["verified", "true", "yes", "1"].includes(raw)) return "verified";
  if (["unverified", "false", "no", "0", "not_verified"].includes(raw)) {
    return "unverified";
  }
  return "unknown";
}

export function humanizeInventoryKind(kind: CustomerInventoryKind | string): string {
  if (kind === "account") return "Account";
  if (kind === "device") return "Device";
  return String(kind || "Other");
}

export function humanizeInventoryStatus(
  status: CustomerAccountDeviceStatus | string,
): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (status === "suspended") return "Suspended";
  if (status === "closed") return "Closed";
  if (status === "unknown") return "—";
  return String(status || "—");
}

export function humanizeDeviceType(type: CustomerDeviceType | string | null): string {
  if (type === "mobile") return "Mobile";
  if (type === "tablet") return "Tablet";
  if (type === "web") return "Web";
  if (type === "tv") return "TV";
  if (type === "other") return "Other";
  return "—";
}

export function humanizeVerificationFlag(flag: CustomerVerificationFlag): string {
  if (flag === "verified") return "Verified";
  if (flag === "unverified") return "Not verified";
  return "—";
}

export function createDraft(
  extras?: Partial<Omit<DraftInventory, "evidence">> & {
    evidence?: CustomerAccountDeviceEvidence[];
  },
): DraftInventory {
  return {
    kind: extras?.kind || "device",
    name: extras?.name || "",
    subtype: extras?.subtype || "",
    identifier: extras?.identifier || "",
    status: extras?.status || "unknown",
    isPrimary: extras?.isPrimary ?? false,
    lastSeenAt: extras?.lastSeenAt ?? null,
    firstSeenAt: extras?.firstSeenAt ?? null,
    msisdn: extras?.msisdn ?? null,
    iccid: extras?.iccid ?? null,
    imsi: extras?.imsi ?? null,
    simType: extras?.simType ?? null,
    tariff: extras?.tariff ?? null,
    deviceType: extras?.deviceType ?? null,
    os: extras?.os ?? null,
    osVersion: extras?.osVersion ?? null,
    appVersion: extras?.appVersion ?? null,
    imei: extras?.imei ?? null,
    model: extras?.model ?? null,
    eventId: extras?.eventId ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

export function draftKey(draft: DraftInventory): string {
  if (draft.kind === "account") {
    if (draft.msisdn) return `account-msisdn-${draft.msisdn}`;
    if (draft.iccid) return `account-iccid-${draft.iccid.toLowerCase()}`;
    if (draft.imsi) return `account-imsi-${draft.imsi}`;
    if (draft.identifier) return `account-${draft.identifier.toLowerCase()}`;
  }
  if (draft.imei) return `device-imei-${draft.imei.toLowerCase()}`;
  if (draft.identifier) return `device-${draft.identifier.toLowerCase()}`;
  const stamp = draft.lastSeenAt || draft.firstSeenAt || "";
  return `device-${(draft.name || "unknown").toLowerCase()}-${stamp}`;
}

export function findExistingKey(
  byKey: Map<string, DraftInventory>,
  draft: DraftInventory,
): string | null {
  const canonical = draftKey(draft);
  if (byKey.has(canonical)) return canonical;
  for (const [key, item] of byKey) {
    if (item.kind !== draft.kind) continue;
    if (draft.msisdn && item.msisdn === draft.msisdn) return key;
    if (draft.iccid && item.iccid === draft.iccid) return key;
    if (draft.imei && item.imei === draft.imei) return key;
    if (draft.identifier && item.identifier === draft.identifier) return key;
  }
  return null;
}

function preferText(current: string | null, incoming: string | null): string | null {
  if (!current) return incoming;
  if (!incoming) return current;
  return incoming.length > current.length ? incoming : current;
}

function preferDate(current: string | null, incoming: string | null): string | null {
  if (!current) return incoming;
  if (!incoming) return current;
  return Date.parse(incoming) >= Date.parse(current) ? incoming : current;
}

function earlierDate(current: string | null, incoming: string | null): string | null {
  if (!current) return incoming;
  if (!incoming) return current;
  return Date.parse(incoming) <= Date.parse(current) ? incoming : current;
}

export function mergeDraft(
  target: DraftInventory,
  source: DraftInventory,
): DraftInventory {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.name = target.name || source.name;
  target.subtype = target.subtype || source.subtype;
  target.identifier = target.identifier || source.identifier;
  if (target.status === "unknown" && source.status !== "unknown") {
    target.status = source.status;
  } else if (source.status === "suspended" || source.status === "closed") {
    target.status = source.status;
  }
  target.isPrimary = target.isPrimary || source.isPrimary;
  target.lastSeenAt = preferDate(target.lastSeenAt, source.lastSeenAt);
  target.firstSeenAt = earlierDate(target.firstSeenAt, source.firstSeenAt);
  target.msisdn = target.msisdn || source.msisdn;
  target.iccid = target.iccid || source.iccid;
  target.imsi = target.imsi || source.imsi;
  target.simType = preferText(target.simType, source.simType);
  target.tariff = preferText(target.tariff, source.tariff);
  target.deviceType = target.deviceType || source.deviceType;
  target.os = preferText(target.os, source.os);
  target.osVersion = preferText(target.osVersion, source.osVersion);
  target.appVersion = preferText(target.appVersion, source.appVersion);
  target.imei = target.imei || source.imei;
  target.model = preferText(target.model, source.model);
  target.eventId = target.eventId || source.eventId;
  return target;
}

function looksLikeAccount(row: Record<string, unknown>): boolean {
  return Boolean(
    row.msisdn ||
      row.iccid ||
      row.imsi ||
      row.sim_type ||
      row.simType ||
      row.tariff ||
      row.subscription_id ||
      row.account_id,
  );
}

function looksLikeDevice(row: Record<string, unknown>): boolean {
  const type = String(row.device_type ?? row.type ?? row.kind ?? "").toLowerCase();
  if (type === "unknown") return false;
  if (
    row.imei ||
    row.device_id ||
    row.deviceId ||
    row.device_name ||
    row.os ||
    row.app_version ||
    row.os_version
  ) {
    return true;
  }
  return /device|handset|mobile|tablet|session/.test(type);
}

export function parseAccountRecord(
  item: unknown,
  extras?: { evidence?: CustomerAccountDeviceEvidence; isPrimary?: boolean },
): DraftInventory | null {
  const row = asRecord(item);
  if (!row || !looksLikeAccount(row)) return null;
  const msisdn = stringOrNull(row.msisdn ?? row.phone ?? row.mobile) || null;
  const iccid = stringOrNull(row.iccid);
  const imsi = stringOrNull(row.imsi);
  const identifier =
    msisdn ||
    iccid ||
    imsi ||
    stringOrNull(row.account_id ?? row.subscription_id ?? row.id) ||
    "";
  if (!identifier) return null;
  const status = normalizeInventoryStatus(
    row.status ?? row.subscriber_status ?? row.account_status ?? row.is_active,
  );
  const occurredAt =
    stringOrNull(
      row.last_seen_at ??
        row.activation_date ??
        row.activated_at ??
        row.created_at,
    ) ?? extractAddedAt(row);

  return createDraft({
    kind: "account",
    name: msisdn || identifier,
    subtype: extras?.isPrimary ? "primary" : stringOrNull(row.kind ?? row.line_type) || "subscription",
    identifier,
    status,
    isPrimary: extras?.isPrimary ?? Boolean(row.is_primary ?? row.primary),
    lastSeenAt: occurredAt,
    firstSeenAt: stringOrNull(row.activation_date ?? row.created_at) ?? occurredAt,
    msisdn,
    iccid,
    imsi,
    simType: stringOrNull(row.sim_type ?? row.simType),
    tariff: stringOrNull(row.tariff ?? row.plan),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseDeviceRecord(
  item: unknown,
  extras?: { evidence?: CustomerAccountDeviceEvidence },
): DraftInventory | null {
  const row = asRecord(item);
  if (!row || !looksLikeDevice(row)) return null;
  const nested = asRecord(row.device) || {};
  const sources = [row, nested];
  const pick = (keys: string[]) =>
    sources.reduce<string | null>(
      (found, source) => found || stringOrNull(keys.reduce((v, key) => v ?? source[key], undefined as unknown)),
      null,
    );
  const imei = pick(["imei", "imei_number"]);
  const deviceId = pick(["device_id", "deviceId", "id"]);
  const model = pick(["model", "device_model"]);
  const name =
    pick(["device_name", "deviceName", "name"]) ||
    model ||
    imei ||
    deviceId ||
    "Device";
  const identifier = imei || deviceId || name;
  const lastSeen =
    pick(["last_seen_at", "last_activity_at", "last_login", "updated_at"]) ??
    extractAddedAt(row);
  const firstSeen = pick(["first_seen_at", "registered_at", "created_at"]);
  const deviceType = normalizeDeviceType(
    pick(["device_type", "deviceType", "type"]),
  );

  return createDraft({
    kind: "device",
    name,
    subtype: deviceType || "device",
    identifier,
    status: normalizeInventoryStatus(
      row.status ?? row.is_active ?? (row.is_active === false ? "inactive" : ""),
    ),
    isPrimary: Boolean(row.is_primary ?? row.primary),
    lastSeenAt: lastSeen,
    firstSeenAt: firstSeen,
    deviceType,
    os: pick(["os", "operating_system", "platform"]),
    osVersion: pick(["os_version", "osVersion", "system_version"]),
    appVersion: pick(["app_version", "appVersion", "client_version"]),
    imei,
    model,
    eventId: pick(["event_id", "eventId"]),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseHintAccounts(
  record: Record<string, unknown> | null | undefined,
): DraftInventory[] {
  if (!record) return [];
  const drafts: DraftInventory[] = [];
  const nestedAccounts = unwrapInventoryList(
    record.accounts ?? record.subscriptions ?? record.lines,
  );
  nestedAccounts.forEach((item) => {
    const parsed = parseAccountRecord(item, { evidence: "profile" });
    if (parsed) drafts.push(parsed);
  });

  const primary = parseAccountRecord(record, {
    evidence: "profile",
    isPrimary: true,
  });
  if (primary) {
    primary.subtype = "primary";
    drafts.push(primary);
  }

  flattenValues(record.alternate_msisdns ?? record.alternatemsisdns).forEach(
    (value) => {
      const msisdn = stringOrNull(value);
      if (!msisdn) return;
      drafts.push(
        createDraft({
          kind: "account",
          name: msisdn,
          subtype: "alternate",
          identifier: msisdn,
          status: "unknown",
          msisdn,
          evidence: ["profile"],
        }),
      );
    },
  );

  return drafts;
}

export function parseHintDevices(
  record: Record<string, unknown> | null | undefined,
): DraftInventory[] {
  if (!record) return [];
  const drafts: DraftInventory[] = [];
  unwrapInventoryList(
    record.devices ?? record.registered_devices ?? record.handsets,
  ).forEach((item) => {
    const parsed = parseDeviceRecord(item, { evidence: "profile" });
    if (parsed) drafts.push(parsed);
  });

  const deviceType = normalizeDeviceType(record.device_type);
  if (deviceType && !drafts.some((item) => item.kind === "device")) {
    drafts.push(
      createDraft({
        kind: "device",
        name: humanizeDeviceType(deviceType),
        subtype: deviceType,
        identifier: `profile-${deviceType}`,
        deviceType,
        evidence: ["profile"],
      }),
    );
  }

  return drafts;
}

export function parseHintSnapshot(
  record: Record<string, unknown> | null | undefined,
): Partial<CustomerAccountSnapshot> {
  if (!record) return {};
  const accountId =
    stringOrNull(
      record.account_id ??
        record.customer_id ??
        record.customerId ??
        record.subscription_id ??
        record.id,
    );
  const createdAt =
    stringOrNull(record.created_at ?? record.activation_date ?? record.activationDate);
  const lastLoginAt = stringOrNull(
    record.last_login ?? record.last_login_at ?? record.lastLogin,
  );
  return {
    accountId,
    status: normalizeInventoryStatus(
      record.subscriber_status ?? record.status ?? record.is_active,
    ),
    createdAt,
    lastLoginAt,
    msisdn: stringOrNull(record.msisdn),
    iccid: stringOrNull(record.iccid),
    imsi: stringOrNull(record.imsi),
    simType: stringOrNull(record.sim_type ?? record.simType),
    tariff: stringOrNull(record.tariff),
    emailVerified: parseVerificationFlag(
      record.email_verified ?? record.emailVerified,
    ),
    phoneVerified: parseVerificationFlag(
      record.phone_verified ?? record.phoneVerified ?? record.msisdn_verified,
    ),
    kycVerified: parseVerificationFlag(
      record.kyc_verified ?? record.kycVerified,
    ),
    evidence: ["profile"],
    verification:
      accountId || createdAt || stringOrNull(record.msisdn)
        ? "verified"
        : "hint",
  };
}

export function isLoginEvent(event: CustomerEvent): boolean {
  return LOGIN_EVENT_TYPES.has(event.event_type.toLowerCase());
}

export function isDeviceEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  if (EXCLUDED_EVENT_TYPES.has(type)) return false;
  if (DEVICE_EVENT_TYPES.has(type)) return true;
  if (/device_registered|device_login|handset/.test(type)) return true;
  const device = event.device;
  if (!device) return false;
  if (device.device_id || device.imei || device.os || device.app_version) {
    return true;
  }
  if (type === "app_login") {
    return Boolean(device.device_id || device.imei || device.device_name);
  }
  return false;
}

export function isAccountEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  if (ACCOUNT_EVENT_TYPES.has(type)) return true;
  return /sim_swap|account_activated|account_suspended|account_closed/.test(type);
}

export function eventToDeviceDraft(event: CustomerEvent): DraftInventory | null {
  if (!isDeviceEvent(event)) return null;
  const device = event.device;
  const name =
    device?.device_name ||
    device?.imei ||
    event.event_type_label ||
    "Device";
  const deviceType = normalizeDeviceType(device?.device_type);
  const identifier = device?.imei || device?.device_id || event.id;
  return createDraft({
    kind: "device",
    name,
    subtype: deviceType || "device",
    identifier,
    status: "active",
    lastSeenAt: event.occurred_at,
    firstSeenAt: event.occurred_at,
    deviceType,
    os: device?.os ?? null,
    osVersion: device?.os_version ?? null,
    appVersion: device?.app_version ?? null,
    imei: device?.imei ?? null,
    model: device?.device_name || null,
    eventId: event.id,
    evidence: ["event"],
  });
}

export function eventToAccountStatus(
  event: CustomerEvent,
): CustomerAccountDeviceStatus | null {
  if (!isAccountEvent(event)) return null;
  if (/suspend/.test(event.event_type)) return "suspended";
  if (/closed|terminat/.test(event.event_type)) return "closed";
  if (/activat/.test(event.event_type)) return "active";
  const status = normalizeInventoryStatus(event.status);
  return status === "unknown" ? null : status;
}

export function finalizeInventory(draft: DraftInventory): CustomerInventoryItem {
  const verification: CustomerAccountDeviceVerification =
    draft.evidence.has("subscriber_api") || draft.evidence.has("event")
      ? "verified"
      : draft.evidence.has("profile") && draft.kind === "account"
        ? "verified"
        : draft.evidence.has("profile")
          ? "hint"
          : "hint";
  return {
    id: draftKey(draft),
    kind: draft.kind,
    name: draft.name || draft.identifier || (draft.kind === "account" ? "Account" : "Device"),
    subtype: draft.subtype,
    identifier: draft.identifier || draftKey(draft),
    status: draft.status,
    isPrimary: draft.isPrimary,
    lastSeenAt: draft.lastSeenAt,
    firstSeenAt: draft.firstSeenAt,
    msisdn: draft.msisdn,
    iccid: draft.iccid,
    imsi: draft.imsi,
    simType: draft.simType,
    tariff: draft.tariff,
    deviceType: draft.deviceType,
    os: draft.os,
    osVersion: draft.osVersion,
    appVersion: draft.appVersion,
    imei: draft.imei,
    model: draft.model,
    eventId: draft.eventId,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function sortInventory(items: CustomerInventoryItem[]): CustomerInventoryItem[] {
  return [...items].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "account" ? -1 : 1;
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    const aTime = Date.parse(a.lastSeenAt || a.firstSeenAt || "") || 0;
    const bTime = Date.parse(b.lastSeenAt || b.firstSeenAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function countInventory(
  items: CustomerInventoryItem[],
): CustomerAccountDeviceCounts {
  return items.reduce(
    (counts, item) => {
      counts.total += 1;
      if (item.kind === "account") counts.accounts += 1;
      if (item.kind === "device") counts.devices += 1;
      if (item.status === "active") counts.active += 1;
      return counts;
    },
    { ...EMPTY_ACCOUNT_DEVICE_COUNTS },
  );
}

export function uniqueInventoryKinds(
  items: CustomerInventoryItem[],
): CustomerInventoryKind[] {
  return Array.from(new Set(items.map((item) => item.kind)));
}

export function uniqueInventoryStatuses(
  items: CustomerInventoryItem[],
): CustomerAccountDeviceStatus[] {
  const present = new Set(items.map((item) => item.status));
  return (
    ["active", "inactive", "suspended", "closed", "unknown"] as CustomerAccountDeviceStatus[]
  ).filter((status) => present.has(status) && status !== "unknown");
}

export function filterInventory(
  items: CustomerInventoryItem[],
  query: { search?: string; kind?: string; status?: string },
): CustomerInventoryItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const kind = query.kind && query.kind !== "all" ? query.kind : "";
  const status = query.status && query.status !== "all" ? query.status : "";
  return items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (status && item.status !== status) return false;
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.identifier.toLowerCase().includes(search) ||
      (item.msisdn || "").toLowerCase().includes(search) ||
      (item.iccid || "").toLowerCase().includes(search) ||
      (item.imei || "").toLowerCase().includes(search) ||
      (item.os || "").toLowerCase().includes(search) ||
      (item.model || "").toLowerCase().includes(search)
    );
  });
}

export function buildSnapshot(
  hint: Partial<CustomerAccountSnapshot>,
  items: CustomerInventoryItem[],
  lastLoginFromEvents: string | null,
): CustomerAccountSnapshot {
  const accounts = items.filter((item) => item.kind === "account");
  const devices = items.filter((item) => item.kind === "device");
  const primaryAccount =
    accounts.find((item) => item.isPrimary) || accounts[0] || null;
  const primaryDevice =
    devices.find((item) => item.isPrimary) ||
    [...devices].sort(
      (a, b) =>
        (Date.parse(b.lastSeenAt || "") || 0) -
        (Date.parse(a.lastSeenAt || "") || 0),
    )[0] ||
    null;
  const lastDevice = primaryDevice;
  const evidence = new Set<CustomerAccountDeviceEvidence>(hint.evidence || []);
  items.forEach((item) => item.evidence.forEach((value) => evidence.add(value)));
  const lastLoginAt =
    preferDate(hint.lastLoginAt || null, lastLoginFromEvents) || null;
  const verification: CustomerAccountDeviceVerification =
    evidence.has("subscriber_api") || evidence.has("event") || evidence.has("profile")
      ? "verified"
      : "hint";

  return {
    accountId: hint.accountId || primaryAccount?.identifier || null,
    status:
      hint.status && hint.status !== "unknown"
        ? hint.status
        : primaryAccount?.status || "unknown",
    createdAt: hint.createdAt || primaryAccount?.firstSeenAt || null,
    lastLoginAt,
    msisdn: hint.msisdn || primaryAccount?.msisdn || null,
    iccid: hint.iccid || primaryAccount?.iccid || null,
    imsi: hint.imsi || primaryAccount?.imsi || null,
    simType: hint.simType || primaryAccount?.simType || null,
    tariff: hint.tariff || primaryAccount?.tariff || null,
    emailVerified: hint.emailVerified || "unknown",
    phoneVerified: hint.phoneVerified || "unknown",
    kycVerified: hint.kycVerified || "unknown",
    primaryDeviceName: primaryDevice?.name || null,
    primaryOs: [primaryDevice?.os, primaryDevice?.osVersion]
      .filter(Boolean)
      .join(" ") || null,
    primaryAppVersion: primaryDevice?.appVersion || null,
    lastActivityDeviceName: lastDevice?.name || null,
    evidence: Array.from(evidence),
    verification,
  };
}
