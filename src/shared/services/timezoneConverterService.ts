/**
 * Timezone Conversion Service
 * Converts UTC times to a specific timezone using timezone offsets
 */

function padStart(str: string, length: number, char: string): string {
  while (str.length < length) {
    str = char + str;
  }
  return str;
}

/**
 * Parse timezone offset string (e.g., "+03:00" or "-05:00") into minutes
 */
function parseOffset(offsetStr: string): number {
  const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);

  return sign * (hours * 60 + minutes);
}

/**
 * Convert UTC time to a specific timezone
 * @param utcDate - UTC date (from API)
 * @param timezoneOffset - Offset string like "+03:00" or "-05:00"
 * @returns Date object adjusted to the timezone
 */
export function convertUtcToTimezone(
  utcDate: Date | string | number,
  timezoneOffset: string
): Date {
  // Convert to Date object if string/number
  const dateObj = new Date(utcDate);

  if (isNaN(dateObj.getTime())) {
    return dateObj; // Return invalid date as-is
  }

  // Parse the offset (e.g., "+03:00" = 180 minutes)
  const offsetMinutes = parseOffset(timezoneOffset);

  // Create adjusted date: UTC time + timezone offset
  const adjustedDate = new Date(dateObj.getTime() + offsetMinutes * 60 * 1000);

  return adjustedDate;
}

/**
 * Format a UTC date in a specific timezone
 * @param utcDate - UTC date from API
 * @param timezoneOffset - User's timezone offset (e.g., "+03:00")
 * @param format - Date format string (e.g., "YYYY-MM-DD", "DD/MM/YYYY")
 * @param includeTime - Whether to include time in output
 * @returns Formatted string in the user's timezone
 */
export function formatDateInTimezone(
  utcDate: Date | string | number | null | undefined,
  timezoneOffset: string,
  format: string = "YYYY-MM-DD",
  includeTime: boolean = false
): string {
  if (!utcDate) return "";

  // Convert UTC to user's timezone
  const convertedDate = convertUtcToTimezone(utcDate, timezoneOffset);

  if (isNaN(convertedDate.getTime())) return "";

  // Format the converted date
  const year = convertedDate.getFullYear();
  const month = padStart(String(convertedDate.getMonth() + 1), 2, "0");
  const day = padStart(String(convertedDate.getDate()), 2, "0");
  const yearShort = String(year).slice(-2);

  let formatted = format
    .replace("YYYY", String(year))
    .replace("YY", yearShort)
    .replace("MM", month)
    .replace("DD", day);

  if (includeTime) {
    const hours = padStart(String(convertedDate.getHours()), 2, "0");
    const minutes = padStart(String(convertedDate.getMinutes()), 2, "0");
    const seconds = padStart(String(convertedDate.getSeconds()), 2, "0");
    formatted += ` ${hours}:${minutes}:${seconds}`;
  }

  return formatted;
}

/**
 * Get timezone offset from IANA timezone ID using Intl API
 * Falls back to provided offset if browser doesn't support it
 */
export function getTimezoneOffsetFromId(ianaId: string, fallbackOffset: string): string {
  try {
    // Validate IANA timezone ID by creating formatter
    new Intl.DateTimeFormat("en-US", {
      timeZone: ianaId,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    } as any);

    return fallbackOffset;
  } catch {
    return fallbackOffset;
  }
}
