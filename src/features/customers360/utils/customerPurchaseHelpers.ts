import type { Offer } from "../../offers/types/offer";
import type { Product } from "../../products/types/product";
import type { CustomerEvent } from "../types/customerEvent";
import type {
  CustomerPurchaseCounts,
  CustomerPurchaseEvidence,
  CustomerPurchaseItem,
  CustomerPurchaseKind,
  CustomerPurchaseStatus,
  CustomerPurchaseVerification,
} from "../types/customerPurchase";
import { asRecord } from "./customerSegmentHelpers";
import { extractAddedAt } from "./customerSubscribedListHelpers";

export const EMPTY_PURCHASE_COUNTS: CustomerPurchaseCounts = {
  total: 0,
  completed: 0,
  pending: 0,
  failed: 0,
  totalSpend: 0,
};

const PURCHASE_EVENT_TYPES = new Set([
  "bundle_purchase",
  "recharge",
  "purchase",
  "product_purchase",
  "order_completed",
  "order_placed",
  "transaction",
  "payment",
  "airtime_purchase",
  "offer_redeemed",
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
  "offer_accepted",
  "app_login",
  "ussd_session",
  "data_usage",
  "voice_call",
  "customer_sms",
]);

export type DraftPurchase = {
  transactionId: string;
  productId: number | null;
  productName: string;
  productCode: string;
  productType: string;
  kind: CustomerPurchaseKind;
  amount: number | null;
  currency: string | null;
  quantity: number | null;
  status: CustomerPurchaseStatus;
  purchasedAt: string | null;
  paymentMethod: string | null;
  channel: string | null;
  offerId: number | null;
  offerName: string | null;
  campaignId: number | null;
  campaignName: string | null;
  eventId: string | null;
  evidence: Set<CustomerPurchaseEvidence>;
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

export function unwrapPurchaseList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  const nested = asRecord(record.data);
  const candidates = [
    record.data,
    record.purchases,
    record.transactions,
    record.orders,
    record.items,
    record.results,
    nested?.data,
    nested?.purchases,
    nested?.transactions,
    nested?.orders,
    nested?.items,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function normalizeStatus(value: unknown): CustomerPurchaseStatus {
  const raw = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (
    ["completed", "complete", "success", "successful", "paid", "settled"].includes(
      raw,
    )
  ) {
    return "completed";
  }
  if (["pending", "processing", "queued", "initiated"].includes(raw)) {
    return "pending";
  }
  if (["cancelled", "canceled", "void"].includes(raw)) return "cancelled";
  if (["failed", "error", "declined", "rejected"].includes(raw)) return "failed";
  if (["refunded", "refund", "reversed", "chargeback"].includes(raw)) {
    return "refunded";
  }
  return "completed";
}

export function normalizeKind(
  value: unknown,
  extras?: { productType?: string; eventType?: string; offerId?: number | null },
): CustomerPurchaseKind {
  const raw = String(value || extras?.productType || extras?.eventType || "")
    .trim()
    .toLowerCase();
  if (raw.includes("recharge") || raw.includes("airtime")) return "recharge";
  if (raw.includes("bundle") || raw.includes("combo")) return "bundle";
  if (raw.includes("offer") || extras?.offerId) return "offer";
  if (
    raw.includes("product") ||
    raw.includes("purchase") ||
    raw.includes("order")
  ) {
    return "product";
  }
  return extras?.offerId ? "offer" : "other";
}

export function humanizePurchaseStatus(
  status: CustomerPurchaseStatus | string,
): string {
  const value = normalizeStatus(status);
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function humanizePurchaseKind(kind: CustomerPurchaseKind | string): string {
  const value = String(kind || "other");
  if (value === "recharge") return "Recharge";
  if (value === "bundle") return "Bundle";
  if (value === "offer") return "Offer";
  if (value === "product") return "Product";
  return "Other";
}

export function humanizePaymentMethod(value: string | null | undefined): string {
  if (!value) return "—";
  const raw = value.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (raw === "mpesa" || raw === "m pesa") return "M-Pesa";
  if (raw === "ussd") return "USSD";
  if (raw === "airtime") return "Airtime";
  return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function createDraft(
  extras?: Partial<Omit<DraftPurchase, "evidence">> & {
    evidence?: CustomerPurchaseEvidence[];
  },
): DraftPurchase {
  return {
    transactionId: extras?.transactionId || "",
    productId: extras?.productId ?? null,
    productName: extras?.productName || "",
    productCode: extras?.productCode || "",
    productType: extras?.productType || "",
    kind: extras?.kind || "other",
    amount: extras?.amount ?? null,
    currency: extras?.currency ?? null,
    quantity: extras?.quantity ?? null,
    status: extras?.status || "completed",
    purchasedAt: extras?.purchasedAt ?? null,
    paymentMethod: extras?.paymentMethod ?? null,
    channel: extras?.channel ?? null,
    offerId: extras?.offerId ?? null,
    offerName: extras?.offerName ?? null,
    campaignId: extras?.campaignId ?? null,
    campaignName: extras?.campaignName ?? null,
    eventId: extras?.eventId ?? null,
    evidence: new Set(extras?.evidence || []),
  };
}

function preferText(current: string, incoming: string): string {
  if (!current) return incoming;
  if (!incoming) return current;
  if (incoming.length > current.length) return incoming;
  return current;
}

export function mergeDraft(
  target: DraftPurchase,
  source: DraftPurchase,
): DraftPurchase {
  source.evidence.forEach((item) => target.evidence.add(item));
  target.transactionId = target.transactionId || source.transactionId;
  target.productId = target.productId ?? source.productId;
  target.productName = preferText(target.productName, source.productName);
  target.productCode = target.productCode || source.productCode;
  target.productType = target.productType || source.productType;
  if (target.kind === "other" && source.kind !== "other") target.kind = source.kind;
  target.amount = target.amount ?? source.amount;
  target.currency = target.currency || source.currency;
  target.quantity = target.quantity ?? source.quantity;
  if (source.status === "failed" || source.status === "refunded") {
    target.status = source.status;
  } else if (target.status === "pending" && source.status === "completed") {
    target.status = "completed";
  }
  target.purchasedAt = target.purchasedAt || source.purchasedAt;
  target.paymentMethod = target.paymentMethod || source.paymentMethod;
  target.channel = target.channel || source.channel;
  target.offerId = target.offerId ?? source.offerId;
  target.offerName = target.offerName || source.offerName;
  target.campaignId = target.campaignId ?? source.campaignId;
  target.campaignName = target.campaignName || source.campaignName;
  target.eventId = target.eventId || source.eventId;
  return target;
}

export function draftKey(draft: DraftPurchase): string {
  if (draft.transactionId) return `txn-${draft.transactionId.toLowerCase()}`;
  if (draft.eventId) return `event-${draft.eventId}`;
  const stamp = draft.purchasedAt || "";
  const product = draft.productId || draft.productName.toLowerCase();
  return `buy-${product}-${stamp}-${draft.amount ?? ""}`;
}

export function findExistingKey(
  byKey: Map<string, DraftPurchase>,
  draft: DraftPurchase,
): string | null {
  const canonical = draftKey(draft);
  if (byKey.has(canonical)) return canonical;
  for (const [key, item] of byKey) {
    if (draft.transactionId && item.transactionId === draft.transactionId) {
      return key;
    }
    if (draft.eventId && item.eventId === draft.eventId) return key;
  }
  return null;
}

export function parsePurchaseRecord(
  item: unknown,
  extras?: { evidence?: CustomerPurchaseEvidence },
): DraftPurchase | null {
  if (typeof item === "string" && item.trim()) {
    return createDraft({
      productName: item.trim(),
      kind: "other",
      evidence: extras?.evidence ? [extras.evidence] : [],
    });
  }

  const row = asRecord(item);
  if (!row) return null;
  const product =
    asRecord(row.product) || asRecord(row.bundle) || asRecord(row.item);
  const offer = asRecord(row.offer);
  const campaign = asRecord(row.campaign);

  const productId =
    numericId(row.product_id ?? row.productId) ??
    numericId(product?.id ?? product?.product_id);
  const productName =
    stringOrNull(
      row.product ??
        row.product_name ??
        row.productName ??
        row.bundle ??
        row.bundle_name ??
        row.name ??
        row.title ??
        product?.name,
    ) || "";
  const offerId =
    numericId(row.offer_id ?? row.offerId) ?? numericId(offer?.id);
  const amount = numberOrNull(
    row.amount ??
      row.paid_amount ??
      row.purchase_amount ??
      row.transaction_amount ??
      row.total ??
      row.value ??
      row.price,
  );
  const purchasedAt =
    stringOrNull(
      row.purchased_at ??
        row.purchasedAt ??
        row.transaction_date ??
        row.order_date ??
        row.date ??
        row.occurred_at,
    ) ?? extractAddedAt(row);
  const transactionId =
    stringOrNull(
      row.transaction_id ??
        row.transactionId ??
        row.txn_id ??
        row.reference ??
        row.order_id ??
        row.orderId ??
        row.id,
    ) || "";

  if (!productName && !productId && !offerId && amount == null && !transactionId) {
    return null;
  }

  const eventType = stringOrNull(row.event_type ?? row.type) || "";
  const kind = normalizeKind(row.kind ?? row.purchase_type ?? row.category, {
    productType:
      stringOrNull(row.product_type ?? product?.product_type_label) || "",
    eventType,
    offerId,
  });

  return createDraft({
    transactionId,
    productId,
    productName:
      productName || (offerId ? `Offer #${offerId}` : "Unknown product"),
    productCode:
      stringOrNull(row.product_code ?? product?.product_code ?? product?.code) ||
      "",
    productType:
      stringOrNull(
        row.product_type ??
          row.product_type_label ??
          product?.product_type_label ??
          product?.offer_category,
      ) || "",
    kind,
    amount,
    currency: stringOrNull(row.currency ?? product?.currency),
    quantity: numberOrNull(row.quantity ?? row.qty),
    status: normalizeStatus(row.status ?? row.purchase_status),
    purchasedAt,
    paymentMethod: stringOrNull(
      row.payment_method ?? row.paymentMethod ?? row.payment_type,
    ),
    channel: stringOrNull(row.channel ?? row.purchase_channel),
    offerId,
    offerName: stringOrNull(row.offer_name ?? offer?.name),
    campaignId:
      numericId(row.campaign_id ?? row.campaignId) ?? numericId(campaign?.id),
    campaignName: stringOrNull(row.campaign_name ?? campaign?.name),
    eventId: stringOrNull(row.event_id ?? row.eventId),
    evidence: extras?.evidence ? [extras.evidence] : [],
  });
}

export function parseHintPurchases(
  record: Record<string, unknown> | null | undefined,
): DraftPurchase[] {
  if (!record) return [];
  return unwrapPurchaseList(
    record.purchases ??
      record.purchase_history ??
      record.transactions ??
      record.orders,
  )
    .map((item) => parsePurchaseRecord(item, { evidence: "profile_hint" }))
    .filter((item): item is DraftPurchase => Boolean(item));
}

export function isPurchaseEvent(event: CustomerEvent): boolean {
  const type = event.event_type.toLowerCase();
  if (EXCLUDED_EVENT_TYPES.has(type)) return false;
  if (PURCHASE_EVENT_TYPES.has(type)) return true;
  return /purchase|recharge|transaction|payment/.test(type);
}

function kindFromEvent(event: CustomerEvent): CustomerPurchaseKind {
  const type = event.event_type.toLowerCase();
  if (type.includes("recharge")) return "recharge";
  if (type.includes("bundle")) return "bundle";
  if (type.includes("offer_redeem")) return "offer";
  if (event.offer?.id) return "offer";
  return "product";
}

export function eventToDraft(event: CustomerEvent): DraftPurchase | null {
  if (!isPurchaseEvent(event)) return null;
  const purchase = event.purchase;
  const kind = kindFromEvent(event);
  const productName =
    purchase?.product_name ||
    event.offer?.name ||
    event.event_type_label ||
    event.description ||
    "Purchase";

  return createDraft({
    transactionId: purchase?.transaction_id || "",
    productId: purchase?.product_id ?? null,
    productName,
    productCode: purchase?.product_code || "",
    productType: event.offer?.type || "",
    kind,
    amount: purchase?.amount ?? null,
    currency: purchase?.currency ?? null,
    quantity: purchase?.quantity ?? null,
    status: normalizeStatus(event.status),
    purchasedAt: event.occurred_at,
    paymentMethod: purchase?.payment_method ?? null,
    channel: event.channel,
    offerId: event.offer?.id ?? null,
    offerName: event.offer?.name || null,
    campaignId: event.campaign?.id ?? null,
    campaignName: event.campaign?.name || null,
    eventId: event.id,
    evidence: ["event"],
  });
}

export function applyProductCatalog(
  draft: DraftPurchase,
  product: Product,
): DraftPurchase {
  draft.productId = product.id;
  draft.productName = product.name || draft.productName;
  draft.productCode = product.product_code || draft.productCode;
  draft.productType =
    String(product.product_type_label || product.offer_category || "") ||
    draft.productType;
  if (!draft.currency && product.currency) draft.currency = product.currency;
  if (draft.kind === "other") {
    draft.kind = normalizeKind(
      product.offer_category || product.product_type_label,
      {
        productType: String(product.product_type_label || ""),
        offerId: draft.offerId,
      },
    );
  }
  return draft;
}

export function applyOfferCatalog(
  draft: DraftPurchase,
  offer: Offer,
): DraftPurchase {
  draft.offerId = offer.id;
  draft.offerName = offer.name || draft.offerName;
  if (!draft.productName || draft.productName.startsWith("Offer #")) {
    draft.productName = offer.name || draft.productName;
  }
  if (draft.kind === "other") draft.kind = "offer";
  return draft;
}

export function finalizePurchase(draft: DraftPurchase): CustomerPurchaseItem {
  const verification: CustomerPurchaseVerification =
    draft.evidence.has("subscriber_api") || draft.evidence.has("event")
      ? "verified"
      : "hint";

  return {
    id: draftKey(draft),
    transactionId: draft.transactionId || draft.eventId || draftKey(draft),
    productId: draft.productId,
    productName: draft.productName || "Unknown product",
    productCode: draft.productCode,
    productType: draft.productType,
    kind: draft.kind,
    amount: draft.amount,
    currency: draft.currency,
    quantity: draft.quantity,
    status: draft.status,
    purchasedAt: draft.purchasedAt,
    paymentMethod: draft.paymentMethod,
    channel: draft.channel,
    offerId: draft.offerId,
    offerName: draft.offerName,
    campaignId: draft.campaignId,
    campaignName: draft.campaignName,
    eventId: draft.eventId,
    evidence: Array.from(draft.evidence),
    verification,
  };
}

export function sortPurchases(
  items: CustomerPurchaseItem[],
): CustomerPurchaseItem[] {
  return [...items].sort((a, b) => {
    const aTime = Date.parse(a.purchasedAt || "") || 0;
    const bTime = Date.parse(b.purchasedAt || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.productName.localeCompare(b.productName);
  });
}

export function countPurchases(
  items: CustomerPurchaseItem[],
): CustomerPurchaseCounts {
  return items.reduce(
    (counts, item) => {
      counts.total += 1;
      if (item.status === "completed") counts.completed += 1;
      else if (item.status === "pending") counts.pending += 1;
      else if (item.status === "failed" || item.status === "cancelled") {
        counts.failed += 1;
      }
      if (item.status === "completed" && item.amount != null) {
        counts.totalSpend += item.amount;
      }
      return counts;
    },
    { ...EMPTY_PURCHASE_COUNTS },
  );
}

export function uniquePurchaseStatuses(
  items: CustomerPurchaseItem[],
): CustomerPurchaseStatus[] {
  const present = new Set(items.map((item) => item.status));
  return (
    [
      "completed",
      "pending",
      "cancelled",
      "failed",
      "refunded",
    ] as CustomerPurchaseStatus[]
  ).filter((status) => present.has(status));
}

export function uniquePurchaseKinds(
  items: CustomerPurchaseItem[],
): CustomerPurchaseKind[] {
  return Array.from(new Set(items.map((item) => item.kind))).sort();
}

export function filterPurchases(
  items: CustomerPurchaseItem[],
  query: { search?: string; status?: string; kind?: string },
): CustomerPurchaseItem[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const status = query.status && query.status !== "all" ? query.status : "";
  const kind = query.kind && query.kind !== "all" ? query.kind : "";

  return items.filter((item) => {
    if (status && item.status !== status) return false;
    if (kind && item.kind !== kind) return false;
    if (!search) return true;
    return (
      item.transactionId.toLowerCase().includes(search) ||
      item.productName.toLowerCase().includes(search) ||
      item.productCode.toLowerCase().includes(search) ||
      (item.offerName || "").toLowerCase().includes(search) ||
      (item.campaignName || "").toLowerCase().includes(search) ||
      (item.paymentMethod || "").toLowerCase().includes(search)
    );
  });
}

export function latestPurchasedAt(
  items: CustomerPurchaseItem[],
): string | null {
  return items.reduce<string | null>((latest, item) => {
    if (!item.purchasedAt) return latest;
    if (!latest) return item.purchasedAt;
    return Date.parse(item.purchasedAt) >= Date.parse(latest)
      ? item.purchasedAt
      : latest;
  }, null);
}
