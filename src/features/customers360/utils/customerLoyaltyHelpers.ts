import type { Offer } from "../../offers/types/offer";
import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerLoyaltyAccount,
  CustomerLoyaltyCounts,
  CustomerLoyaltyEvidence,
  CustomerLoyaltyItem,
  CustomerLoyaltyKind,
  CustomerLoyaltyProgramStatus,
  CustomerLoyaltyStatus,
  CustomerLoyaltyVerification,
} from "../types/customerLoyalty";
import { asRecord } from "./customerSegmentHelpers";
import { extractAddedAt } from "./customerSubscribedListHelpers";

export const EMPTY_LOYALTY_COUNTS: CustomerLoyaltyCounts = {
  total: 0,
  earned: 0,
  redeemed: 0,
  granted: 0,
  pointsEarned: 0,
  pointsRedeemed: 0,
};

export const EMPTY_LOYALTY_ACCOUNT: CustomerLoyaltyAccount = {
  programName: null,
  status: "unknown",
  tier: null,
  tierBenefits: [],
  pointsBalance: null,
  pointsEarned: null,
  pointsRedeemed: null,
  balanceEstimated: false,
  enrolledAt: null,
  evidence: [],
  verification: "hint",
};

const LOYALTY_EVENT_TYPES = new Set([
  "points_earned",
  "points_redeemed",
  "points_expired",
  "points_adjusted",
  "loyalty_enrolled",
  "loyalty_tier_changed",
  "tier_upgraded",
  "tier_downgraded",
  "reward_granted",
  "loyalty_reward_redeemed",
  "loyalty_reward_earned",
  "cashback_credited",
]);

const EXCLUDED_EVENT_TYPES = new Set([
  "order_confirmation",
  "order_alert",
  "delivery_notification",
  "price_drop_alert",
  "new_products",
  "promotional_sms",
  "welcome_email",
  "campaign_executed",
  "message_sent",
  "newsletter",
  "received_message",
  "message_received",
  "app_login",
  "ussd_session",
  "data_usage",
  "voice_call",
  "customer_sms",
  "offer_accepted",
]);

export type DraftLoyaltyActivity = {
  name: string;
  kind: CustomerLoyaltyKind;
  points: number | null;
  pointsBalanceAfter: number | null;
  status: CustomerLoyaltyStatus;
  occurredAt: string | null;
  rewardType: string | null;
  channel: string | null;
  offerId: number | null;
  offerName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  manualRewardId: number | null;
  eventId: string | null;
  evidence: Set<CustomerLoyaltyEvidence>;
};

