import { quicklistService } from "../../quicklists/services/quicklistService";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function asMsisdn(value: unknown, typeHint?: string): string | undefined {
  if (value == null) return undefined;
  const text = String(value).trim();
  if (!text || text.includes("@")) return undefined;
  if ((typeHint || "").toLowerCase() === "email") return undefined;
  const digits = digitsOnly(text);
  if (digits.length < 8 || digits.length > 15) return undefined;
  return digits;
}

function fromRowData(rowData: unknown): string | undefined {
  let data = rowData;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return undefined;
    }
  }
  if (!data || typeof data !== "object") return undefined;
  const entries = Object.entries(data as Record<string, unknown>);
  const preferred = entries.find(([key]) => /msisdn|phone|mobile/i.test(key));
  if (preferred) return asMsisdn(preferred[1], "msisdn");
  for (const [, value] of entries) {
    const msisdn = asMsisdn(value);
    if (msisdn) return msisdn;
  }
  return undefined;
}

export function extractMsisdnFromQuicklistRow(
  row: Record<string, unknown>,
): string | undefined {
  const direct =
    asMsisdn(row.msisdn ?? row.MSISDN ?? row.phone ?? row.mobile, "msisdn") ||
    asMsisdn(
      row.identifier,
      String(row.identifier_type ?? row.identifierType ?? ""),
    );
  if (direct) return direct;
  return fromRowData(row.row_data);
}

/**
 * Load subscriber MSISDNs from a quicklist.
 * Rows are stored as identifier + identifier_type (and row_data), not a msisdn column.
 */
export async function loadQuicklistSubscriberMsisdns(
  quicklistId: number,
): Promise<string[]> {
  const detail = await quicklistService.getQuickListById(quicklistId, true);
  if (!detail.success || !("data" in detail) || !detail.data) {
    throw new Error(
      `Audience is empty or could not be loaded. audience_type="quicklist". Make sure quicklist_id ${quicklistId} exists and has subscriber data.`,
    );
  }
  const quicklist = detail.data;
  const status = String(quicklist?.processing_status || "").toLowerCase();

  if (status === "pending" || status === "processing") {
    throw new Error(
      `Quicklist ${quicklistId} is still importing. Wait until subscriber rows are available, then create the reward again.`,
    );
  }

  const imported = Number(quicklist?.rows_imported ?? 0);
  if (!Number.isFinite(imported) || imported <= 0) {
    throw new Error(
      `Audience is empty or could not be loaded. audience_type="quicklist". Make sure quicklist_id ${quicklistId} exists and has subscriber data.`,
    );
  }

  const maxRows = 5000;
  if (imported > maxRows) {
    throw new Error(
      `Quicklist ${quicklistId} has ${imported.toLocaleString()} rows. Grant it in smaller lists, or update the reward service to read the quicklist identifier column.`,
    );
  }

  const seen = new Set<string>();
  const limit = 500;
  let offset = 0;

  while (offset < imported) {
    const dataResponse = await quicklistService.getQuickListData(quicklistId, {
      limit,
      offset,
    });
    if (!dataResponse.success || !("data" in dataResponse)) {
      throw new Error(
        `Audience is empty or could not be loaded. audience_type="quicklist". Make sure quicklist_id ${quicklistId} exists and has subscriber data.`,
      );
    }
    const rows = (dataResponse.data || []) as Array<Record<string, unknown>>;
    if (rows.length === 0) break;
    for (const row of rows) {
      const msisdn = extractMsisdnFromQuicklistRow(row);
      if (msisdn) seen.add(msisdn);
    }
    offset += rows.length;
    if (rows.length < limit) break;
  }

  if (seen.size === 0) {
    throw new Error(
      `Quicklist ${quicklistId} has imported rows, but none contain a subscriber MSISDN. Use a phone/MSISDN column, then select the list again.`,
    );
  }

  return Array.from(seen);
}
