// Number formatting service to manage number format settings globally

interface NumberSettings {
  number_formatting: string;
}

const DEFAULT_NUMBER_FORMAT = "en-US";

// Validate if a locale string is valid
const isValidLocale = (locale: string): boolean => {
  try {
    new Intl.NumberFormat(locale);
    return true;
  } catch {
    return false;
  }
};

// Get number settings from localStorage or return defaults
export const getNumberSettings = (): NumberSettings => {
  try {
    const stored = localStorage.getItem("appSettings");
    if (stored) {
      const settings = JSON.parse(stored);
      const locale = settings.number_formatting;
      if (locale && isValidLocale(locale)) {
        return { number_formatting: locale };
      }
    }
  } catch (error) {
    console.error("Error loading number settings:", error);
  }
  return { number_formatting: DEFAULT_NUMBER_FORMAT };
};

// Format number based on number format preference
export const formatNumber = (
  value: number | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    useGrouping?: boolean;
  }
): string => {
  if (value === null || value === undefined) return "";

  const settings = getNumberSettings();
  const locale = settings.number_formatting;

  const formatOptions: Intl.NumberFormatOptions = {
    useGrouping: options?.useGrouping !== false,
    minimumFractionDigits: options?.minimumFractionDigits,
    maximumFractionDigits: options?.maximumFractionDigits,
  };

  try {
    return new Intl.NumberFormat(locale, formatOptions).format(value);
  } catch (error) {
    console.error("Error formatting number:", error);
    return String(value);
  }
};

// Format currency based on number format preference and currency setting
export const formatCurrency = (
  value: number | null | undefined,
  currencyCode?: string,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string => {
  if (value === null || value === undefined) return "";

  const settings = getNumberSettings();
  const locale = settings.number_formatting;
  const currency = currencyCode || "USD";

  const formatOptions: Intl.NumberFormatOptions = {
    style: "currency",
    currency,
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  };

  try {
    return new Intl.NumberFormat(locale, formatOptions).format(value);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return String(value);
  }
};
