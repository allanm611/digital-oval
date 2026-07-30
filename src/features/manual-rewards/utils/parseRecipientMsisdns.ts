import { validateMSISDN } from "../../../shared/utils/validation";
import type { ManualRewardData } from "../pages/CreateManualRewardPage";

export function normalizeMsisdnDigits(input: string): string {
  return input.replace(/\D/g, "");
}

/** Extract unique, validated MSISDNs from manual entry (phones only; emails are ignored). */
export function parseRecipientMsisdns(data: ManualRewardData): string[] {
  if (data.inputMethod !== "manual" || !data.audienceFileText?.trim()) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const line of data.audienceFileText.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.includes("@")) {
      continue;
    }
    const digits = normalizeMsisdnDigits(trimmed);
    if (!digits) {
      continue;
    }
    const { valid } = validateMSISDN(digits);
    if (!valid || seen.has(digits)) {
      continue;
    }
    seen.add(digits);
    result.push(digits);
  }

  return result;
}
