import type {
  CustomerIdentifierKind,
  CustomerListIdentifiers,
  CustomerSubscribedList,
} from "../types/customerSubscribedList";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeIdentifier(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeMsisdn(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

function pushUnique(target: string[], value: string) {
  if (value && !target.includes(value)) {
    target.push(value);
  }
}

function addMsisdn(target: string[], value: unknown) {
  const digits = normalizeMsisdn(value);
  if (digits.length >= 7) {
    pushUnique(target, digits);
  }
}

function addEmail(target: string[], value: unknown) {
  const email = normalizeIdentifier(value);
  if (EMAIL_RE.test(email)) {
    pushUnique(target, email);
  }
}

function addId(target: string[], value: unknown) {
  if (value === null || value === undefined || value === "") return;
  pushUnique(target, String(value).trim());
}

function flattenUnknownValues(value: unknown): unknown[] {
  if (value == null || value === "") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenUnknownValues(item));
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        return flattenUnknownValues(JSON.parse(trimmed));
      } catch {
        // Treat as a delimited string below.
      }
    }
    return trimmed.split(/[,;|\s]+/).filter(Boolean);
  }
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(
      flattenUnknownValues,
    );
  }
  return [value];
}

export function collectCustomerIdentifiers(
  record: Record<string, unknown> | null | undefined,
  subscriberId?: string | number | null,
): CustomerListIdentifiers {
  const msisdns: string[] = [];
  const emails: string[] = [];
  const ids: string[] = [];

  if (record) {
    addMsisdn(msisdns, record.msisdn);
    addMsisdn(msisdns, record.phone);
    flattenUnknownValues(record.alternate_msisdns).forEach((item) =>
      addMsisdn(msisdns, item),
    );
    flattenUnknownValues(record.alternatemsisdns).forEach((item) =>
      addMsisdn(msisdns, item),
    );

    addEmail(emails, record.email);
    addEmail(emails, record.email_address);
    addEmail(emails, record.alternate_email);
    addEmail(emails, record.alternateEmail);

    addId(ids, record.customerId);
    addId(ids, record.customer_id);
    addId(ids, record.subscriptionId);
    addId(ids, record.subscription_id);
    addId(ids, record.subscriber_id);
    addId(ids, record.id);
  }

  addId(ids, subscriberId);

  return { msisdns, emails, ids };
}

export function hasAnyIdentifier(identifiers: CustomerListIdentifiers): boolean {
  return (
    identifiers.msisdns.length > 0 ||
    identifiers.emails.length > 0 ||
    identifiers.ids.length > 0
  );
}

export function identifierCount(identifiers: CustomerListIdentifiers): number {
  return (
    identifiers.msisdns.length +
    identifiers.emails.length +
    identifiers.ids.length
  );
}

export function identifiersMatch(
  candidate: unknown,
  identifiers: CustomerListIdentifiers,
): CustomerIdentifierKind | null {
  const raw = normalizeIdentifier(candidate);
  if (!raw) return null;

  if (identifiers.emails.includes(raw)) return "email";
  if (identifiers.ids.includes(String(candidate).trim())) return "id";
  if (identifiers.ids.includes(raw)) return "id";

  const digits = normalizeMsisdn(candidate);
  if (digits.length >= 7) {
    if (identifiers.msisdns.includes(digits)) return "msisdn";
    const suffix = digits.slice(-9);
    if (
      suffix.length === 9 &&
      identifiers.msisdns.some((known) => known.slice(-9) === suffix)
    ) {
      return "msisdn";
    }
  }

  return null;
}

