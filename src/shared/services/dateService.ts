// Date service to manage date format settings globally
interface DateSettings {
  date_format: string;
}

const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

// Get date settings from localStorage or return defaults
export const getDateSettings = (): DateSettings => {
  try {
    const stored = localStorage.getItem("appSettings");
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        date_format: settings.date_format || DEFAULT_DATE_FORMAT,
      };
    }
  } catch (error) {
    console.error("Error loading date settings:", error);
  }
  return { date_format: DEFAULT_DATE_FORMAT };
};

// Format date based on date format preference
export const formatDate = (
  date: Date | string | number | null | undefined,
  options?: {
    includeTime?: boolean;
    customFormat?: string;
  }
): string => {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const settings = getDateSettings();
  const format = options?.customFormat || settings.date_format;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const yearShort = String(year).slice(-2);

  let formatted = format
    .replace("YYYY", String(year))
    .replace("YY", yearShort)
    .replace("MM", month)
    .replace("DD", day);

  if (options?.includeTime) {
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    formatted += ` ${hours}:${minutes}:${seconds}`;
  }

  return formatted;
};

// Format date with locale-aware formatting (for display purposes)
export const formatDateLocale = (
  date: Date | string | number | null | undefined,
  options?: {
    includeTime?: boolean;
    year?: "numeric" | "2-digit";
    month?: "numeric" | "2-digit" | "long" | "short" | "narrow";
    day?: "numeric" | "2-digit";
  }
): string => {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  const settings = getDateSettings();

  // Determine locale based on date format
  let locale = "en-US";
  if (
    settings.date_format.includes("/") &&
    settings.date_format.startsWith("MM")
  ) {
    locale = "en-US"; // MM/DD/YYYY
  } else if (
    settings.date_format.includes("/") &&
    settings.date_format.startsWith("DD")
  ) {
    locale = "en-GB"; // DD/MM/YYYY
  } else if (
    settings.date_format.includes("-") &&
    settings.date_format.startsWith("DD")
  ) {
    locale = "en-GB"; // DD-MM-YYYY
  } else if (
    settings.date_format.includes("-") &&
    settings.date_format.startsWith("YYYY")
  ) {
    locale = "en-US"; // YYYY-MM-DD
  }

  const formatOptions: Intl.DateTimeFormatOptions = {
    year:
      options?.year ||
      (settings.date_format.includes("YYYY") ? "numeric" : "2-digit"),
    month:
      options?.month ||
      (settings.date_format.includes("MM") ? "2-digit" : "short"),
    day: options?.day || "2-digit",
  };

  if (options?.includeTime) {
    formatOptions.hour = "2-digit";
    formatOptions.minute = "2-digit";
    formatOptions.second = "2-digit";
  }

  return dateObj.toLocaleDateString(locale, formatOptions);
};

// Format date time
export const formatDateTime = (
  date: Date | string | number | null | undefined
): string => {
  return formatDate(date, { includeTime: true });
};

// Format date with timezone awareness
export const formatDateWithTimezone = (
  date: Date | string | number | null | undefined,
  timezoneOffset: string,
  options?: {
    includeTime?: boolean;
    customFormat?: string;
  }
): string => {
  if (!date) return "";

  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return "";

  // Parse timezone offset (e.g., "+03:00" or "-05:00")
  const match = timezoneOffset.match(/([+-])(\d{2}):(\d{2})/);
  if (!match) return formatDate(date, options); // Fallback if invalid offset

  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  const offsetMinutes = sign * (hours * 60 + minutes);

  // Convert UTC to user's timezone
  const convertedDate = new Date(dateObj.getTime() + offsetMinutes * 60 * 1000);

  const settings = getDateSettings();
  const format = options?.customFormat || settings.date_format;

  const year = convertedDate.getFullYear();
  const month = String(convertedDate.getMonth() + 1).padStart(2, "0");
  const day = String(convertedDate.getDate()).padStart(2, "0");
  const yearShort = String(year).slice(-2);

  let formatted = format
    .replace("YYYY", String(year))
    .replace("YY", yearShort)
    .replace("MM", month)
    .replace("DD", day);

  if (options?.includeTime) {
    const hrs = String(convertedDate.getHours()).padStart(2, "0");
    const mins = String(convertedDate.getMinutes()).padStart(2, "0");
    const secs = String(convertedDate.getSeconds()).padStart(2, "0");
    formatted += ` ${hrs}:${mins}:${secs}`;
  }

  return formatted;
};

