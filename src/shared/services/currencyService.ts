// Currency service to manage currency settings globally
interface CurrencySettings {
  currency: string; // Currency code (e.g., "KES", "USD")
  country: string;
  country_code: string;
  number_formatting: string;
}

const DEFAULT_SETTINGS: CurrencySettings = {
  currency: "KES",
  country: "Kenya",
  country_code: "KE",
  number_formatting: "1,234.56",
};

// Special currency symbols that need custom handling
// (currencies where Intl API might not return the preferred symbol format)
const SPECIAL_CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh", // Kenyan Shilling
  UGX: "USh", // Ugandan Shilling
  TZS: "TSh", // Tanzanian Shilling
  ETB: "Br", // Ethiopian Birr
  RWF: "RF", // Rwandan Franc
  AMD: "֏", // Armenian Dram
};

// Get currency settings from localStorage or return defaults
export const getCurrencySettings = (): CurrencySettings => {
  try {
    const stored = localStorage.getItem("appSettings");
    if (stored) {
      const settings = JSON.parse(stored);
      return {
        currency: settings.currency || DEFAULT_SETTINGS.currency,
        country: settings.country || DEFAULT_SETTINGS.country,
        country_code: settings.country_code || DEFAULT_SETTINGS.country_code,
        number_formatting:
          settings.number_formatting || DEFAULT_SETTINGS.number_formatting,
      };
    }
  } catch (error) {
    console.error("Error loading currency settings:", error);
  }
  return DEFAULT_SETTINGS;
};

// Get currency symbol for a given currency code using Intl API
// This supports ALL currencies dynamically, not just a hardcoded list
export const getCurrencySymbol = (currencyCode?: string): string => {
  const settings = getCurrencySettings();
  const code = currencyCode || settings.currency;

  // Check for special cases first (currencies with custom symbol formats)
  if (SPECIAL_CURRENCY_SYMBOLS[code]) {
    return SPECIAL_CURRENCY_SYMBOLS[code];
  }

  // Use Intl API to get currency symbol dynamically
  try {
    // Try to get symbol from Intl.NumberFormat
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

    // Format a sample amount and extract the currency symbol
    const parts = formatter.formatToParts(0);
    const currencyPart = parts.find((part) => part.type === "currency");

    if (currencyPart && currencyPart.value) {
      return currencyPart.value.trim();
    }
  } catch (error) {
    // If Intl API fails (invalid currency code), fall back to code
    console.warn(`Could not get symbol for currency ${code}:`, error);
  }

  // Fallback: return the currency code itself
  return code;
};

// Format number based on number formatting preference
const formatNumber = (
  value: number,
  format: string,
  decimals: number = 2
): string => {
  if (format === "1,234.56") {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else if (format === "1 234,56") {
    return value.toLocaleString("fr-FR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else if (format === "1.234,56") {
    return value.toLocaleString("de-DE", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } else if (format === "1'234.56") {
    return value.toLocaleString("de-CH", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  // Default to en-US format
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

// Format currency amount
export const formatCurrency = (
  amount: number | string | undefined | null,
  options?: {
    currencyCode?: string;
    showSymbol?: boolean;
    showCode?: boolean;
    decimals?: number;
  }
): string => {
  if (amount === null || amount === undefined || amount === "") {
    return formatCurrency(0, options);
  }

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) {
    return formatCurrency(0, options);
  }

  const settings = getCurrencySettings();
  const currencyCode = options?.currencyCode || settings.currency;
  const showSymbol = options?.showSymbol !== false;
  const showCode = options?.showCode || false;
  const hasFraction = Math.abs(numAmount % 1) > 0;
  const decimals =
    options?.decimals !== undefined ? options.decimals : hasFraction ? 2 : 0;

  // Format number using settings number_formatting preference with correct decimals
  const formattedNumber = formatNumber(
    numAmount,
    settings.number_formatting,
    decimals
  );

  const symbol = getCurrencySymbol(currencyCode);

  if (showCode) {
    return `${formattedNumber} ${currencyCode}`;
  }

  if (showSymbol) {
    // Add space for multi-character symbols (KSh, USh, TSh, etc.)
    // Single-character symbols ($, €, £) typically don't need space
    const needsSpace = symbol.length > 1;
    return needsSpace
      ? `${symbol} ${formattedNumber}`
      : `${symbol}${formattedNumber}`;
  }

  return formattedNumber;
};

// Format currency without symbol (just the number)
export const formatCurrencyAmount = (
  amount: number | string | undefined | null,
  decimals: number = 2
): string => {
  return formatCurrency(amount, { showSymbol: false, decimals });
};
