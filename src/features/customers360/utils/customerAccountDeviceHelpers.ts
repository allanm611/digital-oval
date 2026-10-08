import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerAccountDeviceCounts,
  CustomerAccountDeviceEvidence,
  CustomerAccountDeviceStatus,
  CustomerAccountDeviceVerification,
  CustomerAccountSnapshot,
  CustomerDeviceMovement,
  CustomerDeviceMovementKind,
  CustomerDeviceTrailSource,
  CustomerDeviceType,
  CustomerDumpFeed,
  CustomerDumpField,
  CustomerImeiCheck,
  CustomerInventoryItem,
  CustomerInventoryKind,
  CustomerRadioTechnology,
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
  primaryDeviceType: null,
  primaryImei: null,
  primaryTac: null,
  primaryManufacturer: null,
  primaryModel: null,
  primaryTechnology: null,
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
  manufacturer: string | null;
  model: string | null;
  technology: CustomerRadioTechnology | null;
  lastLocation: string | null;
  eventId: string | null;
  evidence: Set<CustomerAccountDeviceEvidence>;
}

export const EMPTY_DUMP_FEED: CustomerDumpFeed = {
  available: false,
  receivedAt: null,
  dumpId: null,
  recordCount: null,
  truncated: false,
  omittedFieldCount: 0,
  fields: [],
};;

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
    raw.includes("feature") ||
    raw.includes("basic phone") ||
    raw.includes("basic_phone")
  ) {
    return "feature_phone";
  }
  if (raw.includes("smart")) return "smartphone";
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
  if (type === "smartphone") return "Smartphone";
  if (type === "feature_phone") return "Feature phone";
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
    manufacturer: extras?.manufacturer ?? null,
    model: extras?.model ?? null,
    technology: extras?.technology ?? null,
    lastLocation: extras?.lastLocation ?? null,
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
  if (draft.imei) return `device-imei-${imeiIdentity(draft.imei)}`;
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
    if (draft.imei && sameImei(item.imei, draft.imei)) return key;
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
  target.manufacturer = target.manufacturer || source.manufacturer;
  target.model = preferText(target.model, source.model);
  target.technology = target.technology || source.technology;
  target.lastLocation = source.lastLocation || target.lastLocation;
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
    row.manufacturer ||
    row.device_model ||
    row.model ||
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
  const imei = normalizeImei(pick(["imei", "imei_number"]));
  const deviceId = pick(["device_id", "deviceId", "id"]);
  const model = pick(["model", "device_model", "handset_model"]);
  const manufacturer = pick([
    "manufacturer",
    "device_manufacturer",
    "vendor",
    "brand",
    "make",
  ]);
  const technology = normalizeRadioTechnology(
    pick([
      "technology",
      "radio_technology",
      "radioTechnology",
      "rat",
      "network_type",
      "networkType",
      "generation",
    ]),
  );
  const lastLocation = formatDeviceLocation({
    siteName: pick(["site_name", "siteName", "site", "cell_name"]),
    region: pick(["region", "zone", "city"]),
    cellId: pick(["cell_id", "cellId", "cell", "cgi", "eci"]),
    locationArea: pick([
      "lac",
      "location_area",
      "locationArea",
      "tracking_area",
      "tracking_area_code",
    ]),
  });
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
    manufacturer,
    model,
    technology,
    lastLocation,
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

  const deviceType = normalizeDeviceType(record.device_type ?? record.deviceType);
  const imei = normalizeImei(stringOrNull(record.imei ?? record.imei_number));
  const manufacturer = stringOrNull(
    record.manufacturer ?? record.device_manufacturer ?? record.brand ?? record.vendor,
  );
  const model = stringOrNull(
    record.device_model ?? record.model ?? record.handset_model,
  );
  const technology = normalizeRadioTechnology(
    record.technology ?? record.radio_technology ?? record.rat ?? record.network_type,
  );
  if (
    (deviceType || imei || manufacturer || model || technology) &&
    !drafts.some((item) => item.kind === "device")
  ) {
    drafts.push(
      createDraft({
        kind: "device",
        name: model || (deviceType ? humanizeDeviceType(deviceType) : imei || "Device"),
        subtype: deviceType || "device",
        identifier: imei || `profile-${deviceType || "device"}`,
        deviceType,
        imei,
        manufacturer,
        model,
        technology,
        isPrimary: true,
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
    primaryImei: normalizeImei(
      stringOrNull(record.imei ?? record.imei_number),
    ),
    primaryDeviceType: normalizeDeviceType(record.device_type ?? record.deviceType),
    primaryManufacturer: stringOrNull(
      record.manufacturer ??
        record.device_manufacturer ??
        record.brand ??
        record.vendor,
    ),
    primaryModel: stringOrNull(
      record.device_model ?? record.model ?? record.handset_model,
    ),
    primaryTechnology: normalizeRadioTechnology(
      record.technology ??
        record.radio_technology ??
        record.rat ??
        record.network_type ??
        record.networkType,
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
  if (
    device.device_id ||
    device.imei ||
    device.os ||
    device.app_version ||
    device.manufacturer ||
    device.model
  ) {
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
    imei: normalizeImei(device?.imei ?? null),
    manufacturer: device?.manufacturer ?? null,
    model: device?.model || device?.device_name || null,
    technology: normalizeRadioTechnology(device?.technology),
    lastLocation: formatDeviceLocation({
      siteName: device?.site_name,
      region: device?.region,
      cellId: device?.cell_id,
      locationArea: device?.location_area,
    }),
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
    tac: imeiTac(draft.imei),
    imeiCheck: imeiCheckStatus(draft.imei),
    manufacturer: draft.manufacturer,
    model: draft.model,
    technology: draft.technology,
    lastLocation: draft.lastLocation,
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
      (item.tac || "").toLowerCase().includes(search) ||
      (item.os || "").toLowerCase().includes(search) ||
      (item.model || "").toLowerCase().includes(search) ||
      (item.manufacturer || "").toLowerCase().includes(search) ||
      humanizeRadioTechnology(item.technology).toLowerCase().includes(search)
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
    primaryDeviceType: primaryDevice?.deviceType || hint.primaryDeviceType || null,
    primaryImei: primaryDevice?.imei || hint.primaryImei || null,
    primaryTac: primaryDevice?.tac || imeiTac(hint.primaryImei || null),
    primaryManufacturer:
      primaryDevice?.manufacturer || hint.primaryManufacturer || null,
    primaryModel: primaryDevice?.model || hint.primaryModel || null,
    primaryTechnology:
      primaryDevice?.technology || hint.primaryTechnology || null,
    primaryOs: [primaryDevice?.os, primaryDevice?.osVersion]
      .filter(Boolean)
      .join(" ") || null,
    primaryAppVersion: primaryDevice?.appVersion || null,
    lastActivityDeviceName: lastDevice?.name || null,
    evidence: Array.from(evidence),
    verification,
  };
}

export function normalizeImei(value: unknown): string | null {
  const raw = stringOrNull(value);
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 14 && digits.length <= 16) return digits;
  return raw;
}

export function imeiTac(imei: string | null): string | null {
  if (!imei) return null;
  const digits = imei.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return digits.slice(0, 8);
}

function imeiIdentity(imei: string | null): string {
  if (!imei) return "";
  const digits = imei.replace(/\D/g, "");
  if (digits.length >= 14 && digits.length <= 16) return digits.slice(0, 14);
  return imei.trim().toLowerCase();
}

function sameImei(left: string | null, right: string | null): boolean {
  if (!left || !right) return false;
  return imeiIdentity(left) === imeiIdentity(right);
}

function imeiLuhnValid(imei: string): boolean {
  let sum = 0;
  for (let index = 0; index < imei.length; index += 1) {
    let digit = Number(imei[imei.length - 1 - index]);
    if (Number.isNaN(digit)) return false;
    if (index % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function imeiCheckStatus(imei: string | null): CustomerImeiCheck {
  if (!imei) return "unchecked";
  const digits = imei.replace(/\D/g, "");
  if (digits.length !== 15) return "unchecked";
  return imeiLuhnValid(digits) ? "valid" : "invalid";
}

export function humanizeImeiCheck(check: CustomerImeiCheck): string {
  if (check === "valid") return "Check digit matches";
  if (check === "invalid") return "Check digit does not match";
  return "Shown as captured";
}

export function normalizeRadioTechnology(
  value: unknown,
): CustomerRadioTechnology | null {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (!raw || raw === "unknown" || raw === "null") return null;
  if (raw.includes("5g") || raw === "nr") return "5g";
  if (raw.includes("4g") || raw.includes("lte")) return "4g";
  if (
    raw.includes("3g") ||
    raw.includes("umts") ||
    raw.includes("wcdma") ||
    raw.includes("hspa") ||
    raw.includes("hsdpa") ||
    raw.includes("hsupa")
  ) {
    return "3g";
  }
  if (
    raw.includes("2g") ||
    raw === "gsm" ||
    raw.includes("gprs") ||
    raw.includes("edge")
  ) {
    return "2g";
  }
  return null;
}

export function humanizeRadioTechnology(
  technology: CustomerRadioTechnology | string | null | undefined,
): string {
  if (technology === "2g") return "2G";
  if (technology === "3g") return "3G";
  if (technology === "4g") return "4G";
  if (technology === "5g") return "5G";
  return "—";
}

export function humanizeMovementKind(
  kind: CustomerDeviceMovementKind | string,
): string {
  if (kind === "device_change") return "Device change";
  if (kind === "sim_move") return "SIM move";
  if (kind === "sim_swap") return "SIM swap";
  return String(kind || "Change");
}

export function humanizeMovementSource(
  source: CustomerDeviceMovement["source"],
): string {
  if (source === "adt") return "ADT dump";
  if (source === "event") return "Device event";
  return "Reconstructed from events";
}

export function formatDeviceLocation(parts: {
  siteName?: string | null;
  region?: string | null;
  cellId?: string | null;
  locationArea?: string | null;
}): string | null {
  const chunks: string[] = [];
  if (parts.siteName) chunks.push(parts.siteName);
  if (parts.region && parts.region !== parts.siteName) chunks.push(parts.region);
  if (parts.cellId) chunks.push(`Cell ${parts.cellId}`);
  if (parts.locationArea) chunks.push(`Location area ${parts.locationArea}`);
  return chunks.length > 0 ? chunks.join(" · ") : null;
}

export interface DeviceSighting {
  at: string;
  imei: string | null;
  label: string | null;
  msisdn: string | null;
  iccid: string | null;
  imsi: string | null;
  previousIccid: string | null;
  previousImsi: string | null;
  cellId: string | null;
  locationArea: string | null;
  siteName: string | null;
  region: string | null;
  technology: CustomerRadioTechnology | null;
  eventId: string | null;
}

function classifyMovement(
  type: string,
  previousImei: string | null,
  nextImei: string | null,
  previousIccid: string | null,
  iccid: string | null,
  previousImsi: string | null,
  imsi: string | null,
): CustomerDeviceMovementKind | null {
  const normalized = type.toLowerCase();
  if (/sim[_ ]?swap/.test(normalized)) return "sim_swap";
  if (/sim[_ ]?move/.test(normalized)) return "sim_move";
  if (/device[_ ]?change|imei[_ ]?change|handset/.test(normalized)) {
    return "device_change";
  }
  const imeiChanged = Boolean(
    previousImei && nextImei && !sameImei(previousImei, nextImei),
  );
  const simChanged = Boolean(
    (previousIccid && iccid && previousIccid !== iccid) ||
      (previousImsi && imsi && previousImsi !== imsi),
  );
  if (imeiChanged && simChanged) return "sim_move";
  if (simChanged) return "sim_swap";
  if (imeiChanged) return "device_change";
  return null;
}

function movementPairKey(movement: CustomerDeviceMovement): string {
  const day = (movement.occurredAt || "").slice(0, 10);
  return [
    imeiIdentity(movement.previousImei),
    imeiIdentity(movement.nextImei),
    movement.previousIccid || "",
    movement.iccid || "",
    movement.imsi || "",
    day,
  ].join("|");
}

export function sortMovements(
  movements: CustomerDeviceMovement[],
): CustomerDeviceMovement[] {
  return [...movements].sort((left, right) => {
    const leftTime = Date.parse(left.occurredAt || "") || 0;
    const rightTime = Date.parse(right.occurredAt || "") || 0;
    return rightTime - leftTime;
  });
}

export function resolveDeviceTrail(
  adtMovements: CustomerDeviceMovement[],
  eventMovements: CustomerDeviceMovement[],
  derivedMovements: CustomerDeviceMovement[],
  adtAvailable: boolean,
): { movements: CustomerDeviceMovement[]; trailSource: CustomerDeviceTrailSource } {
  const withoutPairs = (
    incoming: CustomerDeviceMovement[],
    kept: CustomerDeviceMovement[],
  ) => {
    const pairs = new Set(kept.map((item) => movementPairKey(item)));
    return incoming.filter((item) => !pairs.has(movementPairKey(item)));
  };

  if (adtAvailable) {
    return {
      movements: sortMovements([
        ...adtMovements,
        ...withoutPairs(eventMovements, adtMovements),
      ]),
      trailSource: "adt",
    };
  }
  if (eventMovements.length > 0) {
    return {
      movements: sortMovements([
        ...eventMovements,
        ...withoutPairs(derivedMovements, eventMovements),
      ]),
      trailSource: "event",
    };
  }
  if (derivedMovements.length > 0) {
    return {
      movements: sortMovements(derivedMovements),
      trailSource: "derived",
    };
  }
  return { movements: [], trailSource: "none" };
}

export function eventToSighting(event: CustomerEvent): DeviceSighting | null {
  if (!isDeviceEvent(event) && !/device_change|imei_change|handset|sim_swap|sim_move/.test(event.event_type.toLowerCase())) {
    return null;
  }
  const device = event.device;
  const imei = normalizeImei(device?.imei);
  const iccid = device?.iccid ?? null;
  const imsi = device?.imsi ?? null;
  if (!imei && !iccid && !imsi) return null;
  return {
    at: event.occurred_at,
    imei,
    label: device?.model || device?.device_name || null,
    msisdn: device?.msisdn ?? null,
    iccid,
    imsi,
    previousIccid: device?.previous_iccid ?? null,
    previousImsi: device?.previous_imsi ?? null,
    cellId: device?.cell_id ?? null,
    locationArea: device?.location_area ?? null,
    siteName: device?.site_name ?? null,
    region: device?.region ?? null,
    technology: normalizeRadioTechnology(device?.technology),
    eventId: event.id,
  };
}

export function eventToMovement(event: CustomerEvent): CustomerDeviceMovement | null {
  const device = event.device;
  const type = event.event_type.toLowerCase();
  const previousImei = normalizeImei(device?.previous_imei);
  const nextImei = normalizeImei(device?.imei);
  const previousIccid = device?.previous_iccid ?? null;
  const iccid = device?.iccid ?? null;
  const previousImsi = device?.previous_imsi ?? null;
  const imsi = device?.imsi ?? null;
  const explicit = /device_change|imei_change|handset|sim_swap|sim_move/.test(type);
  const kind = classifyMovement(
    type,
    previousImei,
    nextImei,
    previousIccid,
    iccid,
    previousImsi,
    imsi,
  );
  if (!explicit && !kind) return null;
  if (!kind) return null;
  if (!previousImei && !nextImei && !iccid && !imsi && !previousIccid) return null;
  return {
    id: `event-${event.id}`,
    kind,
    occurredAt: event.occurred_at,
    previousImei,
    nextImei,
    previousLabel: previousImei,
    nextLabel: device?.model || device?.device_name || nextImei,
    msisdn: device?.msisdn ?? null,
    iccid,
    imsi,
    previousIccid,
    location: formatDeviceLocation({
      siteName: device?.site_name,
      region: device?.region,
      cellId: device?.cell_id,
      locationArea: device?.location_area,
    }),
    technology: normalizeRadioTechnology(device?.technology),
    source: "event",
    eventId: event.id,
  };
}

export function deriveDeviceMovements(
  sightings: DeviceSighting[],
): CustomerDeviceMovement[] {
  const ordered = [...sightings]
    .filter((item) => item.at && (item.imei || item.iccid || item.imsi))
    .sort((left, right) => (Date.parse(left.at) || 0) - (Date.parse(right.at) || 0));
  const movements: CustomerDeviceMovement[] = [];
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const next = ordered[index];
    const kind = classifyMovement(
      "",
      previous.imei,
      next.imei,
      previous.iccid,
      next.iccid,
      previous.imsi,
      next.imsi,
    );
    if (!kind) continue;
    movements.push({
      id: `derived-${previous.eventId || index}-${next.eventId || index}`,
      kind,
      occurredAt: next.at,
      previousImei: previous.imei,
      nextImei: next.imei,
      previousLabel: previous.label || previous.imei,
      nextLabel: next.label || next.imei,
      msisdn: next.msisdn || previous.msisdn,
      iccid: next.iccid,
      imsi: next.imsi,
      previousIccid: previous.iccid,
      location: formatDeviceLocation({
        siteName: next.siteName,
        region: next.region,
        cellId: next.cellId,
        locationArea: next.locationArea,
      }),
      technology: next.technology || previous.technology,
      source: "derived",
      eventId: next.eventId,
    });
  }
  return movements;
}

const DUMP_ROW_KEYS = [
  "rows",
  "records",
  "data",
  "items",
  "results",
  "entries",
  "changes",
  "movements",
  "dump",
];

const DUMP_ENVELOPE_KEYS = new Set([
  "success",
  "message",
  "error",
  "errors",
  "pagination",
  "meta",
  "data",
  "rows",
  "records",
  "items",
  "results",
  "entries",
  "changes",
  "movements",
  "dump",
  "summary",
  "subscriber",
  "snapshot",
]);

const DUMP_FIELD_CAP = 18;

const HLR_FIELDS: Array<[string, string]> = [
  ["imsi", "IMSI"],
  ["msisdn", "MSISDN"],
  ["status", "Status"],
  ["subscriber_status", "Subscriber status"],
  ["hlr_status", "HLR status"],
  ["barring", "Barring"],
  ["odb", "ODB"],
  ["services", "Services"],
  ["apn", "APN"],
  ["hlr", "HLR"],
  ["hlr_address", "HLR address"],
  ["hlr_id", "HLR id"],
  ["updated_at", "Updated"],
];

const VLR_FIELDS: Array<[string, string]> = [
  ["imsi", "IMSI"],
  ["msisdn", "MSISDN"],
  ["imei", "IMEI"],
  ["status", "Status"],
  ["vlr", "VLR"],
  ["vlr_address", "VLR address"],
  ["vlr_number", "VLR number"],
  ["msc", "MSC"],
  ["msc_address", "MSC address"],
  ["lac", "Location area"],
  ["location_area", "Location area"],
  ["cell_id", "Cell"],
  ["cell", "Cell"],
  ["attached", "Attached"],
  ["roaming", "Roaming"],
  ["visited_network", "Visited network"],
  ["visited_plmn", "Visited network"],
  ["technology", "Technology"],
  ["rat", "Technology"],
  ["network_type", "Technology"],
  ["last_location_update", "Last location update"],
  ["updated_at", "Updated"],
];

function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function scalarToText(value: unknown): string | null {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => scalarToText(item))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function presentDumpValue(key: string, value: unknown): string | null {
  if (key === "imei" || key.endsWith("_imei")) {
    return normalizeImei(value);
  }
  if (
    ["technology", "rat", "radio_technology", "network_type", "generation"].includes(
      key,
    )
  ) {
    const technology = normalizeRadioTechnology(value);
    if (technology) return humanizeRadioTechnology(technology);
  }
  return scalarToText(value);
}

function humanizeDumpKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function dumpRows(payload: unknown): {
  envelope: Record<string, unknown> | null;
  rows: Record<string, unknown>[];
} {
  if (Array.isArray(payload)) {
    return {
      envelope: null,
      rows: payload
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item)),
    };
  }
  const record = asRecord(payload);
  if (!record) return { envelope: null, rows: [] };
  const data = asRecord(record.data);
  const containers = [record, data].filter(
    (item): item is Record<string, unknown> => Boolean(item),
  );
  for (const container of containers) {
    for (const key of DUMP_ROW_KEYS) {
      if (!Array.isArray(container[key])) continue;
      return {
        envelope: record,
        rows: (container[key] as unknown[])
          .map((item) => asRecord(item))
          .filter((item): item is Record<string, unknown> => Boolean(item)),
      };
    }
  }
  const summary =
    asRecord(record.summary) ||
    asRecord(record.subscriber) ||
    asRecord(record.snapshot) ||
    asRecord(data?.summary) ||
    asRecord(data?.subscriber) ||
    data;
  if (summary && summary !== record) {
    return { envelope: record, rows: [summary] };
  }
  return { envelope: record, rows: [record] };
}

function dumpReceivedAt(envelope: Record<string, unknown> | null): string | null {
  if (!envelope) return null;
  const meta = asRecord(envelope.meta);
  return (
    stringOrNull(
      envelope.received_at ??
        envelope.dumped_at ??
        envelope.generated_at ??
        envelope.extracted_at ??
        meta?.received_at ??
        meta?.dumped_at,
    ) ?? null
  );
}

function dumpIdentifier(envelope: Record<string, unknown> | null): string | null {
  if (!envelope) return null;
  const meta = asRecord(envelope.meta);
  return stringOrNull(
    envelope.dump_id ??
      envelope.dumpId ??
      envelope.batch_id ??
      envelope.extract_id ??
      meta?.dump_id ??
      meta?.batch_id,
  );
}

function dumpRecordCount(
  envelope: Record<string, unknown> | null,
  rowCount: number,
): { recordCount: number | null; truncated: boolean } {
  if (!envelope) {
    return {
      recordCount: rowCount > 0 ? rowCount : null,
      truncated: false,
    };
  }
  const pagination = asRecord(envelope.pagination);
  const reported =
    numberOrNull(
      envelope.record_count ??
        envelope.recordCount ??
        envelope.total_records ??
        envelope.total ??
        pagination?.total ??
        pagination?.total_records,
    ) ?? null;
  const truncated = Boolean(
    envelope.truncated === true ||
      pagination?.has_more === true ||
      pagination?.truncated === true ||
      (reported != null && reported > rowCount),
  );
  return {
    recordCount: reported ?? (rowCount > 0 ? rowCount : null),
    truncated,
  };
}

function selectDumpRow(
  rows: Record<string, unknown>[],
  match?: { msisdn?: string | null; imsi?: string | null },
): Record<string, unknown> | null {
  if (rows.length === 0) return null;
  if (match?.imsi) {
    const found = rows.find((row) => stringOrNull(row.imsi) === match.imsi);
    if (found) return found;
  }
  if (match?.msisdn) {
    const found = rows.find((row) => stringOrNull(row.msisdn) === match.msisdn);
    if (found) return found;
  }
  return rows[0];
}

function collectDumpFields(
  row: Record<string, unknown> | null,
  preferred: Array<[string, string]>,
): { fields: CustomerDumpField[]; omittedFieldCount: number } {
  if (!row) return { fields: [], omittedFieldCount: 0 };
  const fields: CustomerDumpField[] = [];
  const used = new Set<string>();
  const seenLabels = new Set<string>();
  const push = (label: string, key: string, value: unknown) => {
    if (fields.length >= DUMP_FIELD_CAP) return;
    const text = presentDumpValue(key, value);
    if (!text) return;
    const labelKey = label.toLowerCase();
    if (seenLabels.has(labelKey)) return;
    seenLabels.add(labelKey);
    used.add(key);
    fields.push({ label, value: text });
  };

  preferred.forEach(([key, label]) => {
    if (row[key] != null) push(label, key, row[key]);
  });

  let omitted = 0;
  Object.entries(row).forEach(([key, value]) => {
    if (used.has(key) || DUMP_ENVELOPE_KEYS.has(key)) return;
    if (value == null || typeof value === "object") return;
    if (fields.length >= DUMP_FIELD_CAP) {
      omitted += 1;
      return;
    }
    push(humanizeDumpKey(key), key, value);
  });
  return { fields, omittedFieldCount: omitted };
}

export function readEmbeddedDump(
  record: Record<string, unknown> | null | undefined,
  keys: string[],
): unknown | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value) || asRecord(value)) return value;
  }
  return null;
}

