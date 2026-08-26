import { API_CONFIG, getAuthHeaders } from "../../../shared/services/api";
import { quicklistService } from "../../quicklists/services/quicklistService";
import type { QuickListWithDetails } from "../../quicklists/types/quicklist";
import type {
  CustomerListIdentifiers,
  CustomerSubscribedList,
  CustomerSubscribedListProgress,
  CustomerSubscribedListResult,
} from "../types/customerSubscribedList";
import {
  collectCustomerIdentifiers,
  extractAddedAt,
  extractMemberStatus,
  hasAnyIdentifier,
  identifierCount,
  mapWithConcurrency,
  matchMemberRecord,
  parseHintQuicklists,
  parsePayloadSubscriptions,
  sortMemberships,
} from "../utils/customerSubscribedListHelpers";

const MEMBER_PAGE_SIZE = 100;
const MEMBER_SCAN_CAP = 300;
const CHECK_CONCURRENCY = 5;
const MAX_QUICKLISTS = 2000;
const CACHE_TTL_MS = 60_000;

type MemberRecord = Record<string, unknown>;

type MemberPage = {
  members: MemberRecord[];
  total: number;
  filterIgnored: boolean;
};

const RESULT_CACHE = new Map<
  string,
  { expires: number; result: CustomerSubscribedListResult }
>();

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function unwrapMembers(payload: unknown): { members: MemberRecord[]; total: number } {
  if (!payload || typeof payload !== "object") {
    return { members: [], total: 0 };
  }
  const record = payload as Record<string, unknown>;
  const nested =
    record.data && typeof record.data === "object" && !Array.isArray(record.data)
      ? (record.data as Record<string, unknown>)
      : record;
  const raw = Array.isArray(record.data)
    ? record.data
    : Array.isArray(nested.members)
      ? nested.members
      : Array.isArray(nested.data)
        ? nested.data
        : [];
  const pagination =
    (record.pagination as { total?: number } | undefined) ??
    (nested.pagination as { total?: number } | undefined);
  const total =
    (typeof record.total === "number" && record.total) ||
    pagination?.total ||
    raw.length;
  return {
    members: raw.filter(
      (item): item is MemberRecord => Boolean(item) && typeof item === "object",
    ),
    total,
  };
}

function cacheKey(subscriberId: string, identifiers: CustomerListIdentifiers): string {
  return [
    subscriberId,
    identifiers.msisdns.join(","),
    identifiers.emails.join(","),
    identifiers.ids.join(","),
  ].join("|");
}

async function fetchMemberPage(
  quicklistId: number,
  params: {
    limit: number;
    offset: number;
    identifier?: string;
    identifier_type?: "msisdn" | "email" | "id";
  },
  identifiers: CustomerListIdentifiers,
): Promise<MemberPage> {
  const response = await quicklistService.getMembers(quicklistId, {
    ...params,
    skipCache: true,
  });
  const { members, total } = unwrapMembers(response);
  const paginationTotal =
    typeof response.total === "number"
      ? response.total
      : response.pagination?.total ?? total;
  const filterIgnored =
    Boolean(params.identifier) &&
    members.length > 0 &&
    members.every((member) => !matchMemberRecord(member, identifiers));

  return {
    members,
    total: paginationTotal,
    filterIgnored,
  };
}

async function findMemberInQuickList(
  quicklist: QuickListWithDetails,
  identifiers: CustomerListIdentifiers,
  isAborted?: () => boolean,
): Promise<MemberRecord | null> {
  const probes: Array<{ identifier: string; identifier_type: "msisdn" | "email" | "id" }> =
    [];
  if (identifiers.msisdns[0]) {
    probes.push({ identifier: identifiers.msisdns[0], identifier_type: "msisdn" });
  }
  if (identifiers.emails[0]) {
    probes.push({ identifier: identifiers.emails[0], identifier_type: "email" });
  }
  if (identifiers.ids[0]) {
    probes.push({ identifier: identifiers.ids[0], identifier_type: "id" });
  }

  let membersApiFailed = probes.length === 0;
  let scanFromOffset = 0;
  let knownTotal = Number(quicklist.rows_imported) || 0;

  for (const probe of probes) {
    if (isAborted?.()) throw new DOMException("Aborted", "AbortError");
    try {
      const page = await fetchMemberPage(
        quicklist.id,
        {
          limit: MEMBER_PAGE_SIZE,
          offset: 0,
          identifier: probe.identifier,
          identifier_type: probe.identifier_type,
        },
        identifiers,
      );
      knownTotal = Math.max(knownTotal, page.total);
      const matched = page.members.find((member) =>
        matchMemberRecord(member, identifiers),
      );
      if (matched) return matched;
      if (page.filterIgnored) {
        membersApiFailed = false;
        scanFromOffset = page.members.length;
        knownTotal = Math.max(knownTotal, page.total);
        break;
      }
      membersApiFailed = false;
    } catch {
      membersApiFailed = true;
    }
  }

  if (scanFromOffset > 0 || membersApiFailed) {
    let offset = scanFromOffset;
    const scanLimit = Math.min(knownTotal || MEMBER_SCAN_CAP, MEMBER_SCAN_CAP);
    while (offset < scanLimit) {
      if (isAborted?.()) throw new DOMException("Aborted", "AbortError");
      try {
        const page = await fetchMemberPage(
          quicklist.id,
          { limit: MEMBER_PAGE_SIZE, offset },
          identifiers,
        );
        knownTotal = Math.max(knownTotal, page.total);
        const matched = page.members.find((member) =>
          matchMemberRecord(member, identifiers),
        );
        if (matched) return matched;
        if (page.members.length === 0) break;
        offset += page.members.length;
        if (page.members.length < MEMBER_PAGE_SIZE) break;
      } catch {
        membersApiFailed = true;
        break;
      }
    }
  }

  if (membersApiFailed) {
    return findMemberInQuickListData(quicklist, identifiers, isAborted);
  }
  return null;
}