export type DraftLoyaltyAccount = {
  programName: string | null;
  status: CustomerLoyaltyProgramStatus;
  tier: string | null;
  tierBenefits: string[];
  pointsBalance: number | null;
  pointsEarned: number | null;
  pointsRedeemed: number | null;
  balanceEstimated: boolean;
  enrolledAt: string | null;
  evidence: Set<CustomerLoyaltyEvidence>;
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

export function numberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[, ]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function unwrapLoyaltyList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const account = asRecord(nested) || asRecord(record.account) || nested;
  const accountRecord = asRecord(account);
  const candidates = [
    record.data,
    record.history,
    record.activities,
    record.ledger,
    record.rewards,
    record.items,
    record.results,
    nested?.data,
    nested?.history,
    nested?.activities,
    nested?.ledger,
    nested?.rewards,
    nested?.items,
    accountRecord?.history,
    accountRecord?.activities,
    accountRecord?.ledger,
    accountRecord?.rewards,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeProgramStatus(
  value: unknown,
): CustomerLoyaltyProgramStatus {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["active", "enrolled", "member", "enabled"].includes(raw)) return "active";
  if (["inactive", "lapsed", "disabled", "cancelled", "canceled"].includes(raw)) {
    return "inactive";
  }
  if (["pending", "invited", "enrolment_pending", "enrollment_pending"].includes(raw)) {
    return "pending";
  }
  return "unknown";
}

export function normalizeKind(
  value: unknown,
  extras?: { eventType?: string; points?: number | null },
): CustomerLoyaltyKind {
  const raw = String(value || extras?.eventType || "")
    .trim()
    .toLowerCase();
  if (raw.includes("tier")) return "tier_change";
  if (raw.includes("expire") || raw.includes("forfeit")) return "expire";
  if (raw.includes("grant") || raw.includes("manual")) return "grant";
  if (raw.includes("adjust") || raw.includes("correction")) return "adjust";
  if (raw.includes("redeem") || raw.includes("spent") || raw.includes("burn")) {
    return "redeem";
  }
  if (raw.includes("earn") || raw.includes("credit") || raw.includes("accrual")) {
    return "earn";
  }
  if (extras?.points != null && extras.points < 0) return "redeem";
  return "earn";
}

export function normalizeStatus(value: unknown): CustomerLoyaltyStatus {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (["pending", "processing", "queued"].includes(raw)) return "pending";
  if (["failed", "error", "declined", "rejected"].includes(raw)) return "failed";
  if (["cancelled", "canceled", "void"].includes(raw)) return "cancelled";
  return "completed";
}

export function humanizeLoyaltyKind(kind: CustomerLoyaltyKind | string): string {
  if (kind === "earn") return "Earned";
  if (kind === "redeem") return "Redeemed";
  if (kind === "grant") return "Granted";
  if (kind === "expire") return "Expired";
  if (kind === "adjust") return "Adjusted";
  if (kind === "tier_change") return "Tier change";
  return "Other";
}

export function humanizeLoyaltyStatus(
  status: CustomerLoyaltyStatus | string,
): string {
  const value = normalizeStatus(status);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function humanizeProgramStatus(
  status: CustomerLoyaltyProgramStatus | string,
): string {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  if (status === "pending") return "Pending enrollment";
  return "Unknown";
}

function preferText(current: string | null, incoming: string | null): string | null {
  if (!current) return incoming;
  if (!incoming) return current;
  if (incoming.length > current.length) return incoming;
  return current;
}

function parseBenefitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        const row = asRecord(item);
        return (
          stringOrNull(row?.name ?? row?.benefit ?? row?.title ?? row?.description) ||
          ""
        );
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

export function createDraftActivity(
  extras?: Partial<Omit<DraftLoyaltyActivity, "evidence">> & {
    evidence?: CustomerLoyaltyEvidence[];
  },
): DraftLoyaltyActivity {
  return {
    name: extras?.name || "",
    kind: extras?.kind || "earn",
    points: extras?.points ?? null,
    pointsBalanceAfter: extras?.pointsBalanceAfter ?? null,
    status: extras?.status || "completed",
    occurredAt: extras?.occurredAt ?? null,
    rewardType: extras?.rewardType ?? null,
    channel: extras?.channel ?? null,
    offerId: extras?.offerId ?? null,
    offerName: extras?.offerName ?? null,
    campaignId: extras?.campaignId ?? null,
    campaignName: extras?.campaignName ?? null,
    manualRewardId: extras?.manualRewardId ?? null,
    eventId: extras?.eventId ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

export function createDraftAccount(
  extras?: Partial<Omit<DraftLoyaltyAccount, "evidence" | "tierBenefits">> & {
    evidence?: CustomerLoyaltyEvidence[];
    tierBenefits?: string[];
  },
): DraftLoyaltyAccount {
  return {
    programName: extras?.programName ?? null,
    status: extras?.status || "unknown",
    tier: extras?.tier ?? null,
    tierBenefits: extras?.tierBenefits ? [...extras.tierBenefits] : [],
    pointsBalance: extras?.pointsBalance ?? null,
    pointsEarned: extras?.pointsEarned ?? null,
    pointsRedeemed: extras?.pointsRedeemed ?? null,
    balanceEstimated: extras?.balanceEstimated ?? false,
    enrolledAt: extras?.enrolledAt ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

export function draftKey(draft: DraftLoyaltyActivity): string {
  if (draft.eventId) return `event-${draft.eventId}`;
  if (draft.manualRewardId) return `manual-${draft.manualRewardId}`;
  const stamp = draft.occurredAt || "";
  return `loyalty-${draft.kind}-${draft.name.toLowerCase()}-${stamp}-${draft.points ?? ""}`;
}

export function findExistingKey(
  byKey: Map<string, DraftLoyaltyActivity>,
  draft: DraftLoyaltyActivity,
): string | null {
  const canonical = draftKey(draft);
  if (byKey.has(canonical)) return canonical;
  for (const [key, item] of byKey) {
    if (draft.eventId && item.eventId === draft.eventId) return key;
    if (
      draft.manualRewardId &&
      item.manualRewardId === draft.manualRewardId &&
      draft.kind === item.kind
    ) {
      return key;
    }
  }
  return null;
}

export function mergeActivity(
  target: DraftLoyaltyActivity,
  source: DraftLoyaltyActivity,
): DraftLoyaltyActivity {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.name = preferText(target.name, source.name) || target.name;
  if (target.kind === "earn" && source.kind !== "earn") target.kind = source.kind;
  target.points = target.points ?? source.points;
  target.pointsBalanceAfter =
    target.pointsBalanceAfter ?? source.pointsBalanceAfter;
  if (source.status === "failed") target.status = "failed";
  else if (target.status === "pending" && source.status === "completed") {
    target.status = "completed";
  }
  target.occurredAt = target.occurredAt || source.occurredAt;
  target.rewardType = target.rewardType || source.rewardType;
  target.channel = target.channel || source.channel;
  target.offerId = target.offerId ?? source.offerId;
  target.offerName = target.offerName || source.offerName;
  target.campaignId = target.campaignId ?? source.campaignId;
  target.campaignName = target.campaignName || source.campaignName;
  target.manualRewardId = target.manualRewardId ?? source.manualRewardId;
  target.eventId = target.eventId || source.eventId;
  return target;
}

export function mergeAccount(
  target: DraftLoyaltyAccount,
  source: DraftLoyaltyAccount,
): DraftLoyaltyAccount {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.programName = preferText(target.programName, source.programName);
  if (target.status === "unknown" && source.status !== "unknown") {
    target.status = source.status;
  }
  target.tier = target.tier || source.tier;
  if (source.tierBenefits.length > target.tierBenefits.length) {
    target.tierBenefits = [...source.tierBenefits];
  }
  if (!target.balanceEstimated) {
    target.pointsBalance = target.pointsBalance ?? source.pointsBalance;
  } else if (source.pointsBalance != null && !source.balanceEstimated) {
    target.pointsBalance = source.pointsBalance;
    target.balanceEstimated = false;
  } else {
    target.pointsBalance = target.pointsBalance ?? source.pointsBalance;
  }
  target.pointsEarned = target.pointsEarned ?? source.pointsEarned;
  target.pointsRedeemed = target.pointsRedeemed ?? source.pointsRedeemed;
  if (!source.balanceEstimated && target.balanceEstimated && source.pointsBalance != null) {
    target.balanceEstimated = false;
  }
  target.enrolledAt = target.enrolledAt || source.enrolledAt;
  return target;
}

function looksLikeLoyaltyRecord(row: Record<string, unknown>): boolean {
  const kind = String(row.kind ?? row.loyalty_kind ?? row.type ?? "").toLowerCase();
  const rewardType = String(
    row.reward_type ?? row.rewardType ?? row.category ?? "",
  ).toLowerCase();
  if (
    numberOrNull(
      row.points ??
        row.loyalty_points ??
        row.points_amount ??
        row.points_earned ??
        row.points_redeemed,
    ) != null
  ) {
    return true;
  }
  if (/earn|redeem|grant|expire|tier|loyalty|points/.test(kind)) return true;
  if (/point|loyalty|cashback|voucher/.test(rewardType)) return true;
  if (row.tier_from || row.tier_to || row.loyalty_tier) return true;
  return false;
}

export function parseLoyaltyActivity(
  item: unknown,
  extras?: { evidence?: CustomerLoyaltyEvidence },
): DraftLoyaltyActivity | null {
  const row = asRecord(item);
  if (!row) return null;
  if (!looksLikeLoyaltyRecord(row)) return null;

  const offer = asRecord(row.offer);
  const campaign = asRecord(row.campaign);
  const points = numberOrNull(
    row.points ??
      row.loyalty_points ??
      row.points_amount ??
      row.points_earned ??
      row.points_redeemed ??
      row.points_granted ??
      row.reward_value,
  );
  const kind = normalizeKind(row.kind ?? row.loyalty_kind ?? row.type ?? row.category, {
    eventType: stringOrNull(row.event_type) || "",
    points,
  });
  const name =
    stringOrNull(
      row.reward_name ??
        row.name ??
        row.title ??
        row.benefit ??
        row.description ??
        offer?.name,
    ) || (kind === "tier_change" ? "Tier change" : "Loyalty activity");

  return createDraftActivity({
    name,
    kind,
    points,
    pointsBalanceAfter: numberOrNull(
      row.points_balance_after ?? row.balance_after ?? row.points_balance,
    ),
    status: normalizeStatus(row.status),
    occurredAt:
      stringOrNull(
        row.occurred_at ??
          row.redeemed_at ??
          row.earned_at ??
          row.granted_at ??
          row.date ??
          row.created_at,
      ) ?? extractAddedAt(row),
    rewardType: stringOrNull(row.reward_type ?? row.rewardType ?? row.category),
    channel: stringOrNull(row.channel),
    offerId: numericId(row.offer_id ?? row.offerId) ?? numericId(offer?.id),
    offerName: stringOrNull(row.offer_name ?? offer?.name),
    campaignId:
      numericId(row.campaign_id ?? row.campaignId) ?? numericId(campaign?.id),
    campaignName: stringOrNull(row.campaign_name ?? campaign?.name),
    manualRewardId: numericId(
      row.manual_reward_id ?? row.manualRewardId,
    ),
    eventId: stringOrNull(row.event_id ?? row.eventId),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseLoyaltyAccount(
  payload: unknown,
  extras?: { evidence?: CustomerLoyaltyEvidence },
): DraftLoyaltyAccount | null {
  const record = asRecord(payload);
  if (!record) return null;
  const nested = asRecord(record.data);
  const account =
    asRecord(record.account) ||
    asRecord(record.loyalty) ||
    asRecord(record.loyalty_account) ||
    asRecord(nested?.account) ||
    asRecord(nested?.loyalty) ||
    nested ||
    record;

  const pointsBalance = numberOrNull(
    account?.points_balance ??
      account?.current_points ??
      account?.loyalty_points ??
      record.points_balance ??
      record.current_points ??
      record.loyalty_points,
  );
  const pointsEarned = numberOrNull(
    account?.points_earned ??
      account?.total_points_earned ??
      account?.lifetime_points ??
      record.points_earned,
  );
  const pointsRedeemed = numberOrNull(
    account?.points_redeemed ??
      account?.total_points_redeemed ??
      record.points_redeemed,
  );
  const tier = stringOrNull(
    account?.tier ??
      account?.loyalty_tier ??
      account?.program_tier ??
      record.tier ??
      record.loyalty_tier,
  );
  const programName = stringOrNull(
    account?.program_name ??
      account?.program ??
      account?.loyalty_program ??
      record.program_name,
  );
  const status = normalizeProgramStatus(
    account?.status ??
      account?.program_status ??
      account?.loyalty_status ??
      record.loyalty_status,
  );
  const enrolledAt =
    stringOrNull(account?.enrolled_at ?? account?.joined_at ?? record.enrolled_at) ??
    (account ? extractAddedAt(account) : null);
  const benefits = parseBenefitList(
    account?.tier_benefits ??
      account?.benefits ??
      record.tier_benefits ??
      record.benefits,
  );

  if (
    pointsBalance == null &&
    pointsEarned == null &&
    pointsRedeemed == null &&
    !tier &&
    !programName &&
    status === "unknown" &&
    benefits.length === 0 &&
    !enrolledAt
  ) {
    return null;
  }

  return createDraftAccount({
    programName,
    status,
    tier,
    tierBenefits: benefits,
    pointsBalance,
    pointsEarned,
    pointsRedeemed,
    enrolledAt,
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseHintLoyalty(
  record: Record<string, unknown> | null | undefined,
): { account: DraftLoyaltyAccount | null; activities: DraftLoyaltyActivity[] } {
  if (!record) return { account: null, activities: [] };

  const hintAccount = parseLoyaltyAccount(
    {
      points_balance:
        record.loyalty_points ??
        record.points_balance ??
        record.current_points ??
        record.points,
      points_earned: record.points_earned ?? record.total_points_earned,
      points_redeemed: record.points_redeemed ?? record.total_points_redeemed,
      tier:
        record.loyalty_tier ??
        record.program_tier ??
        record.customer_tier ??
        record.customerTier,
      program_name: record.loyalty_program ?? record.program_name,
      loyalty_status: record.loyalty_status ?? record.program_status,
      tier_benefits: record.tier_benefits ?? record.loyalty_benefits,
      enrolled_at: record.loyalty_enrolled_at,
    },
    { evidence: "profile_hint" },
  );

  const activities = unwrapLoyaltyList(
    record.loyalty_history ??
      record.loyalty_rewards ??
      record.points_history ??
      record.reward_history ??
      record.loyalty,
  )
    .map((item) => parseLoyaltyActivity(item, { evidence: "profile_hint" }))
    .filter((item): item is DraftLoyaltyActivity => Boolean(item));

  return { account: hintAccount, activities };
}

export function isLoyaltyEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  if (EXCLUDED_EVENT_TYPES.has(type)) {
    return Boolean(event.loyalty && event.loyalty.points != null);
  }
  if (LOYALTY_EVENT_TYPES.has(type)) return true;
  if (/loyalty|points_earn|points_redeem|tier_change|reward_grant/.test(type)) {
    return true;
  }
  const loyalty = event.loyalty;
  if (!loyalty) return false;
  if (loyalty.points != null || loyalty.points_balance != null) return true;
  if (loyalty.tier_from || loyalty.tier_to) return true;
  return /point|loyalty|cashback|voucher/.test(
    String(loyalty.reward_type || loyalty.kind || "").toLowerCase(),
  );
}

export function eventToDraft(event: CustomerEvent): DraftLoyaltyActivity | null {
  if (!isLoyaltyEvent(event)) return null;
  const loyalty = event.loyalty;
  const kind = normalizeKind(loyalty?.kind, {
    eventType: event.event_type,
    points: loyalty?.points ?? null,
  });
  const name =
    loyalty?.reward_name ||
    event.offer?.name ||
    (kind === "tier_change"
      ? [loyalty?.tier_from, loyalty?.tier_to].filter(Boolean).join(" → ") ||
        "Tier change"
      : event.event_type_label) ||
    "Loyalty activity";

  return createDraftActivity({
    name,
    kind,
    points: loyalty?.points ?? null,
    pointsBalanceAfter: loyalty?.points_balance ?? null,
    status: normalizeStatus(event.status),
    occurredAt: event.occurred_at,
    rewardType: loyalty?.reward_type ?? event.offer?.type ?? null,
    channel: event.channel,
    offerId: event.offer?.id ?? null,
    offerName: event.offer?.name || null,
    campaignId: event.campaign?.id ?? null,
    campaignName: event.campaign?.name || null,
    eventId: event.id,
    evidence: ["event"],
  });
}

export function applyOfferCatalog(
  draft: DraftLoyaltyActivity,
  offer: Offer,
): DraftLoyaltyActivity {
  draft.offerId = offer.id;
  draft.offerName = offer.name || draft.offerName;
  if (!draft.name || draft.name === "Loyalty activity") {
    draft.name = offer.name || draft.name;
  }
  if (!draft.rewardType && offer.offer_type_label) {
    draft.rewardType = String(offer.offer_type_label);
  }
  return draft;
}

export function accountFromEvents(
  events: CustomerEvent[],
): DraftLoyaltyAccount | null {
  const ordered = [...events].sort((a, b) => {
    const aTime = Date.parse(a.occurred_at || "") || 0;
    const bTime = Date.parse(b.occurred_at || "") || 0;
    return bTime - aTime;
  });
  let latest: DraftLoyaltyAccount | null = null;
  ordered.forEach((event) => {
    if (!isLoyaltyEvent(event) || !event.loyalty) return;
    const incoming = createDraftAccount({
      programName: event.loyalty.program_name,
      tier: event.loyalty.tier_to || event.loyalty.tier,
      pointsBalance: event.loyalty.points_balance,
      evidence: ["event"],
    });
    if (!latest) {
      latest = incoming;
      return;
    }
    mergeAccount(latest, incoming);
  });
  return latest;
}

export function applyActivityTotals(account: DraftLoyaltyAccount, counts: CustomerLoyaltyCounts) {
  if (account.pointsEarned == null && counts.pointsEarned > 0) {
    account.pointsEarned = counts.pointsEarned;
  }
  if (account.pointsRedeemed == null && counts.pointsRedeemed > 0) {
    account.pointsRedeemed = counts.pointsRedeemed;
  }
  if (
    account.pointsBalance == null &&
    (counts.pointsEarned > 0 || counts.pointsRedeemed > 0)
  ) {
    account.pointsBalance = counts.pointsEarned - counts.pointsRedeemed;
    account.balanceEstimated = true;
  }
}

export function finalizeAccount(draft: DraftLoyaltyAccount): CustomerLoyaltyAccount {
  const verification: CustomerLoyaltyVerification =
    draft.evidence.has("subscriber_api") || draft.evidence.has("event")
      ? "verified"
      : "hint";
  return {
    programName: draft.programName,
    status: draft.status,
    tier: draft.tier,
    tierBenefits: draft.tierBenefits,
    pointsBalance: draft.pointsBalance,
    pointsEarned: draft.pointsEarned,
    pointsRedeemed: draft.pointsRedeemed,
    balanceEstimated: draft.balanceEstimated,
    enrolledAt: draft.enrolledAt,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function finalizeActivity(draft: DraftLoyaltyActivity): CustomerLoyaltyItem {
  const verification: CustomerLoyaltyVerification =
    draft.evidence.has("subscriber_api") || draft.evidence.has("event")
      ? "verified"
      : "hint";
  return {
    id: draftKey(draft),
    name: draft.name || "Loyalty activity",
    kind: draft.kind,
    points: draft.points,
    pointsBalanceAfter: draft.pointsBalanceAfter,
    status: draft.status,
    occurredAt: draft.occurredAt,
    rewardType: draft.rewardType,
    channel: draft.channel,
    offerId: draft.offerId,
    offerName: draft.offerName,
    campaignId: draft.campaignId,
    campaignName: draft.campaignName,
    manualRewardId: draft.manualRewardId,
    eventId: draft.eventId,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function sortActivities(items: CustomerLoyaltyItem[]): CustomerLoyaltyItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.occurredAt || "") || 0;
    const bTime = Date.parse(b.occurredAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function countActivities(
  items: CustomerLoyaltyItem[],
): CustomerLoyaltyCounts {
  return items.reduce(
    (counts, item) => {
      counts.total += 1;
      if (item.kind === "earn") counts.earned += 1;
      if (item.kind === "redeem") counts.redeemed += 1;
      if (item.kind === "grant") counts.granted += 1;
      if (item.points != null && item.status === "completed") {
        if (item.kind === "earn" || item.kind === "grant" || item.kind === "adjust") {
          counts.pointsEarned += Math.max(0, item.points);
        }
        if (item.kind === "redeem" || item.kind === "expire") {
          counts.pointsRedeemed += Math.abs(item.points);
        }
      }
      return counts;
    },
    { ...EMPTY_LOYALTY_COUNTS },
  );
}

export function uniqueLoyaltyKinds(
  items: CustomerLoyaltyItem[],
): CustomerLoyaltyKind[] {
  return Array.from(new Set(items.map((item) => item.kind))).sort();
}

export function uniqueLoyaltyStatuses(
  items: CustomerLoyaltyItem[],
): CustomerLoyaltyStatus[] {
  const present = new Set(items.map((item) => item.status));
  return (["completed", "pending", "failed", "cancelled"] as CustomerLoyaltyStatus[]).filter(
    (status) => present.has(status),
  );
}

export function filterActivities(
  items: CustomerLoyaltyItem[],
  query: { search?: string; kind?: string; status?: string },
): CustomerLoyaltyItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const kind = query.kind && query.kind !== "all" ? query.kind : "";
  const status = query.status && query.status !== "all" ? query.status : "";

  return items.filter((item) => {
    if (kind && item.kind !== kind) return false;
    if (status && item.status !== status) return false;
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      (item.offerName || "").toLowerCase().includes(search) ||
      (item.campaignName || "").toLowerCase().includes(search) ||
      (item.rewardType || "").toLowerCase().includes(search)
    );
  });
}

export function latestActivityAt(items: CustomerLoyaltyItem[]): string | null {
  return items.reduce<string | null>((latest, item) => {
    if (!item.occurredAt) return latest;
    if (!latest) return item.occurredAt;
    return Date.parse(item.occurredAt) >= Date.parse(latest)
      ? item.occurredAt
      : latest;
  }, null);
}

export function formatPoints(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString();
}
