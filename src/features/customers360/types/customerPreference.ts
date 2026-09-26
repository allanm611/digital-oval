/**
 * Customer 360 preferences — consent, channel opt-in/out, and profile
 * settings for this subscriber.
 *
 * This tab is a consent ledger, not:
 *   - Communications (messages already sent)
 *   - Events (full activity stream)
 *   - Subscribed lists (marketing list membership)
 *   - Campaigns / offers (audience and eligibility)
 *   - DND admin (operator suppression lists — only this customer's rows)
 *
 * Channel "Enabled" is never invented. DND membership is opt-out.
 * preferred_channel is a routing hint, not full consent.
 *
 * Resolution:
 *   1. Prefer GET /subscribers/:id/preferences (or /consent, /dnd)
 *   2. Match DND subscriptions to this customer's phone / email / IDs
 *      (never list the full DND catalog)
 *   3. Include live opt-in / opt-out events only (never fallback events)
 *   4. Keep profile language, preferred channel, and preference hints
 *
 * Recommended backend contract (when available):
 *   GET /subscribers/:id/preferences
 *   Body: { success, data: { language, preferred_channel, channels, consents } }
 *   GET /subscribers/:id/dnd
 */

import type { CustomerIdentifierKind } from "./customerSubscribedList";

export type CustomerPreferenceChannel =
  | "email"
  | "sms"
  | "push"
  | "whatsapp"
  | "ussd"
  | "app"
  | "voice"
  | "other";

export type CustomerPreferenceConsentStatus =
  | "opted_in"
  | "opted_out"
  | "preferred"
  | "unknown";

export type CustomerPreferenceKind =
  | "channel"
  | "notification"
  | "privacy"
  | "content"
  | "dnd";

export type CustomerPreferenceEvidence =
  | "subscriber_api"
  | "dnd"
  | "event"
  | "profile_hint";

export type CustomerPreferenceVerification = "verified" | "hint";

export type CustomerPreferenceLoadPhase =
  | "lookup"
  | "dnd"
  | "events"
  | "catalog";

export interface CustomerPreferenceSettings {
  language: string | null;
  languageLabel: string | null;
  preferredChannel: string | null;
  preferredChannelLabel: string | null;
  frequency: string | null;
  personalization: boolean | null;
  dataSharing: boolean | null;
  contentCategories: string[];
  evidence: CustomerPreferenceEvidence[];
  verification: CustomerPreferenceVerification;
}

export interface CustomerChannelPreference {
  id: string;
  channel: CustomerPreferenceChannel;
  channelLabel: string;
  status: CustomerPreferenceConsentStatus;
  categories: string[];
  evidence: CustomerPreferenceEvidence[];
  verification: CustomerPreferenceVerification;
}

export interface CustomerPreferenceItem {
  id: string;
  kind: CustomerPreferenceKind;
  name: string;
  channel: CustomerPreferenceChannel | null;
  channelLabel: string | null;
  category: string | null;
  status: CustomerPreferenceConsentStatus;
  updatedAt: string | null;
  expiresAt: string | null;
  dndSubscriptionId: number | null;
  communicationChannelId: number | null;
  matchedIdentifier: string | null;
  matchedIdentifierType: CustomerIdentifierKind | null;
  eventId: string | null;
  evidence: CustomerPreferenceEvidence[];
  verification: CustomerPreferenceVerification;
}

export interface CustomerPreferenceCounts {
  total: number;
  optedIn: number;
  optedOut: number;
  channels: number;
}

export interface CustomerPreferenceResult {
  settings: CustomerPreferenceSettings;
  channels: CustomerChannelPreference[];
  consents: CustomerPreferenceItem[];
  counts: CustomerPreferenceCounts;
  eventCount: number;
  source: "live" | "partial";
  subscriberLookupUsed: boolean;
  eventsLive: boolean;
  warnings: string[];
}

export interface CustomerPreferenceProgress {
  phase: CustomerPreferenceLoadPhase;
  checked: number;
  total: number;
}