async function findMemberInQuickListData(
  quicklist: QuickListWithDetails,
  identifiers: CustomerListIdentifiers,
  isAborted?: () => boolean,
): Promise<MemberRecord | null> {
  const imported = Number(quicklist.rows_imported) || 0;
  if (imported > MEMBER_SCAN_CAP) return null;

  let offset = 0;
  while (offset < MEMBER_SCAN_CAP) {
    if (isAborted?.()) throw new DOMException("Aborted", "AbortError");
    try {
      const response = await quicklistService.getQuickListData(quicklist.id, {
        limit: MEMBER_PAGE_SIZE,
        offset,
        skipCache: true,
      });
      if (!("success" in response) || !response.success) break;
      const rows = Array.isArray(response.data) ? response.data : [];
      for (const row of rows) {
        if (row && typeof row === "object") {
          const record = row as MemberRecord;
          if (matchMemberRecord(record, identifiers)) return record;
          const values = Object.values(record);
          if (
            values.some((value) => matchMemberRecord({ identifier: value }, identifiers))
          ) {
            return record;
          }
        }
      }
      if (rows.length < MEMBER_PAGE_SIZE) break;
      offset += rows.length;
    } catch {
      break;
    }
  }
  return null;
}

function toQuickListMembership(
  quicklist: QuickListWithDetails,
  member: MemberRecord | null,
  identifiers: CustomerListIdentifiers,
  verification: CustomerSubscribedList["verification"],
): CustomerSubscribedList {
  const match = member ? matchMemberRecord(member, identifiers) : null;

  return {
    id: `quicklist-${quicklist.id}`,
    listId: quicklist.id,
    name: quicklist.name || `QuickList ${quicklist.id}`,
    description: quicklist.description || "",
    listType: "quicklist",
    addedAt: member ? extractAddedAt(member) : null,
    status: member ? extractMemberStatus(member) : "active",
    matchedIdentifier: match?.identifier ?? null,
    matchedIdentifierType: match?.type ?? null,
    totalMembers:
      typeof quicklist.rows_imported === "number" ? quicklist.rows_imported : null,
    verification,
  };
}

async function trySubscriberScopedLists(
  subscriberId: string,
): Promise<CustomerSubscribedList[]> {
  const paths = [
    `${API_CONFIG.BASE_URL}/subscribers/${encodeURIComponent(subscriberId)}/quicklists`,
    `${API_CONFIG.BASE_URL}/subscribers/${encodeURIComponent(subscriberId)}/lists`,
  ];

  for (const url of paths) {
    try {
      const response = await fetch(url, { headers: getAuthHeaders() });
      if (!response.ok) continue;
      const payload = await response.json();
      const record =
        payload && typeof payload === "object"
          ? (payload as Record<string, unknown>)
          : {};
      if (record.success === false) continue;
      const parsed = parsePayloadSubscriptions(record).concat(
        parseHintQuicklists(record).map((item) => ({
          id: `quicklist-${item.id}`,
          listId: item.id,
          name: item.name,
          description: item.description || "",
          listType: "quicklist" as const,
          addedAt: null,
          status: "active",
          matchedIdentifier: null,
          matchedIdentifierType: null,
          totalMembers: null,
          verification: "hint" as const,
        })),
      );
      if (parsed.length > 0) return parsed;
      if (Array.isArray(record.data)) {
        return parsePayloadSubscriptions({ lists: record.data });
      }
    } catch {
      // Optional shortcut — the full-system check is the source of truth.
    }
  }
  return [];
}

export type LoadSubscribedListsInput = {
  subscriberId: string | number;
  customerRecord?: Record<string, unknown> | null;
  onProgress?: (progress: CustomerSubscribedListProgress) => void;
  isAborted?: () => boolean;
  skipCache?: boolean;
};

