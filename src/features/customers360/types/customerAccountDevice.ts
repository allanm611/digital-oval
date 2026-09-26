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
 *   Body: { success, data, pagination,
 *           snapshot: { status, created_at, last_login, kyc_verified } }
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
  | "tablet"
  | "web"
  | "tv"
  | "other";

export type CustomerVerificationFlag = "verified" | "unverified" | "unknown";

export type CustomerAccountDeviceEvidence =
  | "subscriber_api"
  | "event"
  | "profile";

export type CustomerAccountDeviceVerification = "verified" | "hint";

export type CustomerAccountDeviceLoadPhase = "lookup" | "events";

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
  model: string | null;
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
}

export interface CustomerAccountDeviceProgress {
  phase: CustomerAccountDeviceLoadPhase;
  checked: number;
  total: number;
}