export function parseAdtDump(payload: unknown | null): {
  feed: CustomerDumpFeed;
  movements: CustomerDeviceMovement[];
} {
  if (payload == null) {
    return { feed: { ...EMPTY_DUMP_FEED, fields: [] }, movements: [] };
  }
  const { envelope, rows } = dumpRows(payload);
  const movements = rows
    .map((row, index) => parseMovementRow(row, index))
    .filter((item): item is CustomerDeviceMovement => Boolean(item));
  const counts = dumpRecordCount(envelope, rows.length);
  return {
    feed: {
      available: true,
      receivedAt: dumpReceivedAt(envelope),
      dumpId: dumpIdentifier(envelope),
      recordCount: counts.recordCount,
      truncated: counts.truncated,
      omittedFieldCount: 0,
      fields: [],
    },
    movements,
  };
}

function parseMovementRow(
  row: Record<string, unknown>,
  index: number,
): CustomerDeviceMovement | null {
  const type = String(
    row.change_type ??
      row.movement_type ??
      row.event_type ??
      row.type ??
      row.kind ??
      "",
  );
  const previousImei = normalizeImei(
    row.previous_imei ??
      row.old_imei ??
      row.from_imei ??
      row.imei_from ??
      row.previousImei,
  );
  const nextImei = normalizeImei(
    row.imei ??
      row.new_imei ??
      row.to_imei ??
      row.next_imei ??
      row.imei_to ??
      row.current_imei,
  );
  const previousIccid = stringOrNull(
    row.previous_iccid ?? row.old_iccid ?? row.from_iccid,
  );
  const iccid = stringOrNull(row.iccid ?? row.new_iccid ?? row.to_iccid);
  const previousImsi = stringOrNull(
    row.previous_imsi ?? row.old_imsi ?? row.from_imsi,
  );
  const imsi = stringOrNull(row.imsi ?? row.new_imsi ?? row.to_imsi);
  const kind = classifyMovement(
    type,
    previousImei,
    nextImei,
    previousIccid,
    iccid,
    previousImsi,
    imsi,
  );
  if (!kind) return null;
  if (!previousImei && !nextImei && !iccid && !imsi && !previousIccid) return null;
  const occurredAt = stringOrNull(
    row.occurred_at ??
      row.changed_at ??
      row.timestamp ??
      row.event_time ??
      row.created_at ??
      row.dumped_at,
  );
  const id =
    stringOrNull(row.id ?? row.change_id ?? row.event_id) ||
    `adt-${index}-${previousImei || ""}-${nextImei || ""}-${occurredAt || ""}`;
  return {
    id,
    kind,
    occurredAt,
    previousImei,
    nextImei,
    previousLabel:
      stringOrNull(
        row.previous_model ??
          row.old_model ??
          row.from_device ??
          row.previous_device_name,
      ) || previousImei,
    nextLabel:
      stringOrNull(
        row.model ?? row.device_model ?? row.to_device ?? row.device_name,
      ) || nextImei,
    msisdn: stringOrNull(row.msisdn ?? row.phone),
    iccid,
    imsi,
    previousIccid,
    location: formatDeviceLocation({
      siteName: stringOrNull(row.site_name ?? row.siteName ?? row.site ?? row.cell_name),
      region: stringOrNull(row.region ?? row.zone ?? row.city ?? row.location),
      cellId: stringOrNull(row.cell_id ?? row.cellId ?? row.cell ?? row.cgi),
      locationArea: stringOrNull(
        row.lac ?? row.location_area ?? row.locationArea ?? row.tracking_area,
      ),
    }),
    technology: normalizeRadioTechnology(
      row.technology ?? row.rat ?? row.network_type ?? row.radio_technology,
    ),
    source: "adt",
    eventId: stringOrNull(row.event_id ?? row.eventId),
  };
}

export function parseRegisterDump(
  payload: unknown | null,
  kind: "hlr" | "vlr",
  match?: { msisdn?: string | null; imsi?: string | null },
): CustomerDumpFeed {
  if (payload == null) return { ...EMPTY_DUMP_FEED, fields: [] };
  const { envelope, rows } = dumpRows(payload);
  const row = selectDumpRow(rows, match);
  const collected = collectDumpFields(row, kind === "hlr" ? HLR_FIELDS : VLR_FIELDS);
  const counts = dumpRecordCount(envelope, rows.length);
  return {
    available: true,
    receivedAt: dumpReceivedAt(envelope) || stringOrNull(row?.updated_at ?? row?.dumped_at),
    dumpId: dumpIdentifier(envelope),
    recordCount: counts.recordCount,
    truncated: counts.truncated,
    omittedFieldCount: collected.omittedFieldCount,
    fields: collected.fields,
  };
}
