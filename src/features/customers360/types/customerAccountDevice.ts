/**
 * Customer 360 account & device — SIM/subscription lines and registered
 * devices for this subscriber.
 *
 * This tab is a technical inventory, not:
 *   - Customer Information (PII, address, KPIs)
 *   - Events (full activity stream)
 *   - Preferences (consent / DND)
 *   - Interactions (support tickets)
 *   - Operator user sessions (CVM admin login devices)
 *
 * Account status and KYC/email/phone verification are never invented.
 * `device_type: "unknown"` from customer create is not a real device.
 * Billed usage and marketing events stay on their own tabs.
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/accounts and /devices (or /sessions)
 *   2. Derive last login and device rows from live care/login events only
 *      (never fallback/demo events)
 *   3. Keep profile SIM / MSISDN / ICCID / IMSI and verification flags
 *   4. Never scan the global operator session catalog
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/accounts
 *   GET /subscribers/:id/devices
 *   GET /subscribers/:id/adt?limit=50
 *   GET /subscribers/:id/hlr?limit=50
 *   GET /subscribers/:id/vlr?limit=50
 *   Body: { success, data, pagination,
 *           snapshot: { status, created_at, last_login, kyc_verified } }
 *
 * Device identity hangs off the IMEI. Manufacturer, model, and radio
 * technology are shown only when a device record, event, or dump
 * includes them. The TAC (first 8 digits of the IMEI) is displayed as
 * an identifier. It is not looked up in a local catalog, because a
 * stale catalog would name the wrong handset.
 *
 * ADT is the inspection trail for a handset change: previous IMEI,
 * next IMEI, the SIM, and the location of the change. Until that feed
 * is connected, a change is reconstructed only from verified events
 * whose IMEI or SIM identity actually differs, and it is labeled as
 * reconstructed.
 *
 * HLR (home location register) and VLR (visitor location register) are
 * heavy network extracts. This tab requests the subscriber slice only.
 * Payloads that say "hr" or "var" are accepted as aliases. A missing
 * feed stays empty.
 */

export type CustomerInventoryKind = "account" | "device";

export type CustomerAccountDeviceStatus =
  | "active"
  | "inactive"
  | "suspended"
  | "closed"
  | "unknown";

export type CustomerDeviceType =
  | "mobile"
  | "smartphone"
  | "feature_phone"
  | "tablet"
  | "web"
  | "tv"
  | "other";

/** Radio access technology captured on the device, event, or dump. */
export type CustomerRadioTechnology = "2g" | "3g" | "4g" | "5g";

export type CustomerImeiCheck = "valid" | "invalid" | "unchecked";

export type CustomerDeviceMovementKind =
  | "device_change"
  | "sim_move"
  | "sim_swap";

export type CustomerDeviceMovementSource = "adt" | "event" | "derived";

export type CustomerDeviceTrailSource = "adt" | "event" | "derived" | "none";

export type CustomerVerificationFlag = "verified" | "unverified" | "unknown";

export type CustomerAccountDeviceEvidence =
  | "subscriber_api"
  | "event"
  | "profile";

export type CustomerAccountDeviceVerification = "verified" | "hint";

export type CustomerAccountDeviceLoadPhase = "lookup" | "events" | "dumps";

export interface CustomerAccountSnapshot {
  accountId: string | null;
  status: CustomerAccountDeviceStatus;
  createdAt: string | null;
  lastLoginAt: string | null;
  msisdn: string | null;
  iccid: string | null;
  imsi: string | null;
  simType: string | null;
  tariff: string | null;
  emailVerified: CustomerVerificationFlag;
  phoneVerified: CustomerVerificationFlag;
  kycVerified: CustomerVerificationFlag;
  primaryDeviceName: string | null;
  primaryDeviceType: CustomerDeviceType | null;
  primaryImei: string | null;
  primaryTac: string | null;
  primaryManufacturer: string | null;
  primaryModel: string | null;
  primaryTechnology: CustomerRadioTechnology | null;
  primaryOs: string | null;
  primaryAppVersion: string | null;
  lastActivityDeviceName: string | null;
  evidence: CustomerAccountDeviceEvidence[];
  verification: CustomerAccountDeviceVerification;
}

export interface CustomerInventoryItem {
  id: string;
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
  tac: string | null;
  imeiCheck: CustomerImeiCheck;
  manufacturer: string | null;
  model: string | null;
  technology: CustomerRadioTechnology | null;
  lastLocation: string | null;
  eventId: string | null;
  evidence: CustomerAccountDeviceEvidence[];
  verification: CustomerAccountDeviceVerification;
}

export interface CustomerAccountDeviceCounts {
  total: number;
  accounts: number;
  devices: number;
  active: number;
}

export interface CustomerAccountDeviceResult {
  snapshot: CustomerAccountSnapshot;
  items: CustomerInventoryItem[];
  counts: CustomerAccountDeviceCounts;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
  movements: CustomerDeviceMovement[];
  trailSource: CustomerDeviceTrailSource;
  adt: CustomerDumpFeed;
  hlr: CustomerDumpFeed;
  vlr: CustomerDumpFeed;
}

export interface CustomerDumpField {
  label: string;
  value: string;
}

/** Bounded subscriber slice of a heavy network or ADT extract. */
export interface CustomerDumpFeed {
  available: boolean;
  receivedAt: string | null;
  dumpId: string | null;
  recordCount: number | null;
  truncated: boolean;
  omittedFieldCount: number;
  fields: CustomerDumpField[];
}

/**
 * One inspected change. A device change is an IMEI change on the line
 * (including a SIM placed in a different handset). A SIM swap is a new
 * ICCID or IMSI. A SIM move is kept when the dump itself classifies
 * the row that way, or when the SIM identity and the handset both change.
 */
export interface CustomerDeviceMovement {
  id: string;
  kind: CustomerDeviceMovementKind;
  occurredAt: string | null;
  previousImei: string | null;
  nextImei: string | null;
  previousLabel: string | null;
  nextLabel: string | null;
  msisdn: string | null;
  iccid: string | null;
  imsi: string | null;
  previousIccid: string | null;
  location: string | null;
  technology: CustomerRadioTechnology | null;
  source: CustomerDeviceMovementSource;
  eventId: string | null;
}

export interface CustomerAccountDeviceProgress {
  phase: CustomerAccountDeviceLoadPhase;
  checked: number;
  total: number;
}