export function extractMemberValues(
  member: Record<string, unknown>,
): Array<{ value: unknown; typeHint?: CustomerIdentifierKind }> {
  const values: Array<{ value: unknown; typeHint?: CustomerIdentifierKind }> = [
    { value: member.identifier, typeHint: member.identifier_type as CustomerIdentifierKind },
    { value: member.subscriber_msisdn, typeHint: "msisdn" },
    { value: member.msisdn, typeHint: "msisdn" },
    { value: member.phone, typeHint: "msisdn" },
    { value: member.subscriber_email, typeHint: "email" },
    { value: member.email, typeHint: "email" },
    { value: member.email_address, typeHint: "email" },
    { value: member.subscriber_id, typeHint: "id" },
    { value: member.subscriberId, typeHint: "id" },
    { value: member.customer_id, typeHint: "id" },
    { value: member.customerId, typeHint: "id" },
  ];

  const rowData = member.row_data;
  if (rowData && typeof rowData === "object") {
    Object.entries(rowData as Record<string, unknown>).forEach(([key, value]) => {
      const lower = key.toLowerCase();
      const typeHint: CustomerIdentifierKind | undefined = lower.includes("mail")
        ? "email"
        : lower.includes("msisdn") || lower.includes("phone") || lower.includes("mobile")
          ? "msisdn"
          : undefined;
      values.push({ value, typeHint });
    });
  }

  return values;
}

export function matchMemberRecord(
  member: Record<string, unknown>,
  identifiers: CustomerListIdentifiers,
): { identifier: string; type: CustomerIdentifierKind } | null {
  for (const entry of extractMemberValues(member)) {
    const kind = identifiersMatch(entry.value, identifiers);
    if (!kind) continue;
    return {
      identifier: String(entry.value ?? "").trim(),
      type: entry.typeHint && kind === entry.typeHint ? entry.typeHint : kind,
    };
  }
  return null;
}

export function extractAddedAt(record: Record<string, unknown>): string | null {
  const candidates = [
    record.added_at,
    record.addedAt,
    record.joined_at,
    record.subscribed_at,
    record.subscribedDate,
    record.created_at,
    record.createdAt,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) return value;
    }
  }
  return null;
}

export function extractMemberStatus(record: Record<string, unknown>): string {
  const raw = record.status ?? record.membership_status ?? record.member_status;
  if (typeof raw === "string" && raw.trim()) return raw.trim().toLowerCase();
  return "active";
}

export function humanizeListStatus(status: string): string {
  if (!status) return "Active";
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeIdentifierType(type: CustomerIdentifierKind | null): string {
  if (type === "msisdn") return "Phone";
  if (type === "email") return "Email";
  if (type === "id") return "ID";
  return "—";
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
  isAborted?: () => boolean,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results: R[] = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));

  const worker = async () => {
    while (nextIndex < items.length) {
      if (isAborted?.()) {
        throw new DOMException("Aborted", "AbortError");
      }
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export function sortMemberships(
  memberships: CustomerSubscribedList[],
): CustomerSubscribedList[] {
  return [...memberships].sort((a, b) => {
    const aTime = a.addedAt ? new Date(a.addedAt).getTime() : 0;
    const bTime = b.addedAt ? new Date(b.addedAt).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return a.name.localeCompare(b.name);
  });
}

export function filterMemberships(
  memberships: CustomerSubscribedList[],
  query: { search?: string; status?: string; listType?: string },
): CustomerSubscribedList[] {
  const search = query.search?.trim().toLowerCase() ?? "";
  const status = query.status && query.status !== "all" ? query.status : "";
  const listType = query.listType && query.listType !== "all" ? query.listType : "";

  return memberships.filter((item) => {
    if (status && item.status !== status) return false;
    if (listType && item.listType !== listType) return false;
    if (!search) return true;
    return (
      item.name.toLowerCase().includes(search) ||
      item.description.toLowerCase().includes(search) ||
      (item.matchedIdentifier || "").toLowerCase().includes(search)
    );
  });
}

export function uniqueStatuses(memberships: CustomerSubscribedList[]): string[] {
  return Array.from(new Set(memberships.map((item) => item.status))).sort();
}

export function parseHintQuicklists(
  record: Record<string, unknown> | null | undefined,
): Array<{ id: number; name: string; description?: string }> {
  if (!record) return [];
  const raw = record.quicklists;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      if (!Number.isFinite(id)) return null;
      return {
        id,
        name: String(row.name || `QuickList ${id}`),
        description: typeof row.description === "string" ? row.description : "",
      };
    })
    .filter((item): item is { id: number; name: string; description?: string } =>
      Boolean(item),
    );
}