export const customerSubscribedListService = {
  async getSubscribedLists(
    input: LoadSubscribedListsInput,
  ): Promise<CustomerSubscribedListResult> {
    const subscriberId = String(input.subscriberId ?? "").trim();
    const identifiers = collectCustomerIdentifiers(
      input.customerRecord,
      subscriberId,
    );
    const warnings: string[] = [];

    if (!subscriberId) {
      return {
        memberships: [],
        systemQuickListCount: 0,
        checkedCount: 0,
        failedCheckCount: 0,
        identifierCount: 0,
        source: "live",
        warnings: ["No customer selected."],
      };
    }

    if (!hasAnyIdentifier(identifiers)) {
      return {
        memberships: [],
        systemQuickListCount: 0,
        checkedCount: 0,
        failedCheckCount: 0,
        identifierCount: 0,
        source: "live",
        warnings: [
          "This customer has no phone number, email, or ID to match against lists.",
        ],
      };
    }

    const key = cacheKey(subscriberId, identifiers);
    const cached = input.skipCache ? undefined : RESULT_CACHE.get(key);
    if (cached && cached.expires > Date.now()) {
      input.onProgress?.({
        checked: cached.result.checkedCount,
        total: cached.result.systemQuickListCount,
      });
      return cached.result;
    }

    const [systemQuickLists, scopedLists] = await Promise.all([
      quicklistService.listAllQuickLists({
        pageSize: 100,
        maxLists: MAX_QUICKLISTS,
        isAborted: input.isAborted,
      }),
      trySubscriberScopedLists(subscriberId),
    ]);

    input.onProgress?.({ checked: 0, total: systemQuickLists.length });

    const hintById = new Map<number, CustomerSubscribedList>();
    parseHintQuicklists(input.customerRecord).forEach((item) => {
      hintById.set(item.id, {
        id: `quicklist-${item.id}`,
        listId: item.id,
        name: item.name,
        description: item.description || "",
        listType: "quicklist",
        addedAt: null,
        status: "active",
        matchedIdentifier: null,
        matchedIdentifierType: null,
        totalMembers: null,
        verification: "hint",
      });
    });
    scopedLists
      .filter((item) => item.listType === "quicklist")
      .forEach((item) => {
        const numericId = Number(item.listId);
        if (Number.isFinite(numericId) && !hintById.has(numericId)) {
          hintById.set(numericId, item);
        }
      });

    let checkedCount = 0;
    let failedCheckCount = 0;
    const memberships: CustomerSubscribedList[] = [];

    const checks = await mapWithConcurrency(
      systemQuickLists,
      CHECK_CONCURRENCY,
      async (quicklist) => {
        try {
          const member = await findMemberInQuickList(
            quicklist,
            identifiers,
            input.isAborted,
          );
          return { quicklist, member, failed: false as const };
        } catch (error) {
          if (isAbortError(error)) throw error;
          return { quicklist, member: null, failed: true as const };
        } finally {
          checkedCount += 1;
          input.onProgress?.({
            checked: checkedCount,
            total: systemQuickLists.length,
          });
        }
      },
      input.isAborted,
    );

    const verifiedIds = new Set<number>();
    for (const check of checks) {
      if (check.failed) {
        failedCheckCount += 1;
        const hint = hintById.get(check.quicklist.id);
        if (hint) {
          memberships.push({
            ...hint,
            name: check.quicklist.name || hint.name,
            description: check.quicklist.description || hint.description,
            totalMembers:
              typeof check.quicklist.rows_imported === "number"
                ? check.quicklist.rows_imported
                : hint.totalMembers,
          });
          verifiedIds.add(check.quicklist.id);
        }
        continue;
      }
      if (!check.member) continue;
      memberships.push(
        toQuickListMembership(
          check.quicklist,
          check.member,
          identifiers,
          "verified",
        ),
      );
      verifiedIds.add(check.quicklist.id);
    }

    const successfullyCheckedIds = new Set(
      checks.filter((check) => !check.failed).map((check) => check.quicklist.id),
    );
    hintById.forEach((hint, id) => {
      if (verifiedIds.has(id) || successfullyCheckedIds.has(id)) return;
      const listed = systemQuickLists.find((item) => item.id === id);
      memberships.push({
        ...hint,
        name: listed?.name || hint.name,
        description: listed?.description || hint.description,
        totalMembers:
          typeof listed?.rows_imported === "number"
            ? listed.rows_imported
            : hint.totalMembers,
      });
    });

    parsePayloadSubscriptions(input.customerRecord)
      .concat(scopedLists.filter((item) => item.listType === "subscription"))
      .forEach((subscription) => {
        if (!memberships.some((item) => item.id === subscription.id)) {
          memberships.push(subscription);
        }
      });

    if (systemQuickLists.length >= MAX_QUICKLISTS) {
      warnings.push(
        `Stopped after checking ${MAX_QUICKLISTS.toLocaleString()} QuickLists. Remaining lists were not evaluated.`,
      );
    }
    if (failedCheckCount > 0) {
      warnings.push(
        `Membership could not be verified for ${failedCheckCount} QuickList${failedCheckCount === 1 ? "" : "s"}.`,
      );
    }

    const result: CustomerSubscribedListResult = {
      memberships: sortMemberships(memberships),
      systemQuickListCount: systemQuickLists.length,
      checkedCount: systemQuickLists.length,
      failedCheckCount,
      identifierCount: identifierCount(identifiers),
      source: failedCheckCount > 0 ? "partial" : "live",
      warnings,
    };

    RESULT_CACHE.set(key, { expires: Date.now() + CACHE_TTL_MS, result });
    return result;
  },
};

export default customerSubscribedListService;
