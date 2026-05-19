import { formatDate, formatDateLocale, formatDateWithTimezone } from "../services/dateService";
import { getSettingsTimezoneOffset } from "../utils/settingsHelper";

interface DateFormatterProps {
  date: Date | string | number | null | undefined;
  includeTime?: boolean;
  useLocale?: boolean;
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
  day?: "numeric" | "2-digit";
  className?: string;
  timezone?: string; // timezone offset e.g., "+03:00"
  useUserTimezone?: boolean; // if true, use user's selected timezone from settings
}

/**
 * Reusable component for formatting and displaying dates.
 * Automatically uses the date format settings from the settings page.
 * Optionally converts dates to user's selected timezone.
 *
 * @example
 * <DateFormatter date={new Date()} />
 * // Displays: "2025-01-18" (if YYYY-MM-DD is set as default)
 *
 * <DateFormatter date={new Date()} includeTime />
 * // Displays: "2025-01-18 14:30:00"
 *
 * <DateFormatter date={new Date()} useLocale />
 * // Displays: "Jan 18, 2025" (locale-aware formatting)
 *
 * <DateFormatter date={apiDate} useUserTimezone includeTime />
 * // Displays: "2025-01-18 17:00:00" (converted to user's timezone)
 */
export default function DateFormatter({
  date,
  includeTime = false,
  useLocale = false,
  year,
  month,
  day,
  className = "",
  timezone,
  useUserTimezone = false,
}: DateFormatterProps) {
  // Determine which timezone to use
  let selectedTimezone = timezone;
  if (useUserTimezone && !timezone) {
    // Get user's selected timezone offset from settings
    selectedTimezone = getSettingsTimezoneOffset();
  }

  // If timezone is provided and it looks like an offset ("+03:00"), use timezone-aware formatting
  if (selectedTimezone && /^[+-]\d{2}:\d{2}$/.test(selectedTimezone)) {
    if (!date) return <span className={className}></span>;

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return <span className={className}></span>;

    // Parse timezone offset (e.g., "+03:00" or "-05:00")
    const match = selectedTimezone.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) {
      // Fallback to normal formatting if invalid offset
      const formatted = useLocale
        ? formatDateLocale(date, { includeTime, year, month, day })
        : formatDate(date, { includeTime });
      return <span className={className}>{formatted}</span>;
    }

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    const offsetMinutes = sign * (hours * 60 + minutes);

    // Convert UTC to user's timezone
    const convertedDate = new Date(dateObj.getTime() + offsetMinutes * 60 * 1000);

    // Use locale-based formatting with converted date
    const formatted = useLocale
      ? convertedDate.toLocaleDateString("en-US", {
          year: year || "numeric",
          month: month || "long",
          day: day || "numeric",
          ...(includeTime && {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        })
      : formatDateWithTimezone(date, selectedTimezone, {
          includeTime,
        });

    return <span className={className}>{formatted}</span>;
  }

  // Default behavior (no timezone conversion)
  const formatted = useLocale
    ? formatDateLocale(date, { includeTime, year, month, day })
    : formatDate(date, { includeTime });

  return <span className={className}>{formatted}</span>;
}