export function parsePayloadSubscriptions(
  record: Record<string, unknown> | null | undefined,
): CustomerSubscribedList[] {
  if (!record) return [];
  const raw =
    record.subscribedLists ??
    record.subscribed_lists ??
    record.subscriptions ??
    record.lists;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => parseSubscriberListMembership(item, index, "hint"))
    .filter((item): item is CustomerSubscribedList => Boolean(item));
}

function unwrapMembershipRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : null;
  const candidates = [
    record.data,
    record.quicklists,
    record.memberships,
    record.lists,
    record.subscribed_lists,
    record.subscribedLists,
    nested?.data,
    nested?.quicklists,
    nested?.memberships,
    nested?.lists,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function parseSubscriberListMembership(
  item: unknown,
  index = 0,
  verification: CustomerSubscribedList["verification"] = "verified",
): CustomerSubscribedList | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const nested =
    row.quicklist && typeof row.quicklist === "object"
      ? (row.quicklist as Record<string, unknown>)
      : row.list && typeof row.list === "object"
        ? (row.list as Record<string, unknown>)
        : {};
  const listId = (row.list_id ??
    row.quicklist_id ??
    row.id ??
    nested.id ??
    `list-${index}`) as number | string;
  const name = String(
    row.name ?? row.list_name ?? nested.name ?? "",
  ).trim();
  if (!name && (listId === undefined || listId === null || listId === "")) {
    return null;
  }

  const listTypeRaw = String(
    row.list_type ?? row.type ?? nested.list_type ?? "quicklist",
  ).toLowerCase();
  const identifier =
    typeof row.identifier === "string"
      ? row.identifier
      : typeof row.subscriber_msisdn === "string"
        ? row.subscriber_msisdn
        : typeof row.msisdn === "string"
          ? row.msisdn
          : typeof row.subscriber_email === "string"
            ? row.subscriber_email
            : null;
  const identifierTypeRaw = String(
    row.identifier_type ?? row.matched_identifier_type ?? "",
  ).toLowerCase();
  const identifierType: CustomerIdentifierKind | null =
    identifierTypeRaw === "msisdn" ||
    identifierTypeRaw === "email" ||
    identifierTypeRaw === "id"
      ? identifierTypeRaw
      : identifier?.includes("@")
        ? "email"
        : identifier
          ? "msisdn"
          : null;
  const totalMembers =
    typeof row.total === "number"
      ? row.total
      : typeof row.total_members === "number"
        ? row.total_members
        : typeof row.rows_imported === "number"
          ? row.rows_imported
          : typeof nested.rows_imported === "number"
            ? nested.rows_imported
            : null;

  return {
    id: `${listTypeRaw === "subscription" ? "subscription" : "quicklist"}-${listId}`,
    listId,
    name: name || `List ${listId}`,
    description: String(row.description ?? nested.description ?? ""),
    listType: listTypeRaw === "subscription" ? "subscription" : "quicklist",
    addedAt: extractAddedAt(row) ?? extractAddedAt(nested),
    status: extractMemberStatus(row),
    matchedIdentifier: identifier,
    matchedIdentifierType: identifierType,
    totalMembers,
    verification,
  };
}

export function parseSubscriberListMemberships(
  payload: unknown,
): CustomerSubscribedList[] {
  return unwrapMembershipRows(payload)
    .map((item, index) => parseSubscriberListMembership(item, index, "verified"))
    .filter((item): item is CustomerSubscribedList => Boolean(item));
}
